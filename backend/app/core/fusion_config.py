"""
Multi-Sensor Fusion Configuration
Region-specific thresholds and weights for improved accuracy
"""

from typing import Dict, Optional
from enum import Enum


class Region(str, Enum):
    """Geographic regions with specific environmental characteristics"""
    INDIA_NORTHEAST = "india_northeast"  # Assam, Meghalaya, etc.
    INDIA_COASTAL = "india_coastal"  # Kerala, Tamil Nadu, etc.
    INDIA_PLAINS = "india_plains"  # Punjab, Haryana, etc.
    INDIA_HIMALAYAN = "india_himalayan"  # Uttarakhand, HP, etc.
    INDIA_DESERT = "india_desert"  # Rajasthan
    GLOBAL_TROPICAL = "global_tropical"
    GLOBAL_TEMPERATE = "global_temperate"
    GLOBAL_ARID = "global_arid"
    DEFAULT = "default"


class FusionConfig:
    """
    Configuration for Multi-Sensor Fusion with region-specific tuning
    """
    
    # Base significance thresholds (percentage change)
    BASE_THRESHOLDS = {
        'ndvi': 15.0,
        'evi': 20.0,
        'ndwi': 20.0,
        'mndwi': 25.0,
        'ndbi': 15.0,
        'bsi': 20.0,
        'nbri': 25.0,
        'turbidity_index': 30.0,
        'algae_index': 25.0,
        'thermal_proxy': 15.0,
        'savi': 20.0,
        'bai': 20.0
    }
    
    # Region-specific threshold adjustments (multipliers)
    REGION_ADJUSTMENTS = {
        Region.INDIA_NORTHEAST: {
            # High rainfall, dense vegetation - more sensitive to vegetation changes
            'ndvi': 0.8,  # 20% more sensitive
            'evi': 0.85,
            'ndwi': 1.2,  # Less sensitive (naturally high water content)
            'mndwi': 1.2,
            'algae_index': 0.9,  # More sensitive (monsoon impacts)
            'turbidity_index': 0.85
        },
        Region.INDIA_COASTAL: {
            # High water sensitivity, algal bloom risk
            'ndwi': 0.9,
            'mndwi': 0.85,
            'algae_index': 0.75,  # Very sensitive
            'turbidity_index': 0.8,
            'ndvi': 1.1  # Less sensitive (consistent vegetation)
        },
        Region.INDIA_PLAINS: {
            # Agricultural focus, seasonal variation
            'ndvi': 1.2,  # Less sensitive (high natural variation)
            'evi': 1.2,
            'savi': 1.15,
            'ndbi': 0.9,  # More sensitive to urbanization
            'bai': 0.9
        },
        Region.INDIA_HIMALAYAN: {
            # Forest focus, burn risk
            'ndvi': 0.85,
            'nbri': 0.8,  # Very sensitive to fire
            'thermal_proxy': 0.85,
            'ndwi': 1.1  # Less sensitive (glacial water)
        },
        Region.INDIA_DESERT: {
            # Arid conditions, construction monitoring
            'ndvi': 1.5,  # Much less sensitive (naturally low)
            'bsi': 0.85,  # More sensitive
            'ndbi': 0.85,
            'bai': 0.85,
            'ndwi': 1.5  # Very insensitive (minimal water)
        },
        Region.DEFAULT: {
            # No adjustments - use base thresholds
            index: 1.0 for index in BASE_THRESHOLDS.keys()
        }
    }
    
    # Category detection weights (can be adjusted per region)
    CATEGORY_WEIGHTS = {
        'vegetation_loss': {
            'ndvi': 0.35,
            'evi': 0.25,
            'savi': 0.20,
            'nbri': 0.15,
            'bsi': 0.05
        },
        'construction': {
            'ndbi': 0.40,
            'ndvi': 0.25,
            'bai': 0.20,
            'thermal_proxy': 0.10,
            'bsi': 0.05
        },
        'water_change': {
            'ndwi': 0.35,
            'mndwi': 0.30,
            'turbidity_index': 0.20,
            'ndvi': 0.10,
            'algae_index': 0.05
        },
        'mining': {
            'ndvi': 0.30,
            'ndwi': 0.25,
            'bsi': 0.25,
            'nbri': 0.15,
            'ndbi': 0.05
        }
    }
    
    # Risk level thresholds
    RISK_THRESHOLDS = {
        'critical': 0.75,
        'high': 0.50,
        'medium': 0.25,
        'low': 0.0
    }
    
    # Seasonal detection parameters
    SEASONAL_CONFIG = {
        'min_historical_samples': 4,  # Minimum samples for seasonal detection
        'cv_threshold': 0.5,  # Coefficient of variation threshold
        'seasonal_discount': 0.7,  # Risk reduction for seasonal changes
        'agricultural_months': [5, 6, 7, 8, 9, 10]  # Kharif + Rabi seasons (May-Oct)
    }
    
    # Confidence boosters for strong multi-index agreement
    CONFIDENCE_BOOSTERS = {
        'multiple_primary': 0.15,  # Boost if 3+ primary indicators agree
        'supporting_evidence': 0.10,  # Boost if 5+ supporting indices
        'temporal_consistency': 0.20  # Boost if change persists over time
    }
    
    def __init__(self, region: Region = Region.DEFAULT):
        """
        Initialize fusion config for a specific region
        
        Args:
            region: Geographic region for threshold optimization
        """
        self.region = region
        self.thresholds = self._calculate_regional_thresholds()
    
    def _calculate_regional_thresholds(self) -> Dict[str, float]:
        """Calculate adjusted thresholds for the region"""
        adjustments = self.REGION_ADJUSTMENTS.get(
            self.region, 
            self.REGION_ADJUSTMENTS[Region.DEFAULT]
        )
        
        thresholds = {}
        for index, base_threshold in self.BASE_THRESHOLDS.items():
            multiplier = adjustments.get(index, 1.0)
            thresholds[index] = base_threshold * multiplier
        
        return thresholds
    
    def get_threshold(self, index_name: str) -> float:
        """Get threshold for a specific index"""
        return self.thresholds.get(index_name, 20.0)
    
    def get_weights(self, category: str) -> Dict[str, float]:
        """Get weights for a specific change category"""
        return self.CATEGORY_WEIGHTS.get(category, {})
    
    def get_risk_threshold(self, level: str) -> float:
        """Get risk score threshold for a level"""
        return self.RISK_THRESHOLDS.get(level, 0.0)
    
    @classmethod
    def detect_region(cls, latitude: float, longitude: float) -> Region:
        """
        Automatically detect region from coordinates
        
        Args:
            latitude: Latitude in degrees
            longitude: Longitude in degrees
            
        Returns:
            Detected region
        """
        # India bounds check
        if 8.0 <= latitude <= 35.0 and 68.0 <= longitude <= 97.0:
            # Within India
            
            # Northeast India (Assam, Meghalaya, etc.)
            if latitude >= 24.0 and longitude >= 88.0:
                return Region.INDIA_NORTHEAST
            
            # Himalayan region
            elif latitude >= 28.0:
                return Region.INDIA_HIMALAYAN
            
            # Coastal regions (approximation)
            elif (latitude <= 12.0 or  # South coast
                  (longitude <= 73.0 and 15.0 <= latitude <= 20.0) or  # West coast
                  (longitude >= 85.0 and latitude <= 20.0)):  # East coast
                return Region.INDIA_COASTAL
            
            # Desert region (Rajasthan)
            elif longitude <= 75.0 and 24.0 <= latitude <= 30.0:
                return Region.INDIA_DESERT
            
            # Plains (default for India)
            else:
                return Region.INDIA_PLAINS
        
        # Global regions
        elif -23.5 <= latitude <= 23.5:
            return Region.GLOBAL_TROPICAL
        elif abs(latitude) < 45:
            return Region.GLOBAL_TEMPERATE
        else:
            return Region.GLOBAL_ARID
    
    @classmethod
    def from_coordinates(cls, latitude: float, longitude: float) -> 'FusionConfig':
        """
        Create config optimized for specific coordinates
        
        Args:
            latitude: Latitude in degrees
            longitude: Longitude in degrees
            
        Returns:
            FusionConfig optimized for the location
        """
        region = cls.detect_region(latitude, longitude)
        return cls(region=region)


