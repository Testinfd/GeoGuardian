"""
EWMA (Exponentially Weighted Moving Average) Change Detection Algorithm
Based on nrt (Near Real-Time monitoring) methodology for environmental monitoring

This implementation detects gradual changes in vegetation health and other environmental indicators
using statistical process control methods adapted for satellite time series data.
"""

import numpy as np
from typing import Tuple, List, Optional, Dict
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class EWMAConfig:
    """Configuration for EWMA detector"""
    lambda_param: float = 0.3          # Smoothing parameter (0 < λ ≤ 1)
    threshold_multiplier: float = 3.0  # Control limit multiplier (typically 2-3)
    min_observations: int = 10          # Minimum observations for reliable detection
    max_history: int = 1000            # Maximum history to maintain in memory


class EWMADetector:
    """
    Exponentially Weighted Moving Average change detection
    
    Optimized for detecting gradual changes in environmental time series data
    such as vegetation health (NDVI), water quality parameters, etc.
    
    Algorithm Details:
    - EWMA(t) = λ * X(t) + (1-λ) * EWMA(t-1)
    - Control Limits: μ ± k*σ*sqrt(λ/(2-λ))
    - Change detected when EWMA exceeds control limits
    
    References:
    - nrt: Near real-time monitoring library
    - Montgomery, D.C. (2009). Statistical Quality Control
    """
    
    def __init__(self, config: Optional[EWMAConfig] = None):
        """
        Initialize EWMA detector
        
        Args:
            config: EWMA configuration parameters
        """
        self.config = config or EWMAConfig()
        self.reset()
        
        # Validate configuration
        if not (0 < self.config.lambda_param <= 1):
            raise ValueError("lambda_param must be between 0 and 1")
        if self.config.threshold_multiplier <= 0:
            raise ValueError("threshold_multiplier must be positive")
    
    def reset(self):
        """Reset detector state"""
        self.ewma_history: List[float] = []
        self.observation_count = 0
        self.change_points: List[int] = []
        
    def detect_change(
        self, 
        observation: float, 
        baseline_mean: float, 
        baseline_std: float
    ) -> Tuple[bool, float, Dict]:
        """
        Detect change in single observation
        
        Args:
            observation: Current observation value
            baseline_mean: Historical baseline mean
            baseline_std: Historical baseline standard deviation
            
        Returns:
            Tuple of:
            - change_detected (bool): Whether change was detected
            - confidence (float): Confidence score (0-1)
            - metadata (dict): Additional detection metadata
        """
        
        if np.isnan(observation) or np.isnan(baseline_mean) or np.isnan(baseline_std):
            return False, 0.0, {"error": "NaN values in input"}
        
        if baseline_std <= 0:
            return False, 0.0, {"error": "Invalid baseline standard deviation"}
        
        # Calculate EWMA
        if len(self.ewma_history) == 0:
            ewma_current = baseline_mean
        else:
            ewma_current = (self.config.lambda_param * observation + 
                          (1 - self.config.lambda_param) * self.ewma_history[-1])
        
        # Maintain history with size limit
        if len(self.ewma_history) >= self.config.max_history:
            self.ewma_history.pop(0)
        self.ewma_history.append(ewma_current)
        self.observation_count += 1
        
        # Calculate control limits
        # Standard EWMA control limit formula
        lambda_factor = np.sqrt(self.config.lambda_param / (2 - self.config.lambda_param))
        control_limit = self.config.threshold_multiplier * baseline_std * lambda_factor
        
        # Detect change
        deviation = abs(ewma_current - baseline_mean)
        change_detected = deviation > control_limit
        
        # Calculate confidence score
        if control_limit > 0:
            confidence = min(deviation / control_limit, 2.0) / 2.0
        else:
            confidence = 0.0
        
        # Additional metadata
        metadata = {
            "ewma_value": ewma_current,
            "deviation": deviation,
            "control_limit": control_limit,
            "baseline_mean": baseline_mean,
            "baseline_std": baseline_std,
            "observation_count": self.observation_count,
            "lambda_param": self.config.lambda_param
        }
        
        # Record change point if detected
        if change_detected and self.observation_count not in self.change_points:
            self.change_points.append(self.observation_count)
            logger.info(f"EWMA change detected at observation {self.observation_count}")
        
        return change_detected, confidence, metadata
    
    def process_time_series(
        self, 
        time_series: np.ndarray, 
        baseline_mean: float, 
        baseline_std: float
    ) -> Dict:
        """
        Process entire time series for change detection
        
        Args:
            time_series: Array of observations
            baseline_mean: Historical baseline mean
            baseline_std: Historical baseline standard deviation
            
        Returns:
            Dictionary containing:
            - change_flags: Boolean array indicating changes
            - confidence_scores: Array of confidence scores
            - ewma_values: Array of EWMA values
            - change_points: List of change point indices
            - summary_stats: Summary statistics
        """
        
        self.reset()
        
        changes = []
        confidences = []
        ewma_values = []
        all_metadata = []
        
        for i, observation in enumerate(time_series):
            change, confidence, metadata = self.detect_change(
                observation, baseline_mean, baseline_std
            )
            changes.append(change)
            confidences.append(confidence)
            ewma_values.append(metadata.get("ewma_value", np.nan))
            all_metadata.append(metadata)
        
        # Calculate summary statistics
        total_changes = sum(changes)
        change_rate = total_changes / len(time_series) if len(time_series) > 0 else 0
        mean_confidence = np.mean(confidences) if confidences else 0
        
        return {
            "change_flags": np.array(changes),
            "confidence_scores": np.array(confidences),
            "ewma_values": np.array(ewma_values),
            "change_points": self.change_points.copy(),
            "summary_stats": {
                "total_observations": len(time_series),
                "total_changes": total_changes,
                "change_rate": change_rate,
                "mean_confidence": mean_confidence,
                "max_confidence": max(confidences) if confidences else 0
            },
            "metadata": all_metadata
        }
    
    def process_spatial_data(
        self, 
        spatial_array: np.ndarray, 
        baseline_mean: float, 
        baseline_std: float,
        mask: Optional[np.ndarray] = None
    ) -> Dict:
        """
        Process spatial data (2D array) for change detection
        
        Args:
            spatial_array: 2D array of spatial observations
            baseline_mean: Historical baseline mean
            baseline_std: Historical baseline standard deviation
            mask: Optional boolean mask to limit analysis area
            
        Returns:
            Dictionary containing spatial change detection results
        """
        
        if spatial_array.ndim != 2:
            raise ValueError("spatial_array must be 2-dimensional")
        
        rows, cols = spatial_array.shape
        change_map = np.zeros((rows, cols), dtype=bool)
        confidence_map = np.zeros((rows, cols), dtype=float)
        
        # Apply mask if provided
        if mask is not None:
            if mask.shape != spatial_array.shape:
                raise ValueError("mask must have same shape as spatial_array")
            analysis_mask = mask
        else:
            analysis_mask = ~np.isnan(spatial_array)
        
        # Process each pixel
        total_pixels = np.sum(analysis_mask)
        changed_pixels = 0
        
        for i in range(rows):
            for j in range(cols):
                if analysis_mask[i, j]:
                    change, confidence, _ = self.detect_change(
                        spatial_array[i, j], baseline_mean, baseline_std
                    )
                    change_map[i, j] = change
                    confidence_map[i, j] = confidence
                    
                    if change:
                        changed_pixels += 1
        
        # Calculate spatial statistics
        change_percentage = (changed_pixels / total_pixels * 100) if total_pixels > 0 else 0
        mean_confidence = np.mean(confidence_map[analysis_mask]) if np.any(analysis_mask) else 0
        
        return {
            "change_map": change_map,
            "confidence_map": confidence_map,
            "spatial_stats": {
                "total_pixels": int(total_pixels),
                "changed_pixels": int(changed_pixels),
                "change_percentage": change_percentage,
                "mean_confidence": mean_confidence,
                "max_confidence": float(np.max(confidence_map))
            },
            "analysis_mask": analysis_mask
        }
    
    def get_detector_status(self) -> Dict:
        """Get current detector status and statistics"""
        return {
            "configuration": {
                "lambda_param": self.config.lambda_param,
                "threshold_multiplier": self.config.threshold_multiplier,
                "min_observations": self.config.min_observations,
                "max_history": self.config.max_history
            },
            "state": {
                "observation_count": self.observation_count,
                "history_length": len(self.ewma_history),
                "total_change_points": len(self.change_points),
                "latest_ewma": self.ewma_history[-1] if self.ewma_history else None
            },
            "change_points": self.change_points.copy()
        }


