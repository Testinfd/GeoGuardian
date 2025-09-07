"""
Spectral Analyzer for Advanced Environmental Monitoring
Enhanced spectral analysis inspired by CyFi water quality detection

This module provides comprehensive spectral index calculations for:
- Vegetation monitoring (NDVI, EVI, Red Edge NDVI)
- Water quality assessment (NDWI, MNDWI, AWEI)
- Soil/construction detection (BSI, NBR)
- Specialized indices (Plastic, Algae, Turbidity)
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Union
import logging

logger = logging.getLogger(__name__)


class SpectralAnalyzer:
    """
    Advanced spectral analysis engine for environmental monitoring

    Processes Sentinel-2 bands to extract meaningful environmental indicators
    using physics-based spectral indices and machine learning-ready features.
    """

    def __init__(self):
        """Initialize spectral analyzer with epsilon for division by zero protection"""
        self.epsilon = 1e-8
        self.band_names = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06',
                          'B07', 'B08', 'B8A', 'B09', 'B10', 'B11', 'B12']

    def analyze_spectral_data(
        self,
        sentinel_bands: Dict[str, np.ndarray],
        include_statistics: bool = True
    ) -> Dict[str, Union[np.ndarray, Dict]]:
        """
        Perform comprehensive spectral analysis on Sentinel-2 data

        Args:
            sentinel_bands: Dictionary of band data (e.g., {'B02': array, ...})
            include_statistics: Whether to include summary statistics

        Returns:
            Dictionary containing all spectral indices and optional statistics
        """

        # Calculate all spectral indices
        indices = {}

        # Vegetation indices
        indices.update(self._calculate_vegetation_indices(sentinel_bands))

        # Water indices
        indices.update(self._calculate_water_indices(sentinel_bands))

        # Soil/Construction indices
        indices.update(self._calculate_soil_indices(sentinel_bands))

        # Specialized indices
        indices.update(self._calculate_specialized_indices(sentinel_bands))

        # Add statistics if requested
        if include_statistics:
            for index_name, index_data in indices.items():
                if isinstance(index_data, np.ndarray):
                    indices[f"{index_name}_stats"] = self._calculate_statistics(index_data)

        return indices

    def _calculate_vegetation_indices(self, bands: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Calculate vegetation-related spectral indices"""
        indices = {}

        # Normalized Difference Vegetation Index
        indices['ndvi'] = (bands['B08'] - bands['B04']) / (bands['B08'] + bands['B04'] + self.epsilon)

        # Enhanced Vegetation Index
        indices['evi'] = 2.5 * ((bands['B08'] - bands['B04']) /
                               (bands['B08'] + 6 * bands['B04'] - 7.5 * bands['B02'] + 1))

        # Red Edge NDVI (using B05 - Red Edge band)
        indices['red_edge_ndvi'] = (bands['B08'] - bands['B05']) / (bands['B08'] + bands['B05'] + self.epsilon)

        # Green NDVI
        indices['green_ndvi'] = (bands['B08'] - bands['B03']) / (bands['B08'] + bands['B03'] + self.epsilon)

        return indices

    def _calculate_water_indices(self, bands: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Calculate water-related spectral indices"""
        indices = {}

        # Normalized Difference Water Index
        indices['ndwi'] = (bands['B03'] - bands['B08']) / (bands['B03'] + bands['B08'] + self.epsilon)

        # Modified NDWI
        indices['mndwi'] = (bands['B03'] - bands['B11']) / (bands['B03'] + bands['B11'] + self.epsilon)

        # Automated Water Extraction Index
        indices['awei'] = (4 * (bands['B03'] - bands['B11']) -
                          (0.25 * bands['B08'] + 2.75 * bands['B12']))

        # Water turbidity proxy (using red/NIR ratio)
        indices['turbidity_proxy'] = bands['B04'] / (bands['B08'] + self.epsilon)

        return indices

    def _calculate_soil_indices(self, bands: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Calculate soil and construction-related spectral indices"""
        indices = {}

        # Bare Soil Index
        indices['bsi'] = ((bands['B11'] + bands['B04']) - (bands['B08'] + bands['B02'])) / \
                        ((bands['B11'] + bands['B04']) + (bands['B08'] + bands['B02']) + self.epsilon)

        # Normalized Burn Ratio (useful for construction/destruction detection)
        indices['nbr'] = (bands['B08'] - bands['B12']) / (bands['B08'] + bands['B12'] + self.epsilon)

        # Urban Index (highlights urban/construction areas)
        indices['urban_index'] = ((bands['B12'] - bands['B08']) / (bands['B12'] + bands['B08'] + self.epsilon))

        return indices

    def _calculate_specialized_indices(self, bands: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Calculate specialized spectral indices for specific applications"""
        indices = {}

        # Plastic waste detection (near-infrared spectral signature)
        indices['plastic_index'] = (bands['B11'] - bands['B08']) / (bands['B11'] + bands['B08'] + self.epsilon)

        # Algae bloom detection (red edge band ratio)
        indices['algae_index'] = bands['B05'] / (bands['B04'] + self.epsilon)

        # Chlorophyll-a proxy
        indices['chl_a_proxy'] = (bands['B05'] - bands['B04']) / (bands['B05'] + bands['B04'] + self.epsilon)

        # Sediment/turbidity index
        indices['sediment_index'] = (bands['B11'] - bands['B02']) / (bands['B11'] + bands['B02'] + self.epsilon)

        return indices

    def _calculate_statistics(self, index_data: np.ndarray) -> Dict[str, float]:
        """Calculate summary statistics for spectral index"""
        return {
            'mean': float(np.nanmean(index_data)),
            'std': float(np.nanstd(index_data)),
            'median': float(np.nanmedian(index_data)),
            'min': float(np.nanmin(index_data)),
            'max': float(np.nanmax(index_data)),
            'p25': float(np.nanpercentile(index_data, 25)),
            'p75': float(np.nanpercentile(index_data, 75)),
            'p95': float(np.nanpercentile(index_data, 95))
        }

    def detect_anomalies(
        self,
        indices: Dict[str, np.ndarray],
        baseline_values: Optional[Dict[str, float]] = None,
        threshold_multiplier: float = 2.0
    ) -> Dict[str, Dict]:
        """
        Detect spectral anomalies based on index values

        Args:
            indices: Dictionary of calculated spectral indices
            baseline_values: Optional baseline values for comparison
            threshold_multiplier: Multiplier for anomaly detection threshold

        Returns:
            Dictionary of anomaly detection results per index
        """

        anomalies = {}

        for index_name, index_data in indices.items():
            if not isinstance(index_data, np.ndarray) or index_data.size == 0:
                continue

            # Use provided baseline or calculate from data
            baseline = baseline_values.get(index_name) if baseline_values else np.nanmean(index_data)

            # Calculate deviation from baseline
            deviation = np.abs(index_data - baseline)

            # Calculate threshold based on data variability
            threshold = threshold_multiplier * np.nanstd(index_data)

            # Detect anomalies
            anomaly_mask = deviation > threshold

            anomalies[index_name] = {
                'anomaly_count': int(np.sum(anomaly_mask)),
                'anomaly_percentage': float(np.sum(anomaly_mask) / index_data.size * 100),
                'max_deviation': float(np.max(deviation)),
                'mean_deviation': float(np.mean(deviation)),
                'threshold': float(threshold),
                'anomaly_mask': anomaly_mask
            }

        return anomalies

    def extract_features_for_ml(
        self,
        sentinel_bands: Dict[str, np.ndarray],
        window_size: int = 3
    ) -> np.ndarray:
        """
        Extract features suitable for machine learning models

        Args:
            sentinel_bands: Dictionary of Sentinel-2 bands
            window_size: Size of moving window for texture features

        Returns:
            Feature matrix for ML models
        """

        features = []

        # Raw band values (mean, std, percentiles)
        for band_name, band_data in sentinel_bands.items():
            features.extend([
                np.nanmean(band_data),
                np.nanstd(band_data),
                np.nanmedian(band_data),
                np.nanpercentile(band_data, 25),
                np.nanpercentile(band_data, 75)
            ])

        # Spectral indices
        indices = self.analyze_spectral_data(sentinel_bands, include_statistics=False)
        for index_name, index_data in indices.items():
            if isinstance(index_data, np.ndarray):
                features.extend([
                    np.nanmean(index_data),
                    np.nanstd(index_data),
                    np.nanpercentile(index_data, 95)  # High values often indicate anomalies
                ])

        # Texture features (GLCM-like features from moving windows)
        texture_features = self._extract_texture_features(
            sentinel_bands['B08'], window_size
        )
        features.extend(texture_features)

        return np.array(features)

    def _extract_texture_features(self, band_data: np.ndarray, window_size: int) -> List[float]:
        """Extract texture features from spectral data"""
        features = []

        try:
            # Simple texture metrics
            # Variance in moving windows
            from scipy.ndimage import generic_filter
            variance = generic_filter(band_data, np.var, size=window_size)
            features.append(np.nanmean(variance))

            # Range in moving windows
            range_func = lambda x: np.max(x) - np.min(x)
            range_data = generic_filter(band_data, range_func, size=window_size)
            features.append(np.nanmean(range_data))

            # Entropy-like measure
            entropy = generic_filter(band_data, self._entropy, size=window_size)
            features.append(np.nanmean(entropy))

        except Exception as e:
            logger.warning(f"Error extracting texture features: {e}")
            features.extend([0.0, 0.0, 0.0])  # Default values

        return features

    def _entropy(self, values: np.ndarray) -> float:
        """Calculate entropy of values"""
        values = values.flatten()
        hist, _ = np.histogram(values, bins=10, density=True)
        hist = hist[hist > 0]  # Remove zeros
        if len(hist) == 0:
            return 0.0
        return -np.sum(hist * np.log2(hist))

    def get_available_indices(self) -> List[str]:
        """Get list of all available spectral indices"""
        return [
            # Vegetation
            'ndvi', 'evi', 'red_edge_ndvi', 'green_ndvi',
            # Water
            'ndwi', 'mndwi', 'awei', 'turbidity_proxy',
            # Soil/Construction
            'bsi', 'nbr', 'urban_index',
            # Specialized
            'plastic_index', 'algae_index', 'chl_a_proxy', 'sediment_index'
        ]

    def get_index_description(self, index_name: str) -> str:
        """Get description of a spectral index"""
        descriptions = {
            'ndvi': 'Normalized Difference Vegetation Index - measures vegetation health',
            'evi': 'Enhanced Vegetation Index - improved NDVI for dense vegetation',
            'ndwi': 'Normalized Difference Water Index - detects water bodies',
            'mndwi': 'Modified NDWI - improved water detection, reduces building noise',
            'bsi': 'Bare Soil Index - detects bare soil and construction sites',
            'plastic_index': 'Plastic waste detection index using NIR spectral signature',
            'algae_index': 'Algae bloom detection using red edge bands',
            'turbidity_proxy': 'Water turbidity proxy using red/NIR ratio'
        }
        return descriptions.get(index_name, f"Description not available for {index_name}")
