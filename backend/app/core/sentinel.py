from sentinelhub import (
    SHConfig, 
    DataCollection, 
    SentinelHubRequest, 
    BBox, 
    CRS, 
    MimeType,
    bbox_to_dimensions
)
from .config import settings
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Optional
import base64
from io import BytesIO
from PIL import Image


class SentinelHubClient:
    def __init__(self):
        self.config = SHConfig()
        self.config.sh_client_id = settings.SENTINELHUB_CLIENT_ID
        self.config.sh_client_secret = settings.SENTINELHUB_CLIENT_SECRET
    
    def get_bbox_from_geojson(self, geojson: dict) -> BBox:
        """Extract bounding box from GeoJSON polygon"""
        coordinates = geojson["coordinates"][0]  # First ring of polygon
        lons = [coord[0] for coord in coordinates]
        lats = [coord[1] for coord in coordinates]
        
        return BBox(
            bbox=[min(lons), min(lats), max(lons), max(lats)],
            crs=CRS.WGS84
        )
    
    def get_optimal_size(self, bbox: BBox, max_size: int = 512) -> Tuple[int, int]:
        """Calculate optimal image size maintaining aspect ratio"""
        size = bbox_to_dimensions(bbox, resolution=10)  # 10m resolution
        
        # Scale down if too large
        if max(size) > max_size:
            scale = max_size / max(size)
            size = (int(size[0] * scale), int(size[1] * scale))
        
        return size
    
    def fetch_sentinel2_data(
        self, 
        bbox: BBox, 
        date_range: Tuple[datetime, datetime],
        size: Tuple[int, int]
    ) -> Optional[np.ndarray]:
        """Fetch Sentinel-2 data for given bbox and date range"""
        
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: ["B02", "B03", "B04", "B08", "SCL"],
                output: { bands: 4 }
            };
        }

        function evaluatePixel(sample) {
            // Skip clouds and cloud shadows
            if (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10 || sample.SCL == 11) {
                return [0, 0, 0, 0];
            }
            
            // Return RGB + NIR
            return [sample.B04, sample.B03, sample.B02, sample.B08];
        }
        """
        
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=date_range,
                    maxcc=0.3  # Max 30% cloud coverage
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            size=size,
            config=self.config
        )
        
        try:
            data = request.get_data()
            if data and len(data) > 0:
                return data[0]  # Return the first (and only) image
            return None
        except Exception as e:
            print(f"Error fetching Sentinel-2 data: {e}")
            return None
    
    def get_latest_images(self, geojson: dict) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """Get the two most recent cloud-free images"""
        bbox = self.get_bbox_from_geojson(geojson)
        size = self.get_optimal_size(bbox)
        
        # Get current date and calculate date ranges
        end_date = datetime.now()
        
        # Try to get recent image (last 10 days)
        recent_start = end_date - timedelta(days=10)
        recent_image = self.fetch_sentinel2_data(bbox, (recent_start, end_date), size)
        
        # Try to get older image (11-30 days ago)
        older_start = end_date - timedelta(days=30)
        older_end = end_date - timedelta(days=11)
        older_image = self.fetch_sentinel2_data(bbox, (older_start, older_end), size)
        
        return recent_image, older_image
    
    def calculate_ndvi(self, image: np.ndarray) -> np.ndarray:
        """Calculate NDVI from RGB+NIR image"""
        if image.shape[2] < 4:
            raise ValueError("Image must have at least 4 bands (RGB + NIR)")
        
        red = image[:, :, 0].astype(float)
        nir = image[:, :, 3].astype(float)
        
        # Avoid division by zero
        denominator = nir + red
        ndvi = np.where(
            denominator != 0,
            (nir - red) / denominator,
            0
        )
        
        return ndvi
    
    def detect_changes(
        self, 
        image1: np.ndarray, 
        image2: np.ndarray
    ) -> Tuple[np.ndarray, str, float]:
        """Detect changes between two images"""
        ndvi1 = self.calculate_ndvi(image1)
        ndvi2 = self.calculate_ndvi(image2)
        
        # Calculate NDVI difference
        ndvi_diff = ndvi2 - ndvi1
        
        # Count pixels for different change types
        construction_pixels = np.sum(ndvi_diff < -0.15)
        bloom_pixels = np.sum(ndvi_diff > 0.20)
        total_pixels = ndvi_diff.size
        
        # Determine dominant change type and confidence
        construction_ratio = construction_pixels / total_pixels
        bloom_ratio = bloom_pixels / total_pixels
        
        if construction_ratio > bloom_ratio and construction_ratio > 0.05:
            return ndvi_diff, "construction", min(construction_ratio * 5, 1.0)
        elif bloom_ratio > 0.05:
            return ndvi_diff, "algal_bloom", min(bloom_ratio * 5, 1.0)
        else:
            return ndvi_diff, "trash", max(construction_ratio, bloom_ratio) * 3
    
    def create_change_visualization(
        self, 
        image1: np.ndarray, 
        image2: np.ndarray, 
        ndvi_diff: np.ndarray
    ) -> str:
        """Create before/after visualization as base64 encoded image"""
        # Create RGB composites
        rgb1 = np.stack([image1[:, :, 0], image1[:, :, 1], image1[:, :, 2]], axis=2)
        rgb2 = np.stack([image2[:, :, 0], image2[:, :, 1], image2[:, :, 2]], axis=2)
        
        # Normalize to 0-255
        rgb1 = ((rgb1 / rgb1.max()) * 255).astype(np.uint8)
        rgb2 = ((rgb2 / rgb2.max()) * 255).astype(np.uint8)
        
        # Create side-by-side comparison
        comparison = np.hstack([rgb1, rgb2])
        
        # Convert to PIL Image
        pil_image = Image.fromarray(comparison)
        
        # Convert to base64
        buffer = BytesIO()
        pil_image.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"


# Global instance
sentinel_client = SentinelHubClient()