class VegetationEWMADetector(EWMADetector):
    """
    Specialized EWMA detector for vegetation monitoring
    
    Optimized parameters for NDVI and vegetation health monitoring
    based on nrt library recommendations for vegetation applications
    """
    
    def __init__(self):
        # Optimized configuration for vegetation monitoring
        config = EWMAConfig(
            lambda_param=0.2,       # Lower lambda for vegetation (slower response)
            threshold_multiplier=2.5,  # Slightly lower threshold for vegetation
            min_observations=15,    # More observations needed for vegetation
            max_history=500        # Seasonal data retention
        )
        super().__init__(config)
    
    def detect_vegetation_loss(
        self, 
        ndvi_current: float, 
        ndvi_baseline_mean: float, 
        ndvi_baseline_std: float
    ) -> Tuple[bool, float, str]:
        """
        Specialized vegetation loss detection
        
        Returns:
            - vegetation_loss_detected (bool)
            - severity_score (float): 0-1 scale
            - severity_level (str): "low", "moderate", "high", "severe"
        """
        
        change_detected, confidence, metadata = self.detect_change(
            ndvi_current, ndvi_baseline_mean, ndvi_baseline_std
        )
        
        if not change_detected:
            return False, 0.0, "stable"
        
        # Calculate NDVI change magnitude
        ndvi_change = ndvi_current - ndvi_baseline_mean
        
        # Only consider decreases as vegetation loss
        if ndvi_change >= 0:
            return False, 0.0, "stable"
        
        # Classify severity based on NDVI decrease
        abs_change = abs(ndvi_change)
        if abs_change < 0.1:
            severity_level = "low"
            severity_score = confidence * 0.3
        elif abs_change < 0.2:
            severity_level = "moderate"
            severity_score = confidence * 0.6
        elif abs_change < 0.3:
            severity_level = "high"
            severity_score = confidence * 0.8
        else:
            severity_level = "severe"
            severity_score = confidence
        
        return True, severity_score, severity_level


