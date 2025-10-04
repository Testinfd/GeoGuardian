"""
Spectral Analysis Module for GeoGuardian
Comprehensive spectral indices calculation and analysis
"""

import numpy as np
from typing import Dict, Optional

class SpectralAnalyzer:
    """Comprehensive spectral analysis for satellite imagery"""
    
    def __init__(self):
        self.epsilon = 1e-8  # Avoid division by zero
    
    def extract_all_features(self, image: np.ndarray) -> Dict:
        """Extract comprehensive features from satellite imagery"""
        
        # Extract bands (assuming standard Sentinel-2 order)
        bands = self._extract_bands(image)
        
        # Calculate spectral indices
        indices = self._calculate_all_indices(bands)
        
        return {
            'bands': bands,
            'indices': indices,
            'metadata': {
                'image_shape': image.shape,
                'band_count': image.shape[2] if image.ndim == 3 else 1
            }
        }
    
    def _extract_bands(self, image: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Extract individual bands from multi-band image
        
        Assumes standard Sentinel-2 band order after preprocessing:
        B02, B03, B04, B08, B05, B06, B07, B11, B12, (SCL)
        """
        
        bands = {}
        
        if image.ndim < 2:
            raise ValueError("Image must be at least 2-dimensional")
        
        # Handle grayscale images
        if image.ndim == 2:
            return {'grayscale': image}
        
        # Validate minimum bands for basic analysis
        if image.shape[2] < 4:
            raise ValueError(f"Image must have at least 4 bands for spectral analysis, got {image.shape[2]}")
        
        # Extract core bands (RGB + NIR) - always available for Sentinel-2
        bands['blue'] = image[:, :, 0]    # B02
        bands['green'] = image[:, :, 1]   # B03  
        bands['red'] = image[:, :, 2]     # B04
        bands['nir'] = image[:, :, 3]     # B08
        
        # Additional bands if available (red edge and SWIR)
        if image.shape[2] >= 6:
            bands['red_edge_1'] = image[:, :, 4]  # B05
            bands['red_edge_2'] = image[:, :, 5]  # B06
        if image.shape[2] >= 8:
            bands['red_edge_3'] = image[:, :, 6]  # B07
            bands['swir_1'] = image[:, :, 7]      # B11
        if image.shape[2] >= 9:
            bands['swir_2'] = image[:, :, 8]      # B12
        # Note: SCL band (if present) is typically the last band and is handled separately
        
        return bands
    
    def _calculate_all_indices(self, bands: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """
        Calculate comprehensive set of spectral indices with error handling
        
        Returns only the indices that can be calculated based on available bands.
        """
        
        indices = {}
        
        try:
            # Vegetation indices
            if 'nir' in bands and 'red' in bands:
                indices['ndvi'] = (bands['nir'] - bands['red']) / (bands['nir'] + bands['red'] + self.epsilon)
            
            if 'nir' in bands and 'red' in bands and 'blue' in bands:
                indices['evi'] = 2.5 * ((bands['nir'] - bands['red']) / 
                                       (bands['nir'] + 6*bands['red'] - 7.5*bands['blue'] + 1 + self.epsilon))
            
            # Water indices  
            if 'green' in bands and 'nir' in bands:
                indices['ndwi'] = (bands['green'] - bands['nir']) / (bands['green'] + bands['nir'] + self.epsilon)
            
            if 'green' in bands and 'swir_1' in bands:
                indices['mndwi'] = (bands['green'] - bands['swir_1']) / (bands['green'] + bands['swir_1'] + self.epsilon)
            
            # Soil/construction indices
            if all(b in bands for b in ['swir_1', 'red', 'nir', 'blue']):
                indices['bsi'] = ((bands['swir_1'] + bands['red']) - (bands['nir'] + bands['blue'])) / \
                                ((bands['swir_1'] + bands['red']) + (bands['nir'] + bands['blue']) + self.epsilon)
            
            # NDBI (Normalized Difference Built-up Index) - Urban/construction detection
            if 'swir_1' in bands and 'nir' in bands:
                indices['ndbi'] = (bands['swir_1'] - bands['nir']) / \
                                 (bands['swir_1'] + bands['nir'] + self.epsilon)
            
            # BAI (Built-up Area Index) - Alternative urban detection
            if 'red' in bands and 'nir' in bands:
                indices['bai'] = 1.0 / ((0.1 - bands['red']) ** 2 + (0.06 - bands['nir']) ** 2 + self.epsilon)
            
            # SAVI (Soil Adjusted Vegetation Index) - Better for areas with exposed soil
            if 'nir' in bands and 'red' in bands:
                L = 0.5  # Soil brightness correction factor
                indices['savi'] = ((bands['nir'] - bands['red']) / \
                                  (bands['nir'] + bands['red'] + L + self.epsilon)) * (1 + L)
            
            # NBRI (Normalized Burn Ratio Index) - Burned areas and fire damage
            if 'nir' in bands and 'swir_2' in bands:
                indices['nbri'] = (bands['nir'] - bands['swir_2']) / \
                                 (bands['nir'] + bands['swir_2'] + self.epsilon)
            
            # Thermal Proxy (using SWIR1 as thermal indicator)
            if 'swir_1' in bands:
                indices['thermal_proxy'] = bands['swir_1']
            
            # Specialized indices
            if 'red_edge_1' in bands and 'red' in bands:
                indices['algae_index'] = bands['red_edge_1'] / (bands['red'] + self.epsilon)
            
            if 'red' in bands and 'nir' in bands:
                indices['turbidity_index'] = bands['red'] / (bands['nir'] + self.epsilon)
            
            # Clip indices to reasonable ranges to avoid numerical issues
            for key in indices:
                indices[key] = np.clip(indices[key], -1.5, 1.5)
            
        except Exception as e:
            import logging
            logging.warning(f"Error calculating spectral indices: {str(e)}")
        
        return indices