# Predefined configurations for common scenarios
CONFIGS = {
    'india_northeast': FusionConfig(Region.INDIA_NORTHEAST),
    'india_coastal': FusionConfig(Region.INDIA_COASTAL),
    'india_plains': FusionConfig(Region.INDIA_PLAINS),
    'india_himalayan': FusionConfig(Region.INDIA_HIMALAYAN),
    'india_desert': FusionConfig(Region.INDIA_DESERT),
    'default': FusionConfig(Region.DEFAULT)
}


def get_config_for_location(latitude: float, longitude: float) -> FusionConfig:
    """
    Get fusion configuration optimized for a location
    
    Args:
        latitude: Latitude in degrees
        longitude: Longitude in degrees
        
    Returns:
        Optimized FusionConfig
    """
    return FusionConfig.from_coordinates(latitude, longitude)


def print_config_info(config: FusionConfig):
    """Print configuration details for debugging"""
    print(f"Fusion Configuration for Region: {config.region.value}")
    print("=" * 60)
    print("\nAdjusted Thresholds:")
    for index, threshold in sorted(config.thresholds.items()):
        base = FusionConfig.BASE_THRESHOLDS[index]
        adjustment = (threshold - base) / base * 100
        sign = "+" if adjustment > 0 else ""
        print(f"  {index:20s}: {threshold:5.1f}% ({sign}{adjustment:+.0f}%)")
    print("=" * 60)


# Example usage
if __name__ == "__main__":
    # Test different regions
    test_locations = [
        (26.1445, 91.7362, "Guwahati, Assam"),
        (22.5726, 88.3639, "Kolkata, West Bengal"),
        (28.6139, 77.2090, "Delhi"),
        (15.2993, 74.1240, "Goa (Coastal)"),
        (27.0238, 74.2179, "Rajasthan (Desert)")
    ]
    
    for lat, lon, name in test_locations:
        print(f"\nLocation: {name} ({lat:.4f}, {lon:.4f})")
        config = get_config_for_location(lat, lon)
        print(f"Detected Region: {config.region.value}")
        print(f"NDVI Threshold: {config.get_threshold('ndvi'):.1f}%")
        print(f"Algae Threshold: {config.get_threshold('algae_index'):.1f}%")
        print("-" * 60)