class WaterQualityEWMADetector(EWMADetector):
    """
    Specialized EWMA detector for water quality monitoring
    
    Optimized for detecting changes in water quality indices
    such as turbidity, chlorophyll-a, and algae indicators
    """
    
    def __init__(self):
        # Optimized configuration for water quality monitoring
        config = EWMAConfig(
            lambda_param=0.4,       # Higher lambda for water (faster response)
            threshold_multiplier=2.0,  # Lower threshold for water quality
            min_observations=8,     # Fewer observations needed
            max_history=200        # Shorter history for water dynamics
        )
        super().__init__(config)
    
    def detect_algal_bloom(
        self, 
        algae_index_current: float, 
        algae_baseline_mean: float, 
        algae_baseline_std: float,
        ndwi_current: float,
        ndwi_baseline_mean: float
    ) -> Tuple[bool, float, Dict]:
        """
        Specialized algal bloom detection using multiple indicators
        
        Args:
            algae_index_current: Current algae index value
            algae_baseline_mean: Baseline algae index mean
            algae_baseline_std: Baseline algae index std
            ndwi_current: Current NDWI value
            ndwi_baseline_mean: Baseline NDWI mean
            
        Returns:
            - bloom_detected (bool)
            - bloom_confidence (float)
            - bloom_metadata (dict)
        """
        
        # Primary detection using algae index
        algae_change, algae_confidence, algae_metadata = self.detect_change(
            algae_index_current, algae_baseline_mean, algae_baseline_std
        )
        
        # Secondary validation using water presence (NDWI)
        water_present = ndwi_current > (ndwi_baseline_mean - 0.1)  # Water body present
        algae_increase = algae_index_current > algae_baseline_mean  # Algae increased
        
        # Combined detection logic
        bloom_detected = algae_change and water_present and algae_increase
        
        # Adjust confidence based on multiple factors
        if bloom_detected:
            water_confidence = min(ndwi_current / ndwi_baseline_mean, 1.5) - 0.5
            bloom_confidence = min(algae_confidence * (1 + water_confidence), 1.0)
        else:
            bloom_confidence = 0.0
        
        bloom_metadata = {
            "algae_change_detected": algae_change,
            "algae_confidence": algae_confidence,
            "water_present": water_present,
            "algae_increase": algae_increase,
            "algae_index_current": algae_index_current,
            "algae_baseline_mean": algae_baseline_mean,
            "ndwi_current": ndwi_current,
            "ndwi_baseline_mean": ndwi_baseline_mean
        }
        
        return bloom_detected, bloom_confidence, bloom_metadata