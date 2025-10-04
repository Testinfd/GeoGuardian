"""
CUSUM (Cumulative Sum) Change Detection Algorithm
Optimized for detecting abrupt changes in environmental monitoring data

This implementation is particularly effective for:
- Construction activity detection (sudden increases in Bare Soil Index)
- Deforestation events (rapid NDVI decreases)
- Water body changes (abrupt shifts in water indices)

Based on statistical process control theory with adaptations for satellite time series.
"""

import numpy as np
from typing import Tuple, List, Optional, Dict
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class CUSUMConfig:
    """Configuration for CUSUM detector"""
    drift_k: float = 0.5               # Reference value (typically 0.5σ)
    threshold_h: float = 5.0           # Decision threshold (typically 4-5σ)
    reset_after_detection: bool = True  # Reset cumulative sums after detection
    min_observations: int = 5          # Minimum observations before detection
    bilateral: bool = True             # Detect both increases and decreases


class CUSUMDetector:
    """
    Cumulative Sum (CUSUM) change detection algorithm
    
    Designed for detecting abrupt changes in environmental time series data.
    Particularly effective for construction detection, deforestation, and
    sudden environmental disturbances.
    
    Algorithm Details:
    - S⁺(t) = max(0, S⁺(t-1) + (X(t) - μ₀ - k))
    - S⁻(t) = max(0, S⁻(t-1) - (X(t) - μ₀ + k))
    - Change detected when S⁺(t) ≥ h or S⁻(t) ≥ h
    
    References:
    - Basseville, M. & Nikiforov, I.V. (1993). Detection of Abrupt Changes
    - Montgomery, D.C. (2009). Statistical Quality Control
    """
    
    def __init__(self, config: Optional[CUSUMConfig] = None):
        """
        Initialize CUSUM detector
        
        Args:
            config: CUSUM configuration parameters
        """
        self.config = config or CUSUMConfig()
        self.reset()
        
        # Validate configuration
        if self.config.drift_k <= 0:
            raise ValueError("drift_k must be positive")
        if self.config.threshold_h <= 0:
            raise ValueError("threshold_h must be positive")
    
    def reset(self):
        """Reset detector state"""
        self.s_plus = 0.0               # Upper cumulative sum
        self.s_minus = 0.0              # Lower cumulative sum
        self.observation_count = 0      # Number of observations processed
        self.change_points: List[Dict] = []  # Detected change points with metadata
        self.history: List[Dict] = []   # Processing history
    
    def detect_change(
        self, 
        observation: float, 
        baseline_mean: float, 
        baseline_std: float
    ) -> Tuple[bool, str, float, Dict]:
        """
        Process single observation for change detection
        
        Args:
            observation: Current observation value
            baseline_mean: Target mean (baseline)
            baseline_std: Baseline standard deviation for normalization
            
        Returns:
            Tuple of:
            - change_detected (bool): Whether change was detected
            - change_type (str): "increase", "decrease", or "none"
            - confidence (float): Confidence score (0-1)
            - metadata (dict): Additional detection information
        """
        
        if np.isnan(observation) or np.isnan(baseline_mean) or np.isnan(baseline_std):
            return False, "none", 0.0, {"error": "NaN values in input"}
        
        if baseline_std <= 0:
            return False, "none", 0.0, {"error": "Invalid baseline standard deviation"}
        
        # Standardize observation
        z = (observation - baseline_mean) / baseline_std
        
        # Update cumulative sums
        self.s_plus = max(0, self.s_plus + z - self.config.drift_k)
        if self.config.bilateral:
            self.s_minus = max(0, self.s_minus - z - self.config.drift_k)
        
        self.observation_count += 1
        
        # Check for change detection
        upper_alarm = self.s_plus >= self.config.threshold_h
        lower_alarm = self.config.bilateral and self.s_minus >= self.config.threshold_h
        
        change_detected = upper_alarm or lower_alarm
        
        # Determine change type and confidence
        if upper_alarm:
            change_type = "increase"
            confidence = min(self.s_plus / self.config.threshold_h, 2.0) / 2.0
        elif lower_alarm:
            change_type = "decrease"
            confidence = min(self.s_minus / self.config.threshold_h, 2.0) / 2.0
        else:
            change_type = "none"
            confidence = 0.0
        
        # Create metadata
        metadata = {
            "observation": observation,
            "standardized_observation": z,
            "s_plus": self.s_plus,
            "s_minus": self.s_minus,
            "baseline_mean": baseline_mean,
            "baseline_std": baseline_std,
            "observation_count": self.observation_count,
            "upper_alarm": upper_alarm,
            "lower_alarm": lower_alarm,
            "drift_k": self.config.drift_k,
            "threshold_h": self.config.threshold_h
        }
        
        # Record change point if detected
        if change_detected and self.observation_count >= self.config.min_observations:
            change_point = {
                "observation_index": self.observation_count,
                "change_type": change_type,
                "confidence": confidence,
                "s_plus": self.s_plus,
                "s_minus": self.s_minus,
                "observation_value": observation,
                "standardized_value": z
            }
            self.change_points.append(change_point)
            logger.info(f"CUSUM change detected: {change_type} at observation {self.observation_count}")
            
            # Reset after detection if configured
            if self.config.reset_after_detection:
                self.s_plus = 0.0
                self.s_minus = 0.0
        
        # Store history for analysis
        self.history.append(metadata)
        
        return change_detected, change_type, confidence, metadata
    
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
            Comprehensive analysis results dictionary
        """
        
        self.reset()
        
        changes = []
        change_types = []
        confidences = []
        s_plus_history = []
        s_minus_history = []
        
        for observation in time_series:
            change, change_type, confidence, metadata = self.detect_change(
                observation, baseline_mean, baseline_std
            )
            
            changes.append(change)
            change_types.append(change_type)
            confidences.append(confidence)
            s_plus_history.append(metadata.get("s_plus", 0))
            s_minus_history.append(metadata.get("s_minus", 0))
        
        # Calculate summary statistics
        total_changes = sum(changes)
        change_rate = total_changes / len(time_series) if len(time_series) > 0 else 0
        
        # Analyze change patterns
        increase_changes = sum(1 for ct in change_types if ct == "increase")
        decrease_changes = sum(1 for ct in change_types if ct == "decrease")
        
        return {
            "change_flags": np.array(changes),
            "change_types": change_types,
            "confidence_scores": np.array(confidences),
            "s_plus_history": np.array(s_plus_history),
            "s_minus_history": np.array(s_minus_history),
            "change_points": self.change_points.copy(),
            "summary_stats": {
                "total_observations": len(time_series),
                "total_changes": total_changes,
                "increase_changes": increase_changes,
                "decrease_changes": decrease_changes,
                "change_rate": change_rate,
                "mean_confidence": np.mean(confidences) if confidences else 0,
                "max_confidence": max(confidences) if confidences else 0
            },
            "processing_history": self.history.copy()
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
        change_type_map = np.full((rows, cols), "", dtype=object)
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
        increase_pixels = 0
        decrease_pixels = 0
        
        for i in range(rows):
            for j in range(cols):
                if analysis_mask[i, j]:
                    # Reset detector for each pixel
                    self.reset()
                    
                    change, change_type, confidence, _ = self.detect_change(
                        spatial_array[i, j], baseline_mean, baseline_std
                    )
                    
                    change_map[i, j] = change
                    change_type_map[i, j] = change_type
                    confidence_map[i, j] = confidence
                    
                    if change:
                        changed_pixels += 1
                        if change_type == "increase":
                            increase_pixels += 1
                        elif change_type == "decrease":
                            decrease_pixels += 1
        
        # Calculate spatial statistics
        change_percentage = (changed_pixels / total_pixels * 100) if total_pixels > 0 else 0
        increase_percentage = (increase_pixels / total_pixels * 100) if total_pixels > 0 else 0
        decrease_percentage = (decrease_pixels / total_pixels * 100) if total_pixels > 0 else 0
        
        return {
            "change_map": change_map,
            "change_type_map": change_type_map,
            "confidence_map": confidence_map,
            "spatial_stats": {
                "total_pixels": int(total_pixels),
                "changed_pixels": int(changed_pixels),
                "increase_pixels": int(increase_pixels),
                "decrease_pixels": int(decrease_pixels),
                "change_percentage": change_percentage,
                "increase_percentage": increase_percentage,
                "decrease_percentage": decrease_percentage,
                "mean_confidence": float(np.mean(confidence_map[analysis_mask])) if np.any(analysis_mask) else 0,
                "max_confidence": float(np.max(confidence_map))
            },
            "analysis_mask": analysis_mask
        }


class ConstructionCUSUMDetector(CUSUMDetector):
    """
    Specialized CUSUM detector for construction activity detection
    
    Optimized for detecting abrupt increases in Bare Soil Index (BSI)
    and other construction-related spectral signatures
    """
    
    def __init__(self):
        # Optimized configuration for construction detection
        config = CUSUMConfig(
            drift_k=0.3,               # Lower drift for construction (more sensitive)
            threshold_h=4.0,           # Lower threshold for construction detection
            reset_after_detection=True, # Reset to detect multiple construction events
            min_observations=3,        # Fewer observations needed for construction
            bilateral=False            # Only detect increases (construction adds bare soil)
        )
        super().__init__(config)
    
    def detect_construction_activity(
        self, 
        bsi_current: float, 
        bsi_baseline_mean: float, 
        bsi_baseline_std: float,
        ndvi_current: float,
        ndvi_baseline_mean: float
    ) -> Tuple[bool, float, Dict]:
        """
        Specialized construction detection using BSI and NDVI
        
        Args:
            bsi_current: Current Bare Soil Index value
            bsi_baseline_mean: Baseline BSI mean
            bsi_baseline_std: Baseline BSI std
            ndvi_current: Current NDVI value
            ndvi_baseline_mean: Baseline NDVI mean
            
        Returns:
            - construction_detected (bool)
            - construction_confidence (float)
            - construction_metadata (dict)
        """
        
        # Primary detection using BSI increase
        bsi_change, bsi_change_type, bsi_confidence, bsi_metadata = self.detect_change(
            bsi_current, bsi_baseline_mean, bsi_baseline_std
        )
        
        # Secondary validation using NDVI decrease
        ndvi_decrease = ndvi_current < (ndvi_baseline_mean - 0.05)  # NDVI decreased
        bsi_increase = bsi_change_type == "increase"  # BSI increased
        
        # Combined detection logic
        construction_detected = bsi_change and bsi_increase and ndvi_decrease
        
        # Adjust confidence based on multiple factors
        if construction_detected:
            # Factor in NDVI decrease magnitude
            ndvi_decrease_factor = max(0, (ndvi_baseline_mean - ndvi_current) / 0.2)
            construction_confidence = min(bsi_confidence * (1 + ndvi_decrease_factor), 1.0)
        else:
            construction_confidence = 0.0
        
        construction_metadata = {
            "bsi_change_detected": bsi_change,
            "bsi_change_type": bsi_change_type,
            "bsi_confidence": bsi_confidence,
            "bsi_increase": bsi_increase,
            "ndvi_decrease": ndvi_decrease,
            "bsi_current": bsi_current,
            "bsi_baseline_mean": bsi_baseline_mean,
            "ndvi_current": ndvi_current,
            "ndvi_baseline_mean": ndvi_baseline_mean,
            "s_plus": bsi_metadata.get("s_plus", 0)
        }
        
        return construction_detected, construction_confidence, construction_metadata
    
    def analyze_construction_patterns(
        self, 
        bsi_array: np.ndarray, 
        ndvi_array: np.ndarray,
        bsi_baseline_mean: float,
        bsi_baseline_std: float,
        ndvi_baseline_mean: float,
        mask: Optional[np.ndarray] = None
    ) -> Dict:
        """
        Analyze spatial patterns for construction activity detection
        
        Args:
            bsi_array: 2D array of BSI values
            ndvi_array: 2D array of NDVI values
            bsi_baseline_mean: BSI baseline mean
            bsi_baseline_std: BSI baseline std
            ndvi_baseline_mean: NDVI baseline mean
            mask: Optional analysis mask
            
        Returns:
            Comprehensive construction analysis results
        """
        
        if bsi_array.shape != ndvi_array.shape:
            raise ValueError("BSI and NDVI arrays must have same shape")
        
        # Process BSI for construction signatures
        bsi_results = self.process_spatial_data(
            bsi_array, bsi_baseline_mean, bsi_baseline_std, mask
        )
        
        # Additional construction-specific analysis
        rows, cols = bsi_array.shape
        construction_map = np.zeros((rows, cols), dtype=bool)
        construction_confidence_map = np.zeros((rows, cols), dtype=float)
        
        if mask is not None:
            analysis_mask = mask
        else:
            analysis_mask = ~np.isnan(bsi_array) & ~np.isnan(ndvi_array)
        
        # Analyze each pixel for construction signatures
        construction_pixels = 0
        total_pixels = np.sum(analysis_mask)
        
        for i in range(rows):
            for j in range(cols):
                if analysis_mask[i, j]:
                    self.reset()  # Reset for each pixel
                    
                    construction_detected, construction_confidence, _ = self.detect_construction_activity(
                        bsi_array[i, j], bsi_baseline_mean, bsi_baseline_std,
                        ndvi_array[i, j], ndvi_baseline_mean
                    )
                    
                    construction_map[i, j] = construction_detected
                    construction_confidence_map[i, j] = construction_confidence
                    
                    if construction_detected:
                        construction_pixels += 1
        
        # Calculate construction statistics
        construction_percentage = (construction_pixels / total_pixels * 100) if total_pixels > 0 else 0
        
        return {
            "construction_map": construction_map,
            "construction_confidence_map": construction_confidence_map,
            "bsi_results": bsi_results,
            "construction_stats": {
                "total_pixels": int(total_pixels),
                "construction_pixels": int(construction_pixels),
                "construction_percentage": construction_percentage,
                "mean_construction_confidence": float(np.mean(construction_confidence_map[analysis_mask])) if np.any(analysis_mask) else 0,
                "max_construction_confidence": float(np.max(construction_confidence_map))
            },
            "analysis_mask": analysis_mask
        }


class DeforestationCUSUMDetector(CUSUMDetector):
    """
    Specialized CUSUM detector for deforestation detection
    
    Optimized for detecting abrupt decreases in NDVI and vegetation indices
    indicating rapid forest loss or degradation
    """
    
    def __init__(self):
        # Optimized configuration for deforestation detection
        config = CUSUMConfig(
            drift_k=0.4,               # Moderate drift for deforestation
            threshold_h=3.5,           # Lower threshold for early detection
            reset_after_detection=True, # Reset to detect ongoing deforestation
            min_observations=5,        # Moderate observation requirement
            bilateral=False            # Only detect decreases (vegetation loss)
        )
        super().__init__(config)
    
    def detect_deforestation(
        self, 
        ndvi_current: float, 
        ndvi_baseline_mean: float, 
        ndvi_baseline_std: float,
        additional_indices: Optional[Dict[str, Tuple[float, float]]] = None
    ) -> Tuple[bool, float, str, Dict]:
        """
        Specialized deforestation detection using NDVI and optional additional indices
        
        Args:
            ndvi_current: Current NDVI value
            ndvi_baseline_mean: Baseline NDVI mean
            ndvi_baseline_std: Baseline NDVI std
            additional_indices: Optional dict of {index_name: (current_value, baseline_mean)}
            
        Returns:
            - deforestation_detected (bool)
            - severity_score (float): 0-1 scale
            - severity_level (str): "low", "moderate", "high", "severe"
            - deforestation_metadata (dict)
        """
        
        # Invert NDVI for decrease detection (CUSUM detects increases)
        inverted_ndvi = -ndvi_current
        inverted_baseline = -ndvi_baseline_mean
        
        # Primary detection using inverted NDVI
        ndvi_change, ndvi_change_type, ndvi_confidence, ndvi_metadata = self.detect_change(
            inverted_ndvi, inverted_baseline, ndvi_baseline_std
        )
        
        # Calculate actual NDVI change magnitude
        ndvi_change_magnitude = ndvi_baseline_mean - ndvi_current
        
        # Only consider as deforestation if NDVI actually decreased
        deforestation_detected = ndvi_change and ndvi_change_type == "increase" and ndvi_change_magnitude > 0
        
        # Classify severity based on NDVI decrease magnitude
        if deforestation_detected:
            if ndvi_change_magnitude < 0.1:
                severity_level = "low"
                severity_score = ndvi_confidence * 0.4
            elif ndvi_change_magnitude < 0.2:
                severity_level = "moderate"
                severity_score = ndvi_confidence * 0.6
            elif ndvi_change_magnitude < 0.3:
                severity_level = "high"
                severity_score = ndvi_confidence * 0.8
            else:
                severity_level = "severe"
                severity_score = ndvi_confidence
        else:
            severity_level = "none"
            severity_score = 0.0
        
        # Additional validation with other vegetation indices if provided
        additional_confirmations = 0
        total_additional = 0
        
        if additional_indices:
            for index_name, (current_val, baseline_mean) in additional_indices.items():
                total_additional += 1
                # Check if this index also shows decrease
                if current_val < baseline_mean - 0.05:  # Threshold for confirmation
                    additional_confirmations += 1
        
        # Adjust confidence based on additional indices
        if total_additional > 0:
            confirmation_ratio = additional_confirmations / total_additional
            severity_score *= (0.7 + 0.3 * confirmation_ratio)  # Boost confidence with confirmations
        
        deforestation_metadata = {
            "ndvi_change_detected": ndvi_change,
            "ndvi_change_type": ndvi_change_type,
            "ndvi_confidence": ndvi_confidence,
            "ndvi_change_magnitude": ndvi_change_magnitude,
            "ndvi_current": ndvi_current,
            "ndvi_baseline_mean": ndvi_baseline_mean,
            "additional_confirmations": additional_confirmations,
            "total_additional_indices": total_additional,
            "s_plus": ndvi_metadata.get("s_plus", 0)
        }
        
        return deforestation_detected, severity_score, severity_level, deforestation_metadata