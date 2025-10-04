"""
Enhanced Analysis Engine for GeoGuardian
Integrates multiple change detection algorithms and advanced spectral analysis

This module provides a comprehensive environmental monitoring framework that combines:
- EWMA detection for gradual changes (vegetation monitoring)
- CUSUM detection for abrupt changes (construction, deforestation)
- VedgeSat integration for coastal monitoring
- Advanced spectral analysis for water quality assessment
- Multi-algorithm confidence scoring and result fusion

Inspired by methodologies from nrt, VedgeSat, CyFi, and COASTGUARD projects.
"""

import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional, Union
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass

# Import our algorithm implementations
from ..algorithms.ewma import EWMADetector, VegetationEWMADetector, WaterQualityEWMADetector
from ..algorithms.cusum import CUSUMDetector, ConstructionCUSUMDetector, DeforestationCUSUMDetector
from .vedgesat_wrapper import VedgeSatWrapper
from .spectral_analyzer import SpectralAnalyzer
from .fusion_engine import MultiSensorFusion, FusionResult

logger = logging.getLogger(__name__)


@dataclass
class AnalysisConfig:
    """Configuration for analysis engine"""
    baseline_years: int = 3
    confidence_threshold: float = 0.7
    enable_vedgesat: bool = True
    enable_all_algorithms: bool = True
    spatial_resolution: float = 10.0  # meters per pixel
    temporal_window_days: int = 30


