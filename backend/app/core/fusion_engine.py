"""
Multi-Sensor Fusion Engine
Combines multiple spectral indices into composite risk scores with context-aware rules
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import logging
from .fusion_config import FusionConfig, Region

logger = logging.getLogger(__name__)


class ChangeCategory(str, Enum):
    """Classification categories for detected changes"""
    ILLEGAL_CONSTRUCTION = "illegal_construction"
    ILLEGAL_MINING = "illegal_mining"
    DEFORESTATION = "deforestation"
    WATER_POLLUTION = "water_pollution"
    COASTAL_EROSION = "coastal_erosion"
    ALGAL_BLOOM = "algal_bloom"
    AGRICULTURAL_EXPANSION = "agricultural_expansion"
    SEASONAL_AGRICULTURE = "seasonal_agriculture"
    URBAN_HEAT_ISLAND = "urban_heat_island"
    WILDFIRE_DAMAGE = "wildfire_damage"
    NORMAL_VARIATION = "normal_variation"
    UNKNOWN = "unknown"


@dataclass
class IndexChange:
    """Represents change in a single spectral index"""
    name: str
    current_value: float
    previous_value: float
    change_percent: float
    absolute_change: float
    is_significant: bool  # Exceeds threshold


@dataclass
class FusionResult:
    """Result of multi-sensor fusion analysis"""
    composite_risk_score: float  # 0.0 to 1.0
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    category: ChangeCategory
    confidence: float  # 0.0 to 1.0
    primary_indicators: List[str]  # Key indices that triggered detection
    supporting_evidence: List[str]  # Additional confirming indices
    seasonal_likelihood: float  # 0.0 to 1.0 (higher = more likely seasonal)
    recommendation: str
    details: Dict


class MultiSensorFusion:
    """
    Fusion engine that combines multiple spectral indices into intelligent risk scores
    """
    
    def __init__(self, config: Optional[FusionConfig] = None):
        """
        Initialize fusion engine with optional regional configuration
        
        Args:
            config: Regional fusion configuration for threshold tuning
        """
        self.config = config or FusionConfig(Region.DEFAULT)
        
        # Define index weights for different change types
        self.weights = {
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
        
        # Get thresholds from config (automatically adjusted for region)
        # Convert from percentage to decimal
        self.thresholds = {
            index: self.config.get_threshold(index) / 100.0
            for index in ['ndvi', 'evi', 'ndwi', 'mndwi', 'ndbi', 'bsi', 
                         'nbri', 'turbidity_index', 'algae_index', 
                         'thermal_proxy', 'savi', 'bai']
        }
    
    def analyze(
        self,
        current_indices: Dict[str, float],
        previous_indices: Dict[str, float],
        historical_indices: Optional[List[Dict[str, float]]] = None,
        aoi_metadata: Optional[Dict] = None
    ) -> FusionResult:
        """
        Main fusion analysis method
        
        Args:
            current_indices: Current spectral index values
            previous_indices: Previous period spectral index values
            historical_indices: Optional list of historical values (for seasonal detection)
            aoi_metadata: Optional AOI metadata (location, size, known land use)
        
        Returns:
            FusionResult with composite risk score and classification
        """
        
        # Step 1: Calculate changes for all indices
        index_changes = self._calculate_index_changes(current_indices, previous_indices)
        
        # Step 2: Detect seasonal patterns
        seasonal_likelihood = 0.0
        if historical_indices:
            seasonal_likelihood = self._detect_seasonal_pattern(
                index_changes, historical_indices
            )
        
        # Step 3: Apply context-aware rules
        category, confidence, primary_indicators = self._apply_context_rules(
            index_changes, seasonal_likelihood, aoi_metadata
        )
        
        # Step 4: Calculate composite risk score
        risk_score = self._calculate_composite_risk(
            index_changes, category, seasonal_likelihood
        )
        
        # Step 5: Determine risk level
        risk_level = self._determine_risk_level(risk_score, confidence)
        
        # Step 6: Get supporting evidence
        supporting_evidence = self._get_supporting_evidence(index_changes, category)
        
        # Step 7: Generate recommendation
        recommendation = self._generate_recommendation(
            category, risk_level, confidence, seasonal_likelihood
        )
        
        return FusionResult(
            composite_risk_score=risk_score,
            risk_level=risk_level,
            category=category,
            confidence=confidence,
            primary_indicators=primary_indicators,
            supporting_evidence=supporting_evidence,
            seasonal_likelihood=seasonal_likelihood,
            recommendation=recommendation,
            details={
                'index_changes': {ic.name: ic.change_percent for ic in index_changes},
                'significant_changes': [ic.name for ic in index_changes if ic.is_significant],
                'total_indicators': len(index_changes)
            }
        )
    
    def _calculate_index_changes(
        self,
        current: Dict[str, float],
        previous: Dict[str, float]
    ) -> List[IndexChange]:
        """Calculate changes for all spectral indices"""
        changes = []
        
        for index_name in current.keys():
            if index_name not in previous:
                continue
            
            curr_val = current[index_name]
            prev_val = previous[index_name]
            
            # Calculate absolute and percentage change
            abs_change = curr_val - prev_val
            
            # Avoid division by zero
            if abs(prev_val) < 0.001:
                pct_change = 0.0 if abs(abs_change) < 0.001 else 100.0
            else:
                pct_change = (abs_change / abs(prev_val)) * 100.0
            
            # Check if change is significant
            threshold = self.thresholds.get(index_name, 0.20)
            is_significant = abs(pct_change) > (threshold * 100)
            
            changes.append(IndexChange(
                name=index_name,
                current_value=curr_val,
                previous_value=prev_val,
                change_percent=pct_change,
                absolute_change=abs_change,
                is_significant=is_significant
            ))
        
        return changes
    
    def _apply_context_rules(
        self,
        changes: List[IndexChange],
        seasonal_likelihood: float,
        metadata: Optional[Dict]
    ) -> Tuple[ChangeCategory, float, List[str]]:
        """
        Apply intelligent context rules to classify the change
        
        Returns: (category, confidence, primary_indicators)
        """
        
        # Extract changes as dictionary for easier access
        change_dict = {c.name: c for c in changes}
        
        # Initialize scores for each category
        category_scores = {cat: 0.0 for cat in ChangeCategory}
        
        # RULE 1: Illegal Construction Detection
        # Conditions: NDVI decrease + NDBI increase + Thermal increase
        if ('ndvi' in change_dict and change_dict['ndvi'].change_percent < -15 and
            'ndbi' in change_dict and change_dict['ndbi'].change_percent > 15):
            
            score = 0.6  # Base score
            score += 0.2 if 'thermal_proxy' in change_dict and change_dict['thermal_proxy'].change_percent > 10 else 0
            score += 0.2 if 'bsi' in change_dict and change_dict['bsi'].change_percent > 10 else 0
            
            category_scores[ChangeCategory.ILLEGAL_CONSTRUCTION] = score
        
        # RULE 2: Illegal Mining/Quarrying Detection
        # Conditions: NDVI decrease + NDWI increase + BSI increase
        if ('ndvi' in change_dict and change_dict['ndvi'].change_percent < -30 and
            'ndwi' in change_dict and change_dict['ndwi'].change_percent > 20):
            
            score = 0.7  # Base score
            score += 0.2 if 'bsi' in change_dict and change_dict['bsi'].change_percent > 15 else 0
            score += 0.1 if 'nbri' in change_dict and change_dict['nbri'].change_percent < -20 else 0
            
            category_scores[ChangeCategory.ILLEGAL_MINING] = score
        
        # RULE 3: Deforestation Detection
        # Conditions: Severe NDVI decrease + EVI decrease + NBRI decrease
        if ('ndvi' in change_dict and change_dict['ndvi'].change_percent < -40):
            score = 0.5
            score += 0.3 if 'evi' in change_dict and change_dict['evi'].change_percent < -30 else 0
            score += 0.2 if 'nbri' in change_dict and change_dict['nbri'].change_percent < -30 else 0
            
            category_scores[ChangeCategory.DEFORESTATION] = score
        
        # RULE 4: Seasonal Agriculture (LOW PRIORITY)
        # Conditions: Cyclical NDVI change + High seasonal likelihood
        if ('ndvi' in change_dict and 
            abs(change_dict['ndvi'].change_percent) > 20 and
            seasonal_likelihood > 0.6):
            
            category_scores[ChangeCategory.SEASONAL_AGRICULTURE] = seasonal_likelihood
        
        # RULE 5: Water Pollution Detection
        # Conditions: Turbidity increase + Algae increase + NDWI change
        if ('turbidity_index' in change_dict and change_dict['turbidity_index'].change_percent > 30):
            score = 0.6
            score += 0.2 if 'algae_index' in change_dict and change_dict['algae_index'].change_percent > 25 else 0
            score += 0.2 if 'mndwi' in change_dict and abs(change_dict['mndwi'].change_percent) > 20 else 0
            
            category_scores[ChangeCategory.WATER_POLLUTION] = score
        
        # RULE 6: Algal Bloom Detection
        # Conditions: High algae index + NDWI presence + Turbidity
        if ('algae_index' in change_dict and change_dict['algae_index'].change_percent > 40):
            score = 0.7
            score += 0.2 if 'ndwi' in change_dict and change_dict['ndwi'].current_value > 0.3 else 0
            score += 0.1 if 'turbidity_index' in change_dict and change_dict['turbidity_index'].change_percent > 20 else 0
            
            category_scores[ChangeCategory.ALGAL_BLOOM] = score
        
        # RULE 7: Wildfire Damage Detection
        # Conditions: Severe NBRI decrease + NDVI decrease + Thermal increase
        if ('nbri' in change_dict and change_dict['nbri'].change_percent < -50):
            score = 0.7
            score += 0.2 if 'ndvi' in change_dict and change_dict['ndvi'].change_percent < -40 else 0
            score += 0.1 if 'thermal_proxy' in change_dict and change_dict['thermal_proxy'].change_percent > 20 else 0
            
            category_scores[ChangeCategory.WILDFIRE_DAMAGE] = score
        
        # Find the category with highest score
        max_category = max(category_scores.items(), key=lambda x: x[1])
        
        if max_category[1] < 0.3:
            # No strong category match
            if any(c.is_significant for c in changes):
                return ChangeCategory.UNKNOWN, 0.4, [c.name for c in changes if c.is_significant][:3]
            else:
                return ChangeCategory.NORMAL_VARIATION, 0.8, []
        
        # Get primary indicators for the selected category
        primary_indicators = [c.name for c in changes if c.is_significant][:5]
        
        return max_category[0], max_category[1], primary_indicators
    
    def _calculate_composite_risk(
        self,
        changes: List[IndexChange],
        category: ChangeCategory,
        seasonal_likelihood: float
    ) -> float:
        """
        Calculate composite risk score (0.0 to 1.0)
        """
        
        # Get weights for the detected category
        if category == ChangeCategory.ILLEGAL_CONSTRUCTION:
            weights = self.weights['construction']
        elif category in [ChangeCategory.ILLEGAL_MINING, ChangeCategory.DEFORESTATION]:
            weights = self.weights['vegetation_loss']
        elif category in [ChangeCategory.WATER_POLLUTION, ChangeCategory.ALGAL_BLOOM]:
            weights = self.weights['water_change']
        else:
            # Default equal weights
            weights = {c.name: 1.0 / len(changes) for c in changes}
        
        # Calculate weighted score
        risk_score = 0.0
        total_weight = 0.0
        
        for change in changes:
            if change.name in weights:
                # Normalize change to 0-1 range
                normalized_change = min(abs(change.change_percent) / 100.0, 1.0)
                risk_score += normalized_change * weights[change.name]
                total_weight += weights[change.name]
        
        if total_weight > 0:
            risk_score /= total_weight
        
        # Apply seasonal adjustment (reduce risk if likely seasonal)
        if category == ChangeCategory.SEASONAL_AGRICULTURE:
            risk_score *= (1.0 - seasonal_likelihood * 0.7)
        else:
            risk_score *= (1.0 - seasonal_likelihood * 0.3)
        
        return min(risk_score, 1.0)
    
    def _detect_seasonal_pattern(
        self,
        changes: List[IndexChange],
        historical: List[Dict[str, float]]
    ) -> float:
        """
        Detect if changes match seasonal patterns
        Returns: likelihood (0.0 to 1.0)
        """
        
        if not historical or len(historical) < 4:
            return 0.0
        
        # Check NDVI pattern (most indicative of seasonality)
        ndvi_changes = [c for c in changes if c.name == 'ndvi']
        if not ndvi_changes:
            return 0.0
        
        current_ndvi_change = ndvi_changes[0].change_percent
        
        # Extract historical NDVI values
        hist_ndvi = [h.get('ndvi', 0) for h in historical if 'ndvi' in h]
        
        if len(hist_ndvi) < 4:
            return 0.0
        
        # Calculate coefficient of variation (higher = more cyclical)
        mean_ndvi = np.mean(hist_ndvi)
        std_ndvi = np.std(hist_ndvi)
        
        if mean_ndvi == 0:
            return 0.0
        
        cv = std_ndvi / abs(mean_ndvi)
        
        # High CV suggests cyclical pattern
        seasonal_likelihood = min(cv / 0.5, 1.0)  # Normalize to 0-1
        
        return seasonal_likelihood
    
    def _determine_risk_level(self, score: float, confidence: float) -> str:
        """Determine risk level based on score and confidence"""
        
        # Adjust score by confidence
        adjusted_score = score * confidence
        
        if adjusted_score >= 0.75:
            return 'critical'
        elif adjusted_score >= 0.50:
            return 'high'
        elif adjusted_score >= 0.25:
            return 'medium'
        else:
            return 'low'
    
    def _get_supporting_evidence(
        self,
        changes: List[IndexChange],
        category: ChangeCategory
    ) -> List[str]:
        """Get supporting evidence indices"""
        
        # Return all significant changes that weren't primary indicators
        evidence = []
        for change in changes:
            if change.is_significant:
                evidence.append(
                    f"{change.name}: {change.change_percent:+.1f}% change "
                    f"({change.previous_value:.3f} → {change.current_value:.3f})"
                )
        
        return evidence[:5]  # Limit to top 5
    
    def _generate_recommendation(
        self,
        category: ChangeCategory,
        risk_level: str,
        confidence: float,
        seasonal_likelihood: float
    ) -> str:
        """Generate actionable recommendation"""
        
        recommendations = {
            ChangeCategory.ILLEGAL_CONSTRUCTION: (
                "High confidence unauthorized construction detected. "
                "Recommend immediate site inspection and enforcement action."
            ),
            ChangeCategory.ILLEGAL_MINING: (
                "Possible illegal mining or quarrying activity detected. "
                "Recommend aerial survey and ground verification."
            ),
            ChangeCategory.DEFORESTATION: (
                "Significant vegetation loss detected. "
                "Recommend assessment for illegal logging or land clearing."
            ),
            ChangeCategory.WATER_POLLUTION: (
                "Water quality degradation detected. "
                "Recommend water sampling and pollutant source investigation."
            ),
            ChangeCategory.ALGAL_BLOOM: (
                "Algal bloom detected. "
                "Recommend water quality monitoring and public health advisory."
            ),
            ChangeCategory.SEASONAL_AGRICULTURE: (
                "Changes consistent with normal agricultural cycles. "
                "Low priority - continue routine monitoring."
            ),
            ChangeCategory.WILDFIRE_DAMAGE: (
                "Wildfire or burn damage detected. "
                "Recommend damage assessment and restoration planning."
            ),
            ChangeCategory.NORMAL_VARIATION: (
                "Changes within normal variation range. "
                "No immediate action required - continue monitoring."
            ),
            ChangeCategory.UNKNOWN: (
                "Significant change detected but classification uncertain. "
                "Recommend expert review and additional data collection."
            )
        }
        
        base_rec = recommendations.get(category, "Further investigation recommended.")
        
        # Add confidence qualifier
        if confidence < 0.5:
            base_rec = f"LOW CONFIDENCE: {base_rec} Collect additional data for verification."
        
        # Add seasonal qualifier
        if seasonal_likelihood > 0.6 and category != ChangeCategory.SEASONAL_AGRICULTURE:
            base_rec += " Note: Some changes may be seasonal - compare with historical patterns."
        
        return base_rec

