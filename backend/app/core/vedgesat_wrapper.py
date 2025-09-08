"""
VedgeSat Wrapper for GeoGuardian
Provides coastal change detection capabilities inspired by VedgeSat methodology

This wrapper implements edge-based change detection algorithms optimized for
coastal erosion and accretion monitoring using satellite imagery.
"""

import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class VedgeSatConfig:
    """Configuration for VedgeSat analysis"""
    edge_threshold_low: int = 50       # Low threshold for Canny edge detection
    edge_threshold_high: int = 150     # High threshold for Canny edge detection
    morphology_kernel_size: int = 3    # Kernel size for morphological operations
    minimum_contour_area: int = 100    # Minimum contour area to consider
    erosion_accretion_threshold: float = 0.02  # Threshold for significant change (2%)
    gaussian_blur_kernel: int = 3      # Gaussian blur kernel size
    median_filter_kernel: int = 3      # Median filter kernel size


class VedgeSatWrapper:
    """
    VedgeSat-inspired coastal change detection wrapper
    
    Implements edge-based analysis for detecting coastal erosion and accretion
    using computer vision techniques adapted for satellite imagery analysis.
    
    Key Features:
    - Multi-scale edge detection
    - Morphological analysis for coastal boundary extraction
    - Quantitative change measurement
    - Erosion vs accretion classification
    """
    
    def __init__(self, config: Optional[VedgeSatConfig] = None):
        """
        Initialize VedgeSat wrapper
        
        Args:
            config: VedgeSat configuration parameters
        """
        self.config = config or VedgeSatConfig()
        logger.info("VedgeSatWrapper initialized with edge-based coastal analysis")
    
    def analyze_coastal_changes(
        self,
        before_image: np.ndarray,
        after_image: np.ndarray,
        geojson: Dict[str, Any],
        water_mask: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive coastal change analysis
        
        Args:
            before_image: Historical satellite image
            after_image: Recent satellite image
            geojson: AOI geometry for spatial context
            water_mask: Optional water body mask for improved accuracy
            
        Returns:
            Comprehensive coastal change analysis results
        """
        try:
            logger.info("Starting VedgeSat coastal change analysis")
            
            # Validate inputs
            if before_image.shape != after_image.shape:
                raise ValueError("Before and after images must have the same dimensions")
            
            # Preprocess images
            before_processed = self._preprocess_image(before_image)
            after_processed = self._preprocess_image(after_image)
            
            # Generate water masks if not provided
            if water_mask is None:
                water_mask_before = self._generate_water_mask(before_processed)
                water_mask_after = self._generate_water_mask(after_processed)
            else:
                water_mask_before = water_mask_after = water_mask
            
            # Extract coastlines
            coastline_before = self._extract_coastline(before_processed, water_mask_before)
            coastline_after = self._extract_coastline(after_processed, water_mask_after)
            
            # Analyze changes
            change_analysis = self._analyze_coastline_changes(
                coastline_before, coastline_after, before_processed.shape
            )
            
            # Calculate erosion and accretion areas
            erosion_accretion = self._calculate_erosion_accretion(
                water_mask_before, water_mask_after
            )
            
            # Generate comprehensive results
            results = {
                "success": True,
                "analysis_timestamp": datetime.now().isoformat(),
                "change_detected": change_analysis["change_detected"],
                "change_type": change_analysis["change_type"],
                "change_magnitude": change_analysis["change_magnitude"],
                "confidence": change_analysis["confidence"],
                "coastline_analysis": {
                    "before_coastline_length": change_analysis["before_length"],
                    "after_coastline_length": change_analysis["after_length"],
                    "length_change_meters": change_analysis["length_change"],
                    "length_change_percentage": change_analysis["length_change_percentage"]
                },
                "erosion_accretion": erosion_accretion,
                "change_stats": change_analysis.get("change_stats", {}),
                "before_analysis": {
                    "coastline_points": change_analysis.get("before_points", 0),
                    "water_area_pixels": int(np.sum(water_mask_before)),
                    "metadata": {
                        "processing_method": "vedgesat_edge_detection",
                        "edge_threshold_low": self.config.edge_threshold_low,
                        "edge_threshold_high": self.config.edge_threshold_high
                    }
                },
                "after_analysis": {
                    "coastline_points": change_analysis.get("after_points", 0),
                    "water_area_pixels": int(np.sum(water_mask_after)),
                    "metadata": {
                        "processing_method": "vedgesat_edge_detection",
                        "edge_threshold_low": self.config.edge_threshold_low,
                        "edge_threshold_high": self.config.edge_threshold_high
                    }
                }
            }
            
            logger.info(f"VedgeSat analysis completed. Change detected: {change_analysis['change_detected']}")
            return results
            
        except Exception as e:
            logger.error(f"Error in VedgeSat coastal analysis: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "analysis_timestamp": datetime.now().isoformat()
            }
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess satellite image for coastal analysis
        
        Args:
            image: Input satellite image
            
        Returns:
            Preprocessed image optimized for edge detection
        """
        # Convert to grayscale if needed
        if image.ndim == 3:
            if image.shape[2] > 3:
                # Use NIR, Red, Green bands for better water/land contrast
                gray = cv2.cvtColor(image[:,:,:3], cv2.COLOR_RGB2GRAY)
            else:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image.copy()
        
        # Normalize to 0-255 range
        if gray.max() <= 1.0:
            gray = (gray * 255).astype(np.uint8)
        elif gray.max() > 255:
            gray = ((gray / gray.max()) * 255).astype(np.uint8)
        
        # Apply preprocessing filters
        # Gaussian blur to reduce noise
        if self.config.gaussian_blur_kernel > 0:
            gray = cv2.GaussianBlur(gray, (self.config.gaussian_blur_kernel, self.config.gaussian_blur_kernel), 0)
        
        # Median filter for salt-and-pepper noise
        if self.config.median_filter_kernel > 0:
            gray = cv2.medianBlur(gray, self.config.median_filter_kernel)
        
        return gray
    
    def _generate_water_mask(self, image: np.ndarray) -> np.ndarray:
        """
        Generate water body mask using thresholding and morphological operations
        
        Args:
            image: Preprocessed grayscale image
            
        Returns:
            Binary mask where True indicates water
        """
        # Use Otsu's thresholding for automatic water/land separation
        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Water is typically darker, so invert if needed
        water_mean = np.mean(image[binary == 255])
        land_mean = np.mean(image[binary == 0])
        
        if water_mean > land_mean:
            # Invert the binary mask
            binary = 255 - binary
        
        # Morphological operations to clean up the mask
        kernel = np.ones((self.config.morphology_kernel_size, self.config.morphology_kernel_size), np.uint8)
        
        # Remove small noise
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        # Fill small holes
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return (binary == 255).astype(bool)
    
    def _extract_coastline(self, image: np.ndarray, water_mask: np.ndarray) -> np.ndarray:
        """
        Extract coastline using edge detection and contour analysis
        
        Args:
            image: Preprocessed image
            water_mask: Water body mask
            
        Returns:
            Binary image with coastline edges
        """
        # Apply Canny edge detection
        edges = cv2.Canny(
            image,
            self.config.edge_threshold_low,
            self.config.edge_threshold_high
        )
        
        # Create water boundary mask
        kernel = np.ones((3, 3), np.uint8)
        water_boundary = cv2.morphologyEx(water_mask.astype(np.uint8), cv2.MORPH_GRADIENT, kernel)
        
        # Combine edge detection with water boundary
        coastline_edges = cv2.bitwise_and(edges, water_boundary * 255)
        
        # Clean up the coastline using morphological operations
        kernel_small = np.ones((2, 2), np.uint8)
        coastline_edges = cv2.morphologyEx(coastline_edges, cv2.MORPH_CLOSE, kernel_small)
        
        return coastline_edges
    
    def _analyze_coastline_changes(
        self,
        coastline_before: np.ndarray,
        coastline_after: np.ndarray,
        image_shape: Tuple[int, int]
    ) -> Dict[str, Any]:
        """
        Analyze changes between two coastline extractions
        
        Args:
            coastline_before: Historical coastline edges
            coastline_after: Recent coastline edges
            image_shape: Image dimensions for normalization
            
        Returns:
            Comprehensive change analysis results
        """
        # Find contours for each coastline
        contours_before, _ = cv2.findContours(coastline_before, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours_after, _ = cv2.findContours(coastline_after, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours by minimum area
        contours_before = [c for c in contours_before if cv2.contourArea(c) >= self.config.minimum_contour_area]
        contours_after = [c for c in contours_after if cv2.contourArea(c) >= self.config.minimum_contour_area]
        
        # Calculate coastline lengths
        length_before = sum(cv2.arcLength(contour, False) for contour in contours_before)
        length_after = sum(cv2.arcLength(contour, False) for contour in contours_after)
        
        # Calculate change metrics
        length_change = length_after - length_before
        length_change_percentage = (length_change / length_before * 100) if length_before > 0 else 0
        
        # Calculate spatial change metrics
        total_pixels = image_shape[0] * image_shape[1]
        before_pixels = np.sum(coastline_before > 0)
        after_pixels = np.sum(coastline_after > 0)
        
        pixel_change = after_pixels - before_pixels
        pixel_change_percentage = (pixel_change / total_pixels * 100) if total_pixels > 0 else 0
        
        # Determine change type and magnitude
        change_magnitude = abs(length_change_percentage)
        
        if change_magnitude >= self.config.erosion_accretion_threshold * 100:
            change_detected = True
            if length_change > 0:
                change_type = "coastal_accretion"
            else:
                change_type = "coastal_erosion"
        else:
            change_detected = False
            change_type = "stable_coastline"
        
        # Calculate confidence based on multiple factors
        confidence = min(
            change_magnitude / (self.config.erosion_accretion_threshold * 100),
            1.0
        )
        
        # Additional statistics
        change_stats = {
            "contours_before": len(contours_before),
            "contours_after": len(contours_after),
            "coastline_pixels_before": int(before_pixels),
            "coastline_pixels_after": int(after_pixels),
            "pixel_change": int(pixel_change),
            "pixel_change_percentage": pixel_change_percentage
        }
        
        return {
            "change_detected": change_detected,
            "change_type": change_type,
            "change_magnitude": change_magnitude,
            "confidence": confidence,
            "before_length": length_before,
            "after_length": length_after,
            "length_change": length_change,
            "length_change_percentage": length_change_percentage,
            "before_points": int(before_pixels),
            "after_points": int(after_pixels),
            "change_stats": change_stats
        }
    
    def _calculate_erosion_accretion(
        self,
        water_mask_before: np.ndarray,
        water_mask_after: np.ndarray
    ) -> Dict[str, Any]:
        """
        Calculate detailed erosion and accretion areas
        
        Args:
            water_mask_before: Historical water mask
            water_mask_after: Recent water mask
            
        Returns:
            Erosion and accretion analysis results
        """
        # Calculate change areas
        erosion_mask = water_mask_before & ~water_mask_after  # Was water, now land
        accretion_mask = ~water_mask_before & water_mask_after  # Was land, now water
        
        # Calculate areas in pixels
        erosion_area_pixels = np.sum(erosion_mask)
        accretion_area_pixels = np.sum(accretion_mask)
        total_pixels = water_mask_before.size
        
        # Calculate percentages
        erosion_percentage = (erosion_area_pixels / total_pixels) * 100
        accretion_percentage = (accretion_area_pixels / total_pixels) * 100
        
        # Net change calculation
        net_change_pixels = accretion_area_pixels - erosion_area_pixels
        net_change_percentage = (net_change_pixels / total_pixels) * 100
        
        # Determine dominant process
        if erosion_area_pixels > accretion_area_pixels * 1.5:
            dominant_process = "erosion"
        elif accretion_area_pixels > erosion_area_pixels * 1.5:
            dominant_process = "accretion"
        else:
            dominant_process = "balanced"
        
        return {
            "erosion_area_pixels": int(erosion_area_pixels),
            "accretion_area_pixels": int(accretion_area_pixels),
            "net_change_pixels": int(net_change_pixels),
            "erosion_percentage": erosion_percentage,
            "accretion_percentage": accretion_percentage,
            "net_change_percentage": net_change_percentage,
            "dominant_process": dominant_process,
            "total_change_area": int(erosion_area_pixels + accretion_area_pixels),
            "total_change_percentage": erosion_percentage + accretion_percentage
        }
    
    def generate_change_visualization(
        self,
        before_image: np.ndarray,
        after_image: np.ndarray,
        coastline_before: np.ndarray,
        coastline_after: np.ndarray,
        erosion_mask: np.ndarray,
        accretion_mask: np.ndarray
    ) -> np.ndarray:
        """
        Generate visualization showing coastal changes
        
        Args:
            before_image: Historical image
            after_image: Recent image
            coastline_before: Historical coastline
            coastline_after: Recent coastline
            erosion_mask: Erosion areas
            accretion_mask: Accretion areas
            
        Returns:
            Visualization image with overlays
        """
        # Create base visualization using after image
        if after_image.ndim == 3:
            viz = after_image.copy()
        else:
            viz = cv2.cvtColor(after_image, cv2.COLOR_GRAY2RGB)
        
        # Normalize to 0-255 if needed
        if viz.max() <= 1.0:
            viz = (viz * 255).astype(np.uint8)
        
        # Overlay erosion areas in red
        viz[erosion_mask] = [255, 0, 0]  # Red for erosion
        
        # Overlay accretion areas in blue
        viz[accretion_mask] = [0, 0, 255]  # Blue for accretion
        
        # Overlay coastlines
        # Historical coastline in yellow
        viz[coastline_before > 0] = [255, 255, 0]
        
        # Recent coastline in green
        viz[coastline_after > 0] = [0, 255, 0]
        
        return viz
    
    def get_processing_parameters(self) -> Dict[str, Any]:
        """
        Get current processing parameters
        
        Returns:
            Dictionary of current configuration parameters
        """
        return {
            "edge_threshold_low": self.config.edge_threshold_low,
            "edge_threshold_high": self.config.edge_threshold_high,
            "morphology_kernel_size": self.config.morphology_kernel_size,
            "minimum_contour_area": self.config.minimum_contour_area,
            "erosion_accretion_threshold": self.config.erosion_accretion_threshold,
            "gaussian_blur_kernel": self.config.gaussian_blur_kernel,
            "median_filter_kernel": self.config.median_filter_kernel
        }
    
    def update_configuration(self, new_config: Dict[str, Any]):
        """
        Update processing configuration
        
        Args:
            new_config: Dictionary of new configuration parameters
        """
        for key, value in new_config.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
                logger.info(f"Updated VedgeSat parameter {key} to {value}")
            else:
                logger.warning(f"Unknown configuration parameter: {key}")
    
    def is_available(self) -> bool:
        """Check if VedgeSat processing is available"""
        try:
            # Simple availability check - verify we can process images
            test_image = np.zeros((10, 10), dtype=np.uint8)
            processed = self._preprocess_image(test_image)
            return processed is not None and processed.size > 0
        except Exception as e:
            logger.warning(f"VedgeSat availability check failed: {e}")
            return False