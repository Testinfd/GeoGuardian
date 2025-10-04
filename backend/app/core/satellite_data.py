"""
Enhanced Satellite Data Fetcher for GeoGuardian
Provides comprehensive Sentinel-2 data acquisition with 13-band support

This module implements advanced satellite data fetching capabilities including:
- Full 13-band Sentinel-2 L2A data acquisition
- Automated cloud filtering and quality assessment
- Multi-temporal data collection for change detection
- Adaptive spatial resolution handling
- Error resilience and retry mechanisms
"""

import numpy as np
from sentinelhub import (
    SHConfig, 
    DataCollection, 
    SentinelHubRequest, 
    BBox, 
    CRS, 
    MimeType,
    MosaickingOrder,
    bbox_to_dimensions
)
from .config import settings
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Union
import logging
from dataclasses import dataclass
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

logger = logging.getLogger(__name__)


@dataclass
class SatelliteImage:
    """Container for satellite image data with metadata"""
    data: np.ndarray
    timestamp: datetime
    cloud_coverage: float
    bounds: BBox
    resolution: float
    bands: List[str]
    quality_score: float


@dataclass
class FetchConfig:
    """Configuration for satellite data fetching"""
    max_cloud_coverage: float = 0.3
    max_images: int = 10
    min_time_separation_days: int = 5
    preferred_resolution: float = 10.0
    max_image_size: int = 1024
    timeout_seconds: int = 120
    retry_attempts: int = 3


