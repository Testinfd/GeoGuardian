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
        """Extract individual bands from multi-band image"""
        
        bands = {}
        
        if image.ndim == 3 and image.shape[2] >= 4:
            bands['blue'] = image[:, :, 0]    # B02
            bands['green'] = image[:, :, 1]   # B03  
            bands['red'] = image[:, :, 2]     # B04
            bands['nir'] = image[:, :, 3]     # B08
            
            # Additional bands if available
            if image.shape[2] >= 6:
                bands['red_edge_1'] = image[:, :, 4]  # B05
                bands['red_edge_2'] = image[:, :, 5]  # B06
            if image.shape[2] >= 8:
                bands['red_edge_3'] = image[:, :, 6]  # B07
                bands['swir_1'] = image[:, :, 7]      # B11
            if image.shape[2] >= 10:
                bands['swir_2'] = image[:, :, 8]      # B12
        
        return bands
    
    def _calculate_all_indices(self, bands: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Calculate comprehensive set of spectral indices"""
        
        indices = {}
        
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
        if 'swir_1' in bands and 'red' in bands and 'nir' in bands and 'blue' in bands:
            indices['bsi'] = ((bands['swir_1'] + bands['red']) - (bands['nir'] + bands['blue'])) / \
                            ((bands['swir_1'] + bands['red']) + (bands['nir'] + bands['blue']) + self.epsilon)
        
        # Specialized indices
        if 'red_edge_1' in bands and 'red' in bands:
            indices['algae_index'] = bands['red_edge_1'] / (bands['red'] + self.epsilon)
        
        if 'red' in bands and 'nir' in bands:
            indices['turbidity_index'] = bands['red'] / (bands['nir'] + self.epsilon)
        
        return indices
