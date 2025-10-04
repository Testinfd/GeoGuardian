"""
Asset Manager for GeoGuardian
Handles generation and management of visualization assets including GIFs, images, and change detection overlays
"""

import numpy as np
import cv2
import io
import base64
import os
import tempfile
import uuid
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, List, Optional, Tuple, Any
import logging
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


class AssetManager:
    """
    Manages creation and storage of visualization assets for change detection results
    
    Capabilities:
    - Generate before/after comparison GIFs
    - Create change detection overlay images
    - Generate statistical visualizations
    - Handle asset storage and URL generation
    """
    
    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize asset manager
        
        Args:
            storage_path: Path for storing generated assets (defaults to temp directory)
        """
        # Use consistent path for asset storage
        if storage_path is None:
            storage_path = os.path.join(tempfile.gettempdir(), "geoguardian_assets")
        
        self.storage_path = storage_path
        self.assets_url_base = "/assets"  # Base URL for serving assets
        
        # Ensure storage directory exists
        os.makedirs(self.storage_path, exist_ok=True)
        
        logger.info(f"AssetManager initialized with storage path: {self.storage_path}")
    
    async def generate_change_detection_gif(
        self,
        aoi_id: str,
        before_image: np.ndarray,
        after_image: np.ndarray,
        change_mask: np.ndarray,
        detection_results: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate comprehensive change detection GIF with overlays and metadata
        
        Args:
            aoi_id: Area of Interest ID
            before_image: Historical satellite image
            after_image: Recent satellite image  
            change_mask: Binary mask indicating detected changes
            detection_results: Analysis results for overlay information
            metadata: Additional metadata for the visualization
            
        Returns:
            URL path to the generated GIF
        """
        try:
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"change_detection_{aoi_id}_{timestamp}.gif"
            filepath = os.path.join(self.storage_path, filename)
            
            # Normalize images for display
            before_rgb = self._normalize_image_for_display(before_image)
            after_rgb = self._normalize_image_for_display(after_image)
            
            # Resize images if they're too large (for performance)
            max_size = 512
            if before_rgb.shape[0] > max_size or before_rgb.shape[1] > max_size:
                before_rgb = self._resize_image(before_rgb, max_size)
                after_rgb = self._resize_image(after_rgb, max_size)
                change_mask = cv2.resize(
                    change_mask.astype(np.uint8), 
                    (before_rgb.shape[1], before_rgb.shape[0]), 
                    interpolation=cv2.INTER_NEAREST
                ).astype(bool)
            
            # Create frames for the GIF
            frames = []
            
            # Frame 1: Before image with title
            before_frame = self._add_title_to_frame(
                before_rgb.copy(), 
                "BEFORE",
                metadata.get('recent_image_quality', 0.8)
            )
            frames.append(Image.fromarray(before_frame))
            
            # Frame 2: After image with title
            after_frame = self._add_title_to_frame(
                after_rgb.copy(), 
                "AFTER",
                metadata.get('baseline_image_quality', 0.8)
            )
            frames.append(Image.fromarray(after_frame))
            
            # Frame 3: Change detection overlay
            change_overlay = self._create_change_overlay(
                after_rgb, change_mask, detection_results
            )
            change_frame = self._add_title_to_frame(
                change_overlay, 
                "CHANGES DETECTED",
                detection_results.get('overall_confidence', 0.0)
            )
            frames.append(Image.fromarray(change_frame))
            
            # Frame 4: Side-by-side comparison
            comparison_frame = self._create_side_by_side_comparison(
                before_rgb, after_rgb, detection_results, metadata
            )
            frames.append(Image.fromarray(comparison_frame))
            
            # Generate GIF
            if frames:
                frames[0].save(
                    filepath,
                    save_all=True,
                    append_images=frames[1:],
                    duration=1500,  # 1.5 seconds per frame
                    loop=0,
                    optimize=True
                )
                
                logger.info(f"Generated change detection GIF: {filename}")
                return f"{self.assets_url_base}/{filename}"
            else:
                raise ValueError("No frames generated for GIF")
                
        except Exception as e:
            logger.error(f"Error generating change detection GIF: {str(e)}")
            raise
    
    def _normalize_image_for_display(self, image: np.ndarray) -> np.ndarray:
        """
        Normalize satellite image for display (0-255 RGB)
        
        Args:
            image: Input satellite image (can be multi-band)
            
        Returns:
            RGB image normalized to 0-255 range
        """
        # Take first 3 bands as RGB if more bands available
        if image.ndim == 3 and image.shape[2] > 3:
            rgb_image = image[:, :, :3]
        else:
            rgb_image = image
        
        # Handle grayscale
        if rgb_image.ndim == 2:
            rgb_image = np.stack([rgb_image] * 3, axis=-1)
        
        # Normalize to 0-1 range
        if rgb_image.max() > 1.0:
            # Assume 0-10000 range (typical for Sentinel-2)
            rgb_image = np.clip(rgb_image / 3000.0, 0, 1)
        
        # Convert to 0-255 range
        rgb_image = (rgb_image * 255).astype(np.uint8)
        
        # Apply contrast enhancement
        rgb_image = self._enhance_contrast(rgb_image)
        
        return rgb_image
    
    def _enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Apply contrast enhancement to improve visibility"""
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        
        if image.ndim == 3:
            # Convert to LAB color space for better enhancement
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        else:
            enhanced = clahe.apply(image)
        
        return enhanced
    
    def _resize_image(self, image: np.ndarray, max_size: int) -> np.ndarray:
        """
        Resize image while maintaining aspect ratio
        
        Args:
            image: Input image
            max_size: Maximum dimension size
            
        Returns:
            Resized image
        """
        height, width = image.shape[:2]
        
        if height > width:
            new_height = max_size
            new_width = int(width * max_size / height)
        else:
            new_width = max_size
            new_height = int(height * max_size / width)
        
        return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    
    def _create_change_overlay(
        self, 
        base_image: np.ndarray, 
        change_mask: np.ndarray,
        detection_results: Dict[str, Any]
    ) -> np.ndarray:
        """
        Create change detection overlay on base image
        
        Args:
            base_image: Base RGB image
            change_mask: Binary change detection mask
            detection_results: Detection results for color coding
            
        Returns:
            Image with change overlay
        """
        overlay = base_image.copy()
        
        # Determine overlay color based on detection type
        detection_type = detection_results.get('primary_detection_type', 'unknown')
        
        color_map = {
            'vegetation_loss': (255, 0, 0),      # Red for vegetation loss
            'vegetation_gain': (0, 255, 0),      # Green for vegetation gain
            'deforestation': (255, 100, 100),   # Light red for deforestation
            'construction': (255, 165, 0),      # Orange for construction
            'water_quality_change': (0, 100, 255),  # Blue for water changes
            'coastal_erosion': (255, 255, 0),   # Yellow for coastal erosion
            'unknown': (255, 0, 255)            # Magenta for unknown changes
        }
        
        color = color_map.get(detection_type, color_map['unknown'])
        
        # Apply overlay where changes detected
        change_pixels = change_mask > 0
        if np.any(change_pixels):
            # Create semi-transparent overlay
            overlay[change_pixels] = overlay[change_pixels] * 0.6 + np.array(color) * 0.4
        
        return overlay.astype(np.uint8)
    
    def _add_title_to_frame(
        self, 
        frame: np.ndarray, 
        title: str, 
        confidence: float = 0.0
    ) -> np.ndarray:
        """
        Add title and confidence score to frame
        
        Args:
            frame: Input image frame
            title: Title text
            confidence: Confidence score to display
            
        Returns:
            Frame with added title
        """
        # Convert to PIL for text rendering
        pil_image = Image.fromarray(frame)
        draw = ImageDraw.Draw(pil_image)
        
        # Try to load a font, fallback to default
        try:
            font = ImageFont.truetype("arial.ttf", 20)
            small_font = ImageFont.truetype("arial.ttf", 14)
        except:
            try:
                font = ImageFont.load_default()
                small_font = ImageFont.load_default()
            except:
                font = None
                small_font = None
        
        # Add title at the top
        title_text = title
        if font:
            bbox = draw.textbbox((0, 0), title_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        else:
            text_width = len(title_text) * 10
            text_height = 20
        
        x = (frame.shape[1] - text_width) // 2
        y = 10
        
        # Add background rectangle for text
        draw.rectangle([x-5, y-5, x+text_width+5, y+text_height+5], fill=(0, 0, 0, 180))
        
        # Add title text
        draw.text((x, y), title_text, fill=(255, 255, 255), font=font)
        
        # Add confidence score if provided
        if confidence > 0:
            conf_text = f"Confidence: {confidence:.1%}"
            if small_font:
                conf_bbox = draw.textbbox((0, 0), conf_text, font=small_font)
                conf_width = conf_bbox[2] - conf_bbox[0]
            else:
                conf_width = len(conf_text) * 8
            
            conf_x = (frame.shape[1] - conf_width) // 2
            conf_y = y + text_height + 5
            
            draw.rectangle([conf_x-3, conf_y-3, conf_x+conf_width+3, conf_y+15], fill=(0, 0, 0, 180))
            draw.text((conf_x, conf_y), conf_text, fill=(255, 255, 0), font=small_font)
        
        return np.array(pil_image)
    
    def _create_side_by_side_comparison(
        self,
        before_image: np.ndarray,
        after_image: np.ndarray,
        detection_results: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> np.ndarray:
        """
        Create side-by-side comparison frame with statistics
        
        Args:
            before_image: Before image
            after_image: After image  
            detection_results: Detection results
            metadata: Additional metadata
            
        Returns:
            Side-by-side comparison image
        """
        # Ensure both images have the same height
        min_height = min(before_image.shape[0], after_image.shape[0])
        before_resized = cv2.resize(before_image, (before_image.shape[1], min_height))
        after_resized = cv2.resize(after_image, (after_image.shape[1], min_height))
        
        # Create side-by-side layout
        combined_width = before_resized.shape[1] + after_resized.shape[1]
        comparison = np.zeros((min_height, combined_width, 3), dtype=np.uint8)
        
        comparison[:, :before_resized.shape[1]] = before_resized
        comparison[:, before_resized.shape[1]:] = after_resized
        
        # Convert to PIL for text overlay
        pil_image = Image.fromarray(comparison)
        draw = ImageDraw.Draw(pil_image)
        
        # Add labels
        try:
            font = ImageFont.truetype("arial.ttf", 16)
        except:
            font = None
        
        # Label "BEFORE"
        draw.text((10, 10), "BEFORE", fill=(255, 255, 255), font=font)
        
        # Label "AFTER" 
        after_x = before_resized.shape[1] + 10
        draw.text((after_x, 10), "AFTER", fill=(255, 255, 255), font=font)
        
        # Add statistics at the bottom
        stats_y = min_height - 60
        stats_text = [
            f"Confidence: {detection_results.get('overall_confidence', 0.0):.1%}",
            f"Priority: {detection_results.get('priority_level', 'unknown').title()}"
        ]
        
        if metadata:
            analysis_type = metadata.get('analysis_type', 'comprehensive')
            stats_text.append(f"Analysis: {analysis_type.title()}")
        
        for i, text in enumerate(stats_text):
            draw.text((10, stats_y + i * 20), text, fill=(255, 255, 0), font=font)
        
        return np.array(pil_image)
    
    def generate_static_overlay_image(
        self,
        aoi_id: str,
        base_image: np.ndarray,
        detection_results: List[Dict[str, Any]]
    ) -> str:
        """
        Generate static overlay image showing all detections
        
        Args:
            aoi_id: Area of Interest ID
            base_image: Base satellite image
            detection_results: List of detection results
            
        Returns:
            URL path to the generated image
        """
        try:
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"overlay_{aoi_id}_{timestamp}.png"
            filepath = os.path.join(self.storage_path, filename)
            
            # Normalize base image
            display_image = self._normalize_image_for_display(base_image)
            
            # Create overlay for each detection type
            overlay = display_image.copy()
            
            for detection in detection_results:
                if detection.get('change_detected', False):
                    change_mask = np.array(detection.get('change_mask', []))
                    if change_mask.size > 0:
                        overlay = self._create_change_overlay(overlay, change_mask, detection)
            
            # Save as PNG
            cv2.imwrite(filepath, cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
            
            logger.info(f"Generated static overlay image: {filename}")
            return f"{self.assets_url_base}/{filename}"
            
        except Exception as e:
            logger.error(f"Error generating static overlay image: {str(e)}")
            raise
    
    def generate_statistical_chart(
        self,
        aoi_id: str,
        detection_results: List[Dict[str, Any]],
        chart_type: str = "confidence_bars"
    ) -> str:
        """
        Generate statistical visualization chart
        
        Args:
            aoi_id: Area of Interest ID
            detection_results: Detection results to visualize
            chart_type: Type of chart to generate
            
        Returns:
            URL path to generated chart
        """
        try:
            import matplotlib
            matplotlib.use('Agg')  # Use non-interactive backend
            import matplotlib.pyplot as plt
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"chart_{chart_type}_{aoi_id}_{timestamp}.png"
            filepath = os.path.join(self.storage_path, filename)
            
            if chart_type == "confidence_bars":
                # Create confidence bar chart
                algorithms = []
                confidences = []
                
                for detection in detection_results:
                    if detection.get('change_detected', False):
                        algorithms.append(detection.get('algorithm', 'Unknown'))
                        confidences.append(detection.get('confidence', 0))
                
                if algorithms:
                    plt.figure(figsize=(10, 6))
                    bars = plt.bar(algorithms, confidences, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'])
                    plt.title('Detection Confidence by Algorithm')
                    plt.ylabel('Confidence Score')
                    plt.ylim(0, 1)
                    
                    # Add value labels on bars
                    for bar, conf in zip(bars, confidences):
                        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                               f'{conf:.2f}', ha='center', va='bottom')
                    
                    plt.tight_layout()
                    plt.savefig(filepath, dpi=150, bbox_inches='tight')
                    plt.close()
            
            logger.info(f"Generated statistical chart: {filename}")
            return f"{self.assets_url_base}/{filename}"
            
        except Exception as e:
            logger.error(f"Error generating statistical chart: {str(e)}")
            raise
    
    def cleanup_old_assets(self, days_old: int = 7):
        """
        Clean up assets older than specified days
        
        Args:
            days_old: Remove assets older than this many days
        """
        try:
            import time
            import glob
            
            cutoff_time = time.time() - (days_old * 24 * 60 * 60)
            
            # Find all asset files
            patterns = [
                os.path.join(self.storage_path, "*.gif"),
                os.path.join(self.storage_path, "*.png"),
                os.path.join(self.storage_path, "*.jpg"),
            ]
            
            cleaned_count = 0
            for pattern in patterns:
                for filepath in glob.glob(pattern):
                    if os.path.getmtime(filepath) < cutoff_time:
                        try:
                            os.remove(filepath)
                            cleaned_count += 1
                        except OSError:
                            pass
            
            logger.info(f"Cleaned up {cleaned_count} old asset files")
            
        except Exception as e:
            logger.error(f"Error during asset cleanup: {str(e)}")
    
    def get_asset_info(self, asset_url: str) -> Dict[str, Any]:
        """
        Get information about an asset
        
        Args:
            asset_url: Asset URL path
            
        Returns:
            Dictionary with asset information
        """
        try:
            # Extract filename from URL
            filename = asset_url.split('/')[-1]
            filepath = os.path.join(self.storage_path, filename)
            
            if os.path.exists(filepath):
                stat = os.stat(filepath)
                return {
                    "filename": filename,
                    "size_bytes": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_ctime),
                    "modified_at": datetime.fromtimestamp(stat.st_mtime),
                    "exists": True
                }
            else:
                return {"exists": False}
                
        except Exception as e:
            logger.error(f"Error getting asset info: {str(e)}")
            return {"exists": False, "error": str(e)}