class AdvancedAnalysisEngine:
    """
    Multi-algorithm environmental change detection engine
    
    Combines statistical change detection, computer vision, and domain-specific
    algorithms to provide comprehensive environmental monitoring capabilities.
    """
    
    def __init__(self, config: Optional[AnalysisConfig] = None):
        """
        Initialize the advanced analysis engine
        
        Args:
            config: Analysis configuration parameters
        """
        self.config = config or AnalysisConfig()
        
        # Initialize algorithm components
        self.algorithms = {
            'ewma_general': EWMADetector(),
            'ewma_vegetation': VegetationEWMADetector(),
            'ewma_water': WaterQualityEWMADetector(),
            'cusum_general': CUSUMDetector(),
            'cusum_construction': ConstructionCUSUMDetector(),
            'cusum_deforestation': DeforestationCUSUMDetector()
        }
        
        # Initialize specialized components
        self.spectral_analyzer = SpectralAnalyzer()
        self.fusion_engine = MultiSensorFusion()  # NEW: Multi-Sensor Fusion
        
        if self.config.enable_vedgesat:
            try:
                self.vedgesat_wrapper = VedgeSatWrapper()
                logger.info("VedgeSat wrapper initialized successfully")
            except Exception as e:
                logger.warning(f"VedgeSat initialization failed: {e}")
                self.vedgesat_wrapper = None
        else:
            self.vedgesat_wrapper = None
        
        logger.info("AdvancedAnalysisEngine initialized with Multi-Sensor Fusion")
    
    def analyze_environmental_change(
        self, 
        before_image: np.ndarray, 
        after_image: np.ndarray,
        geojson: dict,
        analysis_type: str = 'comprehensive',
        baseline_data: Optional[Dict] = None
    ) -> Dict:
        """
        Comprehensive environmental change analysis
        
        Args:
            before_image: Historical satellite image (H, W, Bands)
            after_image: Recent satellite image (H, W, Bands)
            geojson: Area of interest geometry
            analysis_type: 'comprehensive', 'vegetation', 'water', 'coastal', 'construction'
            baseline_data: Optional baseline statistics for improved detection
            
        Returns:
            Detailed analysis results with confidence scores and visualizations
        """
        
        logger.info(f"Starting {analysis_type} environmental analysis")
        
        # Initialize results structure
        results = {
            'timestamp': datetime.now().isoformat(),
            'analysis_type': analysis_type,
            'algorithms_used': [],
            'detections': [],
            'confidence_scores': {},
            'visualization_data': {},
            'processing_metadata': {
                'image_shapes': {
                    'before': before_image.shape,
                    'after': after_image.shape
                },
                'geojson_bounds': self._extract_bounds(geojson)
            }
        }
        
        try:
            # Extract comprehensive spectral features
            logger.debug("Extracting spectral features...")
            before_features = self.spectral_analyzer.extract_all_features(before_image)
            after_features = self.spectral_analyzer.extract_all_features(after_image)
            
            # Get or calculate baseline statistics
            baseline_stats = baseline_data or self._calculate_baseline_stats(before_features)
            
            # NEW: Apply Multi-Sensor Fusion for intelligent risk assessment
            fusion_result = None
            if analysis_type == 'comprehensive':
                try:
                    logger.debug("Applying multi-sensor fusion analysis...")
                    fusion_result = self._apply_fusion_analysis(
                        before_features, after_features, baseline_data
                    )
                    results['fusion_analysis'] = fusion_result
                    results['algorithms_used'].append('multi_sensor_fusion')
                except Exception as e:
                    logger.warning(f"Fusion analysis failed: {e}")
            
            # Execute analysis based on type
            if analysis_type in ['comprehensive', 'vegetation']:
                vegetation_results = self._analyze_vegetation_changes(
                    before_features, after_features, baseline_stats
                )
                results['detections'].append(vegetation_results)
                results['algorithms_used'].append('ewma_vegetation')
            
            if analysis_type in ['comprehensive', 'water']:
                water_results = self._analyze_water_quality(
                    before_features, after_features, baseline_stats
                )
                results['detections'].append(water_results)
                results['algorithms_used'].append('spectral_water')
            
            if analysis_type in ['comprehensive', 'coastal'] and self.vedgesat_wrapper:
                coastal_results = self._analyze_coastal_changes(
                    before_image, after_image, geojson
                )
                results['detections'].append(coastal_results)
                results['algorithms_used'].append('vedgesat_coastal')
            
            if analysis_type in ['comprehensive', 'construction']:
                construction_results = self._detect_construction_activity(
                    before_features, after_features, baseline_stats
                )
                results['detections'].append(construction_results)
                results['algorithms_used'].append('cusum_construction')
            
            if analysis_type in ['comprehensive'] or analysis_type == 'deforestation':
                deforestation_results = self._detect_deforestation(
                    before_features, after_features, baseline_stats
                )
                results['detections'].append(deforestation_results)
                results['algorithms_used'].append('cusum_deforestation')
            
            # Calculate overall confidence and priority
            results['overall_confidence'] = self._calculate_overall_confidence(results['detections'])
            results['priority_level'] = self._calculate_priority_level(results['detections'])
            
            # Generate enhanced visualizations
            results['visualization_data'] = self._create_enhanced_visualizations(
                before_image, after_image, results['detections']
            )
            
            # Generate summary and recommendations
            results['summary'] = self._generate_analysis_summary(results)
            results['recommendations'] = self._generate_recommendations(results)
            
            logger.info(f"Analysis completed successfully. Overall confidence: {results['overall_confidence']:.2f}")
            
        except Exception as e:
            logger.error(f"Error in environmental analysis: {e}")
            results['error'] = str(e)
            results['success'] = False
            return results
        
        results['success'] = True
        return results
    
    def _analyze_vegetation_changes(
        self, 
        before_features: Dict, 
        after_features: Dict,
        baseline_stats: Dict
    ) -> Dict:
        """Enhanced vegetation change analysis using EWMA"""
        
        logger.debug("Analyzing vegetation changes...")
        
        # Get NDVI data
        ndvi_before = before_features['indices']['ndvi']
        ndvi_after = after_features['indices']['ndvi']
        
        # Get baseline statistics
        ndvi_baseline = baseline_stats.get('ndvi', {})
        baseline_mean = ndvi_baseline.get('mean', np.nanmean(ndvi_before))
        baseline_std = ndvi_baseline.get('std', np.nanstd(ndvi_before))
        
        # Apply specialized vegetation EWMA detector
        vegetation_detector = self.algorithms['ewma_vegetation']
        
        # Process spatial data for vegetation changes
        spatial_results = vegetation_detector.process_spatial_data(
            ndvi_after, baseline_mean, baseline_std
        )
        
        # Enhanced vegetation analysis
        change_mask = spatial_results['change_map']
        confidence_map = spatial_results['confidence_map']
        
        # Calculate vegetation metrics
        total_pixels = spatial_results['spatial_stats']['total_pixels']
        changed_pixels = spatial_results['spatial_stats']['changed_pixels']
        change_percentage = spatial_results['spatial_stats']['change_percentage']
        
        # Analyze change patterns for vegetation loss vs gain
        ndvi_diff = ndvi_after - ndvi_before
        vegetation_loss_pixels = np.sum((change_mask) & (ndvi_diff < -0.1))
        vegetation_gain_pixels = np.sum((change_mask) & (ndvi_diff > 0.1))
        
        # Determine dominant change type
        if vegetation_loss_pixels > vegetation_gain_pixels:
            change_type = "vegetation_loss"
            severity_factor = vegetation_loss_pixels / total_pixels
        elif vegetation_gain_pixels > 0:
            change_type = "vegetation_gain"
            severity_factor = vegetation_gain_pixels / total_pixels
        else:
            change_type = "vegetation_stable"
            severity_factor = 0
        
        # Calculate severity level
        if severity_factor > 0.15:
            severity = "high"
        elif severity_factor > 0.05:
            severity = "moderate"
        elif severity_factor > 0.01:
            severity = "low"
        else:
            severity = "negligible"
        
        return {
            'type': 'vegetation_analysis',
            'algorithm': 'ewma_vegetation',
            'change_detected': change_percentage > 1.0,  # 1% threshold
            'change_type': change_type,
            'severity': severity,
            'change_percentage': change_percentage,
            'confidence': spatial_results['spatial_stats']['mean_confidence'],
            'spatial_metrics': {
                'total_pixels': total_pixels,
                'changed_pixels': changed_pixels,
                'vegetation_loss_pixels': int(vegetation_loss_pixels),
                'vegetation_gain_pixels': int(vegetation_gain_pixels),
                'mean_ndvi_change': float(np.nanmean(ndvi_diff)),
                'max_ndvi_change': float(np.nanmax(np.abs(ndvi_diff)))
            },
            'change_mask': change_mask.astype(int).tolist(),
            'confidence_map': confidence_map.tolist()
        }
    
    def _analyze_water_quality(
        self, 
        before_features: Dict, 
        after_features: Dict,
        baseline_stats: Dict
    ) -> Dict:
        """Water quality analysis inspired by CyFi methodology"""
        
        logger.debug("Analyzing water quality changes...")
        
        # Water quality relevant indices
        water_indices = ['ndwi', 'mndwi', 'algae_index', 'turbidity_index']
        results = {
            'type': 'water_quality_analysis',
            'algorithm': 'spectral_water_quality',
            'parameters_analyzed': [],
            'overall_change_detected': False,
            'confidence': 0.0
        }
        
        significant_changes = 0
        total_confidence = 0.0
        
        for index_name in water_indices:
            if (index_name in before_features['indices'] and 
                index_name in after_features['indices']):
                
                before_values = before_features['indices'][index_name]
                after_values = after_features['indices'][index_name]
                
                # Get baseline statistics
                index_baseline = baseline_stats.get(index_name, {})
                baseline_mean = index_baseline.get('mean', np.nanmean(before_values))
                baseline_std = index_baseline.get('std', np.nanstd(before_values))
                
                # Use water quality EWMA detector
                water_detector = self.algorithms['ewma_water']
                
                # Calculate mean change
                mean_after = np.nanmean(after_values)
                change_detected, confidence, metadata = water_detector.detect_change(
                    mean_after, baseline_mean, baseline_std
                )
                
                # Calculate change statistics
                mean_before = np.nanmean(before_values)
                change_magnitude = abs(mean_after - mean_before)
                change_direction = 'increase' if mean_after > mean_before else 'decrease'
                
                parameter_result = {
                    'parameter': index_name,
                    'mean_before': float(mean_before),
                    'mean_after': float(mean_after),
                    'change_magnitude': float(change_magnitude),
                    'change_detected': change_detected,
                    'change_direction': change_direction,
                    'confidence': confidence
                }
                
                # Specific interpretations for water quality parameters
                if index_name == 'algae_index' and change_detected and change_direction == 'increase':
                    parameter_result['interpretation'] = 'potential_algal_bloom'
                    parameter_result['severity'] = 'high' if confidence > 0.8 else 'moderate'
                elif index_name == 'turbidity_index' and change_detected:
                    parameter_result['interpretation'] = 'turbidity_change'
                    parameter_result['severity'] = 'moderate'
                elif index_name in ['ndwi', 'mndwi'] and change_detected:
                    parameter_result['interpretation'] = 'water_extent_change'
                    parameter_result['severity'] = 'low'
                else:
                    parameter_result['interpretation'] = 'stable'
                    parameter_result['severity'] = 'negligible'
                
                results['parameters_analyzed'].append(parameter_result)
                
                if change_detected:
                    significant_changes += 1
                    total_confidence += confidence
        
        # Overall water quality assessment
        if significant_changes > 0:
            results['overall_change_detected'] = True
            results['confidence'] = total_confidence / significant_changes
            results['significant_parameters'] = significant_changes
            
            # Determine overall water quality status
            algae_issues = any(p.get('interpretation') == 'potential_algal_bloom' 
                             for p in results['parameters_analyzed'])
            if algae_issues:
                results['water_quality_status'] = 'algal_bloom_risk'
            else:
                results['water_quality_status'] = 'parameter_changes_detected'
        else:
            results['water_quality_status'] = 'stable'
            results['significant_parameters'] = 0
        
        return results
    
    def _analyze_coastal_changes(
        self, 
        before_image: np.ndarray, 
        after_image: np.ndarray,
        geojson: dict
    ) -> Dict:
        """Coastal change detection using VedgeSat integration"""
        
        logger.debug("Analyzing coastal changes with VedgeSat...")
        
        if not self.vedgesat_wrapper:
            return {
                'type': 'coastal_analysis',
                'algorithm': 'vedgesat',
                'error': 'VedgeSat wrapper not available',
                'change_detected': False,
                'confidence': 0.0
            }
        
        try:
            # Use VedgeSat for coastal analysis
            coastal_results = self.vedgesat_wrapper.analyze_coastal_changes(
                before_image, after_image, geojson
            )
            
            if coastal_results.get('success'):
                return {
                    'type': 'coastal_analysis',
                    'algorithm': 'vedgesat',
                    'change_detected': coastal_results.get('change_detected', False),
                    'change_type': coastal_results.get('change_type', 'unknown'),
                    'change_magnitude': coastal_results.get('change_magnitude', 0.0),
                    'confidence': coastal_results.get('confidence', 0.0),
                    'edge_analysis': coastal_results.get('change_stats', {}),
                    'vedgesat_metadata': coastal_results.get('before_analysis', {}).get('metadata', {})
                }
            else:
                # Fallback to simplified coastal analysis
                return self._simplified_coastal_analysis(before_image, after_image)
                
        except Exception as e:
            logger.error(f"Error in VedgeSat coastal analysis: {e}")
            return self._simplified_coastal_analysis(before_image, after_image)
    
    def _simplified_coastal_analysis(
        self, 
        before_image: np.ndarray, 
        after_image: np.ndarray
    ) -> Dict:
        """Simplified coastal analysis fallback"""
        
        # Convert to grayscale for edge detection
        before_gray = cv2.cvtColor(before_image[:,:,:3], cv2.COLOR_RGB2GRAY)
        after_gray = cv2.cvtColor(after_image[:,:,:3], cv2.COLOR_RGB2GRAY)
        
        # Normalize images
        before_norm = ((before_gray / before_gray.max()) * 255).astype(np.uint8)
        after_norm = ((after_gray / after_gray.max()) * 255).astype(np.uint8)
        
        # Edge detection
        before_edges = cv2.Canny(before_norm, 50, 150)
        after_edges = cv2.Canny(after_norm, 50, 150)
        
        # Calculate edge changes
        edge_diff = cv2.absdiff(after_edges, before_edges)
        edge_change_pixels = np.sum(edge_diff > 0)
        total_pixels = edge_diff.size
        edge_change_percentage = (edge_change_pixels / total_pixels) * 100
        
        return {
            'type': 'coastal_analysis',
            'algorithm': 'simplified_edge_detection',
            'change_detected': edge_change_percentage > 2.0,
            'edge_change_percentage': edge_change_percentage,
            'confidence': min(edge_change_percentage / 10, 1.0),
            'interpretation': 'coastal_edge_changes' if edge_change_percentage > 5 else 'stable_coastline'
        }
    
    def _detect_construction_activity(
        self, 
        before_features: Dict, 
        after_features: Dict,
        baseline_stats: Dict
    ) -> Dict:
        """CUSUM-based construction activity detection"""
        
        logger.debug("Detecting construction activity...")
        
        # Check if we have required spectral bands for BSI
        if 'bsi' not in before_features['indices'] or 'bsi' not in after_features['indices']:
            return {
                'type': 'construction_analysis',
                'algorithm': 'cusum_construction',
                'error': 'Insufficient spectral bands for BSI calculation',
                'change_detected': False,
                'confidence': 0.0
            }
        
        bsi_before = before_features['indices']['bsi']
        bsi_after = after_features['indices']['bsi']
        ndvi_before = before_features['indices']['ndvi']
        ndvi_after = after_features['indices']['ndvi']
        
        # Get baseline statistics
        bsi_baseline = baseline_stats.get('bsi', {})
        bsi_baseline_mean = bsi_baseline.get('mean', np.nanmean(bsi_before))
        bsi_baseline_std = bsi_baseline.get('std', np.nanstd(bsi_before))
        
        ndvi_baseline = baseline_stats.get('ndvi', {})
        ndvi_baseline_mean = ndvi_baseline.get('mean', np.nanmean(ndvi_before))
        
        # Use specialized construction CUSUM detector
        construction_detector = self.algorithms['cusum_construction']
        
        # Analyze construction patterns
        construction_results = construction_detector.analyze_construction_patterns(
            bsi_after, ndvi_after,
            bsi_baseline_mean, bsi_baseline_std, ndvi_baseline_mean
        )
        
        construction_stats = construction_results['construction_stats']
        construction_percentage = construction_stats['construction_percentage']
        
        # Determine severity and confidence
        if construction_percentage > 5.0:
            severity = "high"
        elif construction_percentage > 2.0:
            severity = "moderate"
        elif construction_percentage > 0.5:
            severity = "low"
        else:
            severity = "negligible"
        
        return {
            'type': 'construction_analysis',
            'algorithm': 'cusum_construction',
            'change_detected': construction_percentage > 0.5,
            'construction_percentage': construction_percentage,
            'severity': severity,
            'confidence': construction_stats['mean_construction_confidence'],
            'spatial_metrics': construction_stats,
            'construction_map': construction_results['construction_map'].astype(int).tolist()
        }
    
    def _detect_deforestation(
        self, 
        before_features: Dict, 
        after_features: Dict,
        baseline_stats: Dict
    ) -> Dict:
        """CUSUM-based deforestation detection"""
        
        logger.debug("Detecting deforestation...")
        
        ndvi_before = before_features['indices']['ndvi']
        ndvi_after = after_features['indices']['ndvi']
        
        # Get baseline statistics
        ndvi_baseline = baseline_stats.get('ndvi', {})
        baseline_mean = ndvi_baseline.get('mean', np.nanmean(ndvi_before))
        baseline_std = ndvi_baseline.get('std', np.nanstd(ndvi_before))
        
        # Use specialized deforestation detector
        deforestation_detector = self.algorithms['cusum_deforestation']
        
        # Calculate mean NDVI change for overall assessment
        mean_ndvi_after = np.nanmean(ndvi_after)
        
        # Additional vegetation indices for confirmation
        additional_indices = {}
        if 'evi' in after_features['indices']:
            evi_after = np.nanmean(after_features['indices']['evi'])
            evi_baseline = baseline_stats.get('evi', {}).get('mean', evi_after)
            additional_indices['evi'] = (evi_after, evi_baseline)
        
        # Detect deforestation
        deforestation_detected, severity_score, severity_level, metadata = deforestation_detector.detect_deforestation(
            mean_ndvi_after, baseline_mean, baseline_std, additional_indices
        )
        
        # Spatial analysis for deforestation extent
        spatial_results = deforestation_detector.process_spatial_data(
            -ndvi_after,  # Invert for CUSUM increase detection
            -baseline_mean, 
            baseline_std
        )
        
        # Calculate deforestation metrics
        deforestation_pixels = spatial_results['spatial_stats']['changed_pixels']
        total_pixels = spatial_results['spatial_stats']['total_pixels']
        deforestation_percentage = (deforestation_pixels / total_pixels * 100) if total_pixels > 0 else 0
        
        return {
            'type': 'deforestation_analysis',
            'algorithm': 'cusum_deforestation',
            'change_detected': deforestation_detected,
            'severity_level': severity_level,
            'severity_score': severity_score,
            'deforestation_percentage': deforestation_percentage,
            'confidence': severity_score,
            'spatial_metrics': {
                'total_pixels': total_pixels,
                'deforestation_pixels': deforestation_pixels,
                'mean_ndvi_change': metadata.get('ndvi_change_magnitude', 0),
                'additional_confirmations': metadata.get('additional_confirmations', 0)
            },
            'deforestation_map': spatial_results['change_map'].astype(int).tolist()
        }
    
    def _calculate_baseline_stats(self, features: Dict) -> Dict:
        """Calculate baseline statistics from features"""
        
        baseline_stats = {}
        
        for index_name, index_data in features['indices'].items():
            if isinstance(index_data, np.ndarray):
                baseline_stats[index_name] = {
                    'mean': float(np.nanmean(index_data)),
                    'std': float(np.nanstd(index_data)),
                    'min': float(np.nanmin(index_data)),
                    'max': float(np.nanmax(index_data)),
                    'percentile_25': float(np.nanpercentile(index_data, 25)),
                    'percentile_75': float(np.nanpercentile(index_data, 75))
                }
        
        return baseline_stats
    
    def _calculate_overall_confidence(self, detections: List[Dict]) -> float:
        """Calculate weighted overall confidence score"""
        
        if not detections:
            return 0.0
        
        # Weights for different detection types
        weights = {
            'vegetation_analysis': 0.25,
            'water_quality_analysis': 0.20,
            'coastal_analysis': 0.20,
            'construction_analysis': 0.25,
            'deforestation_analysis': 0.10
        }
        
        weighted_confidence = 0
        total_weight = 0
        
        for detection in detections:
            detection_type = detection.get('type', '')
            confidence = detection.get('confidence', 0)
            
            # Only include detections that actually detected changes
            if detection.get('change_detected', False):
                weight = weights.get(detection_type, 0.1)
                weighted_confidence += confidence * weight
                total_weight += weight
        
        return weighted_confidence / total_weight if total_weight > 0 else 0.0
    
    def _calculate_priority_level(self, detections: List[Dict]) -> str:
        """Calculate priority level based on detection results"""
        
        high_priority_types = ['construction_analysis', 'deforestation_analysis']
        medium_priority_types = ['vegetation_analysis', 'coastal_analysis']
        
        max_confidence = 0
        priority_type = None
        
        for detection in detections:
            if detection.get('change_detected', False):
                confidence = detection.get('confidence', 0)
                detection_type = detection.get('type', '')
                
                if detection_type in high_priority_types and confidence > 0.7:
                    return 'high'
                elif detection_type in medium_priority_types and confidence > max_confidence:
                    max_confidence = confidence
                    priority_type = detection_type
        
        if max_confidence > 0.7:
            return 'medium'
        elif max_confidence > 0.3:
            return 'low'
        else:
            return 'info'
    
    def _create_enhanced_visualizations(
        self, 
        before_image: np.ndarray, 
        after_image: np.ndarray, 
        detections: List[Dict]
    ) -> Dict:
        """Create enhanced visualizations for different detection types"""
        
        visualizations = {}
        
        try:
            # Create RGB composites
            rgb_before = self._normalize_for_display(before_image[:, :, :3])
            rgb_after = self._normalize_for_display(after_image[:, :, :3])
            
            # Side-by-side comparison
            comparison = np.hstack([rgb_before, rgb_after])
            visualizations['rgb_comparison'] = comparison.tolist()
            
            # Create change overlays for each detection type
            for detection in detections:
                detection_type = detection.get('type', '')
                
                if 'change_mask' in detection:
                    change_mask = np.array(detection['change_mask'])
                elif 'construction_map' in detection:
                    change_mask = np.array(detection['construction_map'])
                elif 'deforestation_map' in detection:
                    change_mask = np.array(detection['deforestation_map'])
                else:
                    continue
                
                overlay = self._create_change_overlay(rgb_after, change_mask, detection_type)
                visualizations[f"{detection_type}_overlay"] = overlay.tolist()
            
        except Exception as e:
            logger.error(f"Error creating visualizations: {e}")
            visualizations['error'] = str(e)
        
        return visualizations
    
    def _normalize_for_display(self, image: np.ndarray) -> np.ndarray:
        """Normalize image for display (0-255 uint8)"""
        
        if image.max() <= 1.0:
            return (image * 255).astype(np.uint8)
        else:
            img_min, img_max = image.min(), image.max()
            if img_max > img_min:
                normalized = (image - img_min) / (img_max - img_min)
                return (normalized * 255).astype(np.uint8)
            else:
                return np.zeros_like(image, dtype=np.uint8)
    
    def _create_change_overlay(
        self, 
        base_image: np.ndarray, 
        change_mask: np.ndarray, 
        detection_type: str
    ) -> np.ndarray:
        """Create colored overlay for detected changes"""
        
        overlay = base_image.copy()
        
        # Color coding for different change types
        colors = {
            'vegetation': (0, 255, 0),  # Green for vegetation changes
            'construction': (255, 0, 0),  # Red for construction
            'water': (0, 0, 255),  # Blue for water changes
            'unknown': (255, 255, 0)  # Yellow for unknown changes
        }

        # Get color for this detection type
        color = colors.get(detection_type, colors['unknown'])

        # Apply overlay where changes are detected
        overlay[change_mask > 0] = color

        return overlay
    
    def _apply_fusion_analysis(
        self,
        before_features: Dict,
        after_features: Dict,
        historical_data: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Apply Multi-Sensor Fusion for intelligent change classification
        
        Args:
            before_features: Spectral features from previous image
            after_features: Spectral features from current image
            historical_data: Optional historical spectral index data
            
        Returns:
            Fusion analysis results with risk scores and classifications
        """
        
        logger.debug("Running multi-sensor fusion analysis...")
        
        try:
            # Extract mean spectral indices from spatial data
            current_indices = {}
            previous_indices = {}
            
            for index_name, index_data in after_features['indices'].items():
                if isinstance(index_data, np.ndarray):
                    current_indices[index_name] = float(np.nanmean(index_data))
                else:
                    current_indices[index_name] = float(index_data)
            
            for index_name, index_data in before_features['indices'].items():
                if isinstance(index_data, np.ndarray):
                    previous_indices[index_name] = float(np.nanmean(index_data))
                else:
                    previous_indices[index_name] = float(index_data)
            
            # Apply fusion algorithm
            fusion_result = self.fusion_engine.analyze(
                current_indices=current_indices,
                previous_indices=previous_indices,
                historical_indices=historical_data,
                aoi_metadata=None  # Can add AOI metadata later
            )
            
            # Convert FusionResult to dictionary
            return {
                'composite_risk_score': fusion_result.composite_risk_score,
                'risk_level': fusion_result.risk_level,
                'category': fusion_result.category.value,
                'confidence': fusion_result.confidence,
                'primary_indicators': fusion_result.primary_indicators,
                'supporting_evidence': fusion_result.supporting_evidence,
                'seasonal_likelihood': fusion_result.seasonal_likelihood,
                'recommendation': fusion_result.recommendation,
                'change_detected': fusion_result.composite_risk_score > 0.3,
                'details': fusion_result.details
            }
            
        except Exception as e:
            logger.error(f"Error in fusion analysis: {e}")
            return {
                'error': str(e),
                'change_detected': False,
                'confidence': 0.0
            }
    
    def _generate_analysis_summary(self, results: Dict) -> str:
        """Generate human-readable analysis summary"""
        summary_parts = []
        
        # NEW: Include fusion analysis results if available
        fusion_analysis = results.get('fusion_analysis')
        if fusion_analysis and fusion_analysis.get('change_detected'):
            category = fusion_analysis.get('category', 'unknown').replace('_', ' ').title()
            risk_level = fusion_analysis.get('risk_level', 'unknown').upper()
            confidence = fusion_analysis.get('confidence', 0)
            risk_score = fusion_analysis.get('composite_risk_score', 0)
            
            summary_parts.append(
                f"Multi-Sensor Fusion: {category} detected "
                f"(Risk: {risk_level}, Score: {risk_score:.2f}, Confidence: {confidence:.1%})"
            )
        
        detections = results.get('detections', [])
        detected_changes = [d for d in detections if d.get('change_detected', False)]
        
        if not detected_changes and not summary_parts:
            return "No significant environmental changes detected in the monitored area."
        
        for detection in detected_changes:
            detection_type = detection.get('type', 'unknown').replace('_', ' ').title()
            confidence = detection.get('confidence', 0)
            severity = detection.get('severity', 'unknown')
            
            summary_parts.append(
                f"{detection_type} detected with {confidence:.1%} confidence (severity: {severity})"
            )
        
        overall_confidence = results.get('overall_confidence', 0)
        return f"Analysis Summary (Overall confidence: {overall_confidence:.1%}):\n" + "\n".join(summary_parts)
    
    def _generate_recommendations(self, results: Dict) -> List[str]:
        """Generate actionable recommendations based on analysis results"""
        recommendations = []
        
        # NEW: Include fusion-based recommendations (highest priority)
        fusion_analysis = results.get('fusion_analysis')
        if fusion_analysis and fusion_analysis.get('change_detected'):
            fusion_recommendation = fusion_analysis.get('recommendation')
            if fusion_recommendation:
                recommendations.append(f"[FUSION] {fusion_recommendation}")
        
        detections = results.get('detections', [])
        detected_changes = [d for d in detections if d.get('change_detected', False)]
        
        if not detected_changes and not fusion_analysis:
            recommendations.extend([
                "Continue regular monitoring of the area",
                "Consider expanding monitoring to adjacent areas",
                "Review monitoring parameters if changes are expected"
            ])
            return recommendations
        
        # Type-specific recommendations
        for detection in detected_changes:
            detection_type = detection.get('type', '')
            confidence = detection.get('confidence', 0)
            
            if 'vegetation' in detection_type or 'deforestation' in detection_type:
                if confidence > 0.8:
                    recommendations.append("Urgent: Investigate vegetation loss immediately")
                    recommendations.append("Consider contacting local environmental authorities")
                else:
                    recommendations.append("Monitor vegetation changes closely")
                    recommendations.append("Verify changes with ground truth data")
            
            elif 'construction' in detection_type:
                recommendations.append("Verify if construction activity is authorized")
                recommendations.append("Monitor for potential environmental impact")
            
            elif 'coastal' in detection_type:
                recommendations.append("Assess coastal erosion/accretion patterns")
                recommendations.append("Consider coastal protection measures if needed")
            
            elif 'water' in detection_type:
                recommendations.append("Monitor water quality parameters")
                recommendations.append("Check for pollution sources if quality declined")
        
        # General recommendations
        recommendations.extend([
            "Increase monitoring frequency for detected change areas",
            "Document changes for trend analysis",
            "Consider ground-truth verification for high-confidence detections"
        ])
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _extract_bounds(self, geojson: Dict) -> List[float]:
        """Extract bounding box from GeoJSON geometry"""
        try:
            if geojson.get('type') == 'Polygon':
                coordinates = geojson['coordinates'][0]  # First ring
                lons = [coord[0] for coord in coordinates]
                lats = [coord[1] for coord in coordinates]
                return [min(lons), min(lats), max(lons), max(lats)]
            else:
                # Default bounds if extraction fails
                return [-180, -90, 180, 90]
        except Exception as e:
            logger.warning(f"Error extracting bounds from GeoJSON: {e}")
            return [-180, -90, 180, 90]