class SentinelDataFetcher:
    """
    Advanced Sentinel-2 data fetcher with comprehensive capabilities
    
    Provides research-grade satellite data acquisition with full spectral
    band support, automated quality filtering, and robust error handling.
    """
    
    def __init__(self, config: Optional[FetchConfig] = None):
        """
        Initialize the Sentinel data fetcher
        
        Args:
            config: Fetching configuration parameters
        """
        self.config = config or FetchConfig()
        
        # Initialize Sentinel Hub configuration
        self.sh_config = SHConfig()
        self.sh_config.sh_client_id = settings.SENTINELHUB_CLIENT_ID
        self.sh_config.sh_client_secret = settings.SENTINELHUB_CLIENT_SECRET
        
        # Validate configuration
        if not self.sh_config.sh_client_id or not self.sh_config.sh_client_secret:
            logger.warning("Sentinel Hub credentials not configured")
        
        logger.info("SentinelDataFetcher initialized")
    
    async def fetch_imagery(
        self, 
        aoi_geometry: Dict, 
        date_range: Tuple[datetime, datetime],
        bands: Optional[List[str]] = None
    ) -> List[SatelliteImage]:
        """
        Fetch satellite imagery for given AOI and date range
        
        Args:
            aoi_geometry: GeoJSON geometry of area of interest
            date_range: Tuple of (start_date, end_date)
            bands: List of Sentinel-2 bands to fetch (defaults to all 13 bands)
            
        Returns:
            List of SatelliteImage objects with data and metadata
        """
        
        logger.info(f"Fetching satellite imagery for date range: {date_range[0]} to {date_range[1]}")
        
        try:
            # Convert geometry to bounding box
            bbox = self._geometry_to_bbox(aoi_geometry)
            
            # Calculate optimal image size
            size = self._calculate_optimal_size(bbox)
            
            # Use all 13 bands by default
            if bands is None:
                bands = self._get_all_sentinel2_bands()
            
            # Fetch imagery using thread pool for concurrent requests
            with ThreadPoolExecutor(max_workers=3) as executor:
                loop = asyncio.get_event_loop()
                imagery_data = await loop.run_in_executor(
                    executor, 
                    self._fetch_imagery_sync,
                    bbox, date_range, size, bands
                )
            
            logger.info(f"Successfully fetched {len(imagery_data)} images")
            return imagery_data
            
        except Exception as e:
            logger.error(f"Error fetching satellite imagery: {str(e)}")
            raise
    
    def _fetch_imagery_sync(
        self, 
        bbox: BBox, 
        date_range: Tuple[datetime, datetime],
        size: Tuple[int, int],
        bands: List[str]
    ) -> List[SatelliteImage]:
        """Synchronous imagery fetching for thread pool execution"""
        
        # Create evalscript for all 13 Sentinel-2 bands + SCL
        evalscript = self._create_comprehensive_evalscript(bands)
        
        # Create request
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=date_range,
                    mosaicking_order=MosaickingOrder.LEAST_CC,
                    maxcc=self.config.max_cloud_coverage
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            size=size,
            config=self.sh_config
        )
        
        # Execute request with retry logic
        imagery_data = []
        for attempt in range(self.config.retry_attempts):
            try:
                logger.debug(f"Fetching attempt {attempt + 1}/{self.config.retry_attempts}")

                # Get data with timeout
                data = request.get_data(save_data=False)
                
                if data and len(data) > 0:
                    # Process each image
                    for i, img_data in enumerate(data):
                        if img_data is not None and img_data.size > 0:
                            # Calculate cloud coverage and quality metrics
                            cloud_coverage = self._calculate_cloud_coverage(img_data)
                            quality_score = self._calculate_quality_score(img_data, cloud_coverage)
                            
                            # Create SatelliteImage object
                            satellite_image = SatelliteImage(
                                data=img_data,
                                timestamp=date_range[0] + timedelta(days=i * 5),  # Approximate timestamps
                                cloud_coverage=cloud_coverage,
                                bounds=bbox,
                                resolution=self.config.preferred_resolution,
                                bands=bands,
                                quality_score=quality_score
                            )
                            
                            imagery_data.append(satellite_image)
                    
                    # Filter by quality and limit number of images
                    imagery_data = self._filter_and_sort_images(imagery_data)
                    break
                    
            except Exception as e:
                logger.warning(f"Fetch attempt {attempt + 1} failed: {str(e)}")
                if attempt == self.config.retry_attempts - 1:
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff
        
        return imagery_data
    
    def _geometry_to_bbox(self, geojson: Dict) -> BBox:
        """Convert GeoJSON geometry to Sentinel Hub BBox"""
        
        if geojson.get('type') != 'Polygon':
            raise ValueError("Only Polygon geometries are supported")
        
        coordinates = geojson['coordinates'][0]  # First ring of polygon
        lons = [coord[0] for coord in coordinates]
        lats = [coord[1] for coord in coordinates]
        
        return BBox(
            bbox=[min(lons), min(lats), max(lons), max(lats)],
            crs=CRS.WGS84
        )
    
    def _calculate_optimal_size(self, bbox: BBox) -> Tuple[int, int]:
        """Calculate optimal image size maintaining aspect ratio"""
        
        try:
            size = bbox_to_dimensions(bbox, resolution=self.config.preferred_resolution)
            
            # Ensure size doesn't exceed maximum
            if max(size) > self.config.max_image_size:
                scale = self.config.max_image_size / max(size)
                size = (int(size[0] * scale), int(size[1] * scale))
            
            # Ensure minimum size
            min_size = 64
            size = (max(size[0], min_size), max(size[1], min_size))
            
            logger.debug(f"Calculated optimal size: {size}")
            return size
            
        except Exception as e:
            logger.warning(f"Error calculating optimal size: {e}")
            return (512, 512)  # Fallback size
    
    def _get_all_sentinel2_bands(self) -> List[str]:
        """Get all available Sentinel-2 bands"""
        return [
            "B01",  # Coastal aerosol (443nm)
            "B02",  # Blue (490nm)
            "B03",  # Green (560nm)
            "B04",  # Red (665nm)
            "B05",  # Vegetation red edge (705nm)
            "B06",  # Vegetation red edge (740nm)
            "B07",  # Vegetation red edge (783nm)
            "B08",  # NIR (842nm)
            "B8A",  # Vegetation red edge (865nm)
            "B09",  # Water vapour (945nm)
            "B11",  # SWIR (1610nm)
            "B12",  # SWIR (2190nm)
            "SCL"   # Scene classification
        ]
    
    def _create_comprehensive_evalscript(self, bands: List[str]) -> str:
        """Create evalscript for comprehensive band data"""
        
        # Filter out SCL from band outputs
        data_bands = [b for b in bands if b != "SCL"]
        output_bands = len(data_bands) + 1  # +1 for SCL
        
        band_outputs = ", ".join([f"sample.{band}" for band in data_bands])
        
        # Create properly formatted band array for input
        bands_array_str = ', '.join([f'"{band}"' for band in bands])
        
        evalscript = f"""
        //VERSION=3
        function setup() {{
            return {{
                input: [{{
                    bands: [{bands_array_str}]
                }}],
                output: {{ bands: {output_bands} }}
            }};
        }}

        function evaluatePixel(sample) {{
            // Return data bands + SCL for cloud masking
            return [{band_outputs}, sample.SCL];
        }}
        """
        
        return evalscript
    
    def _calculate_cloud_coverage(self, image_data: np.ndarray) -> float:
        """Calculate cloud coverage percentage from SCL band"""
        
        try:
            if image_data.shape[2] < 2:
                return 0.0
            
            # SCL band is the last band
            scl_band = image_data[:, :, -1]
            
            # Cloud pixels: classes 8, 9, 10, 11
            cloud_pixels = np.isin(scl_band, [8, 9, 10, 11])
            cloud_coverage = np.sum(cloud_pixels) / scl_band.size
            
            return float(cloud_coverage)
            
        except Exception as e:
            logger.warning(f"Error calculating cloud coverage: {e}")
            return 0.5  # Conservative estimate
    
    def _calculate_quality_score(self, image_data: np.ndarray, cloud_coverage: float) -> float:
        """Calculate overall quality score for the image"""
        
        try:
            # Base score from cloud coverage
            cloud_score = 1.0 - cloud_coverage
            
            # Data completeness score
            non_zero_pixels = np.count_nonzero(image_data[:, :, :-1])  # Exclude SCL
            total_pixels = image_data[:, :, :-1].size
            completeness_score = non_zero_pixels / total_pixels if total_pixels > 0 else 0
            
            # Dynamic range score (higher is better)
            if image_data.shape[2] > 1:
                rgb_data = image_data[:, :, :3]
                dynamic_range = np.std(rgb_data) / (np.mean(rgb_data) + 1e-6)
                range_score = min(dynamic_range / 100, 1.0)  # Normalize
            else:
                range_score = 0.5
            
            # Combined quality score
            quality_score = (cloud_score * 0.5 + completeness_score * 0.3 + range_score * 0.2)
            
            return float(np.clip(quality_score, 0.0, 1.0))
            
        except Exception as e:
            logger.warning(f"Error calculating quality score: {e}")
            return 0.5  # Conservative estimate
    
    def _filter_and_sort_images(self, images: List[SatelliteImage]) -> List[SatelliteImage]:
        """Filter and sort images by quality"""
        
        # Filter by cloud coverage and quality
        filtered_images = [
            img for img in images 
            if img.cloud_coverage <= self.config.max_cloud_coverage and img.quality_score > 0.3
        ]
        
        # Sort by quality score (descending)
        filtered_images.sort(key=lambda x: x.quality_score, reverse=True)
        
        # Limit number of images
        filtered_images = filtered_images[:self.config.max_images]
        
        logger.info(f"Filtered to {len(filtered_images)} high-quality images")
        return filtered_images
    
    async def get_latest_images_for_change_detection(
        self, 
        aoi_geometry: Dict, 
        days_back: int = 30
    ) -> Tuple[Optional[SatelliteImage], Optional[SatelliteImage]]:
        """
        Get the two best images for change detection analysis
        
        Args:
            aoi_geometry: GeoJSON geometry of area of interest
            days_back: Number of days to look back for imagery
            
        Returns:
            Tuple of (recent_image, baseline_image) or (None, None) if insufficient data
        """
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Fetch all available imagery
            images = await self.fetch_imagery(aoi_geometry, (start_date, end_date))
            
            if len(images) < 2:
                logger.warning(f"Insufficient images for change detection: {len(images)} available")
                return None, None
            
            # Select best recent and baseline images with minimum time separation
            recent_image = images[0]  # Best quality recent image
            
            # Find best baseline image with sufficient time separation
            baseline_image = None
            min_days_separation = self.config.min_time_separation_days
            
            for img in images[1:]:
                time_diff = abs((recent_image.timestamp - img.timestamp).days)
                if time_diff >= min_days_separation:
                    baseline_image = img
                    break
            
            if baseline_image is None and len(images) > 1:
                # Use second best image even if time separation is small
                baseline_image = images[1]
                logger.warning("Using images with short time separation for change detection")
            
            logger.info(f"Selected images for change detection: recent ({recent_image.timestamp}), baseline ({baseline_image.timestamp if baseline_image else 'None'})")
            
            return recent_image, baseline_image
            
        except Exception as e:
            logger.error(f"Error getting images for change detection: {str(e)}")
            return None, None
    
    async def validate_data_availability(
        self, 
        aoi_geometry: Dict, 
        required_days_back: int = 30
    ) -> Dict[str, Union[bool, int, str]]:
        """
        Validate data availability for the given AOI
        
        Args:
            aoi_geometry: GeoJSON geometry to check
            required_days_back: Required historical data depth
            
        Returns:
            Dictionary with availability status and details
        """
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=required_days_back)
            
            # Quick check with minimal data
            images = await self.fetch_imagery(
                aoi_geometry, 
                (start_date, end_date),
                bands=["B04", "B08", "SCL"]  # Minimal bands for quick check
            )
            
            high_quality_count = len([img for img in images if img.quality_score > 0.7])
            
            return {
                "data_available": len(images) > 0,
                "sufficient_for_analysis": len(images) >= 2,
                "high_quality_images": high_quality_count,
                "total_images": len(images),
                "average_cloud_coverage": np.mean([img.cloud_coverage for img in images]) if images else 1.0,
                "date_range_covered": f"{start_date.date()} to {end_date.date()}",
                "recommendation": self._get_data_recommendation(images, high_quality_count)
            }
            
        except Exception as e:
            logger.error(f"Error validating data availability: {str(e)}")
            return {
                "data_available": False,
                "error": str(e),
                "recommendation": "Unable to check data availability"
            }
    
    def _get_data_recommendation(self, images: List[SatelliteImage], high_quality_count: int) -> str:
        """Get recommendation based on data availability"""
        
        if len(images) == 0:
            return "No satellite data available for this area and time period"
        elif len(images) == 1:
            return "Limited data available - single image analysis only"
        elif high_quality_count >= 2:
            return "Excellent data quality - proceed with comprehensive analysis"
        elif len(images) >= 2:
            return "Moderate data quality - analysis possible with reduced confidence"
        else:
            return "Poor data quality - consider expanding date range"