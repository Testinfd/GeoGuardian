"""
Alert Prioritization System
Intelligently prioritizes alerts based on multiple factors including
change magnitude, confidence, AOI importance, velocity, and historical patterns
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from ..core.database import get_supabase

logger = logging.getLogger(__name__)


@dataclass
class PriorityFactors:
    """Individual factors contributing to priority score"""
    magnitude: float  # 0-30 points
    confidence: float  # 0-25 points
    importance: float  # 0-25 points
    velocity: float  # 0-15 points
    novelty: float  # 0-5 points


@dataclass
class PrioritizedAlert:
    """Alert with calculated priority score"""
    alert_id: str
    aoi_id: str
    priority_score: float  # 0-100
    priority_level: str  # 'critical', 'high', 'medium', 'low'
    factors: PriorityFactors
    recommended_action: str
    urgency_level: str


class AlertPrioritizer:
    """Intelligently prioritize alerts based on multiple factors"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def calculate_priority_score(
        self,
        alert: Dict,
        aoi_metadata: Optional[Dict] = None,
        historical_context: Optional[Dict] = None
    ) -> PrioritizedAlert:
        """
        Calculate priority score (0-100) based on multiple factors
        
        Args:
            alert: Alert data dictionary
            aoi_metadata: Optional AOI metadata for importance calculation
            historical_context: Optional historical alert data
            
        Returns:
            PrioritizedAlert with score and breakdown
        """
        
        score = 0
        factors = PriorityFactors(
            magnitude=0.0,
            confidence=0.0,
            importance=0.0,
            velocity=0.0,
            novelty=0.0
        )
        
        # Factor 1: Change magnitude (0-30 points)
        magnitude = self._extract_magnitude(alert)
        magnitude_score = min(magnitude * 30, 30.0)
        factors.magnitude = magnitude_score
        score += magnitude_score
        
        # Factor 2: Confidence (0-25 points)
        confidence = alert.get('overall_confidence') or alert.get('confidence', 0.5)
        confidence_score = confidence * 25.0
        factors.confidence = confidence_score
        score += confidence_score
        
        # Factor 3: AOI importance (0-25 points)
        aoi_id = alert.get('aoi_id')
        if aoi_id:
            importance = self._get_aoi_importance(aoi_id, aoi_metadata)
            importance_score = importance * 25.0
            factors.importance = importance_score
            score += importance_score
        
        # Factor 4: Change velocity (0-15 points)
        velocity = self._extract_velocity(alert, historical_context)
        velocity_score = min(abs(velocity) * 15, 15.0)
        factors.velocity = velocity_score
        score += velocity_score
        
        # Factor 5: Novelty (0-5 points)
        is_new_pattern = self._detect_novel_pattern(alert, historical_context)
        novelty_score = 5.0 if is_new_pattern else 0.0
        factors.novelty = novelty_score
        score += novelty_score
        
        # Determine priority level
        priority_level = self._determine_priority_level(score, confidence)
        
        # Generate recommended action
        recommended_action = self._generate_recommendation(
            priority_level,
            alert,
            factors
        )
        
        # Determine urgency
        urgency_level = self._determine_urgency(score, velocity, alert)
        
        return PrioritizedAlert(
            alert_id=alert.get('id', 'unknown'),
            aoi_id=aoi_id or 'unknown',
            priority_score=float(score),
            priority_level=priority_level,
            factors=factors,
            recommended_action=recommended_action,
            urgency_level=urgency_level
        )
    
    def prioritize_alerts(
        self,
        alerts: List[Dict],
        limit: Optional[int] = None
    ) -> List[PrioritizedAlert]:
        """
        Prioritize a list of alerts
        
        Args:
            alerts: List of alert dictionaries
            limit: Optional limit on number of results
            
        Returns:
            List of PrioritizedAlert sorted by priority (highest first)
        """
        
        prioritized = []
        
        for alert in alerts:
            try:
                aoi_metadata = self._fetch_aoi_metadata(alert.get('aoi_id'))
                historical_context = self._fetch_historical_context(alert.get('aoi_id'))
                
                priority_result = self.calculate_priority_score(
                    alert,
                    aoi_metadata,
                    historical_context
                )
                
                prioritized.append(priority_result)
                
            except Exception as e:
                logger.error(f"Error prioritizing alert {alert.get('id')}: {e}")
                continue
        
        # Sort by priority score (descending)
        prioritized.sort(key=lambda x: x.priority_score, reverse=True)
        
        if limit:
            prioritized = prioritized[:limit]
        
        return prioritized
    
    def group_related_alerts(
        self,
        alerts: List[Dict],
        distance_threshold_km: float = 2.0,
        time_threshold_days: int = 7
    ) -> List[Dict]:
        """
        Group alerts that are spatially and temporally close
        
        Args:
            alerts: List of alert dictionaries
            distance_threshold_km: Maximum distance for grouping (km)
            time_threshold_days: Maximum time difference for grouping (days)
            
        Returns:
            List of alert groups
        """
        
        import numpy as np
        from scipy.spatial.distance import cdist
        
        if not alerts:
            return []
        
        # Extract locations and dates
        locations = []
        dates = []
        
        for alert in alerts:
            # Try to get location from AOI
            aoi_id = alert.get('aoi_id')
            if aoi_id:
                aoi = self._fetch_aoi_metadata(aoi_id)
                if aoi and 'center' in aoi:
                    locations.append([aoi['center']['lat'], aoi['center']['lng']])
                    dates.append(self._parse_date(alert.get('created_at')))
        
        if not locations:
            return []
        
        locations = np.array(locations)
        
        # Calculate distance matrix (approximation: 1 degree ≈ 111 km)
        distances = cdist(locations, locations, metric='euclidean') * 111
        
        # Find groups
        groups = []
        processed = set()
        
        for i, alert in enumerate(alerts):
            if i in processed or i >= len(locations):
                continue
            
            # Find nearby alerts
            nearby_indices = np.where(distances[i] < distance_threshold_km)[0]
            
            # Filter by time proximity
            group_alerts = []
            for idx in nearby_indices:
                if idx not in processed and idx < len(dates):
                    time_diff = abs((dates[i] - dates[idx]).days) if dates[i] and dates[idx] else 999
                    if time_diff <= time_threshold_days:
                        group_alerts.append(alerts[idx])
                        processed.add(idx)
            
            if len(group_alerts) > 1:
                # Create grouped alert
                groups.append({
                    'group_id': f"group_{len(groups)}",
                    'alert_count': len(group_alerts),
                    'center_location': {
                        'lat': float(np.mean([loc[0] for j, loc in enumerate(locations) if j in nearby_indices])),
                        'lng': float(np.mean([loc[1] for j, loc in enumerate(locations) if j in nearby_indices]))
                    },
                    'severity': self._calculate_group_severity(group_alerts),
                    'alerts': group_alerts,
                    'recommendation': 'Investigate cluster of related changes'
                })
        
        return groups
    
    def _extract_magnitude(self, alert: Dict) -> float:
        """Extract change magnitude from alert"""
        
        # Try different keys
        if 'change_magnitude' in alert:
            return float(alert['change_magnitude'])
        
        # Check algorithm results
        if 'algorithm_results' in alert:
            results = alert['algorithm_results']
            if isinstance(results, list) and results:
                return float(results[0].get('confidence', 0.5))
        
        # Check spectral indices
        if 'spectral_indices' in alert:
            indices = alert['spectral_indices']
            if isinstance(indices, dict):
                # Use NDVI change as proxy
                if 'ndvi' in indices:
                    return abs(float(indices.get('ndvi', 0.0)))
        
        # Default
        return float(alert.get('confidence', 0.5))
    
    def _extract_velocity(
        self,
        alert: Dict,
        historical_context: Optional[Dict]
    ) -> float:
        """Extract or estimate change velocity"""
        
        if 'change_velocity' in alert:
            return float(alert['change_velocity'])
        
        # Estimate from historical context
        if historical_context and 'recent_changes' in historical_context:
            changes = historical_context['recent_changes']
            if len(changes) >= 2:
                # Simple velocity estimate
                return float(sum(changes)) / len(changes)
        
        return 0.0
    
    def _get_aoi_importance(
        self,
        aoi_id: str,
        metadata: Optional[Dict] = None
    ) -> float:
        """
        Calculate AOI importance (0-1)
        
        Factors:
        - Protected areas
        - High-value ecosystems
        - Recent alert frequency
        """
        
        if not metadata:
            metadata = self._fetch_aoi_metadata(aoi_id)
        
        if not metadata:
            return 0.5  # Default importance
        
        importance = 0.5  # Base importance
        
        # Boost for protected areas
        if 'protected_area' in metadata.get('tags', []):
            importance += 0.3
        
        # Boost for high-value ecosystems
        high_value_tags = ['forest', 'wetland', 'coral_reef', 'wildlife_habitat']
        if any(tag in metadata.get('tags', []) for tag in high_value_tags):
            importance += 0.2
        
        # Boost for areas with recent alerts
        recent_alert_count = self._count_recent_alerts(aoi_id, days=30)
        if recent_alert_count > 3:
            importance += 0.1
        
        return min(importance, 1.0)
    
    def _detect_novel_pattern(
        self,
        alert: Dict,
        historical_context: Optional[Dict]
    ) -> bool:
        """Detect if this is a new/unusual pattern"""
        
        if not historical_context:
            return False
        
        # Check if this type of alert is new for this AOI
        alert_type = alert.get('type')
        historical_types = historical_context.get('alert_types', [])
        
        return alert_type not in historical_types
    
    def _determine_priority_level(self, score: float, confidence: float) -> str:
        """Determine priority level from score"""
        
        # Adjust score by confidence
        adjusted_score = score * (0.5 + confidence * 0.5)
        
        if adjusted_score >= 80:
            return 'critical'
        elif adjusted_score >= 60:
            return 'high'
        elif adjusted_score >= 40:
            return 'medium'
        else:
            return 'low'
    
    def _determine_urgency(self, score: float, velocity: float, alert: Dict) -> str:
        """Determine urgency level"""
        
        if score >= 80 and abs(velocity) > 0.01:
            return 'immediate'
        elif score >= 60:
            return 'urgent'
        elif score >= 40:
            return 'moderate'
        else:
            return 'routine'
    
    def _generate_recommendation(
        self,
        priority_level: str,
        alert: Dict,
        factors: PriorityFactors
    ) -> str:
        """Generate actionable recommendation"""
        
        recommendations = {
            'critical': 'IMMEDIATE ACTION REQUIRED: Deploy field team for verification and intervention within 24 hours.',
            'high': 'HIGH PRIORITY: Schedule site inspection within 72 hours and alert relevant authorities.',
            'medium': 'MEDIUM PRIORITY: Add to inspection queue. Review within one week.',
            'low': 'LOW PRIORITY: Continue monitoring. Routine review in next reporting cycle.'
        }
        
        base_rec = recommendations.get(priority_level, 'Review and assess.')
        
        # Add specific guidance based on factors
        if factors.velocity > 10:
            base_rec += ' ACCELERATING CHANGE DETECTED - prioritize above other alerts of same level.'
        
        if factors.novelty > 0:
            base_rec += ' NEW PATTERN - requires expert analysis.'
        
        return base_rec
    
    def _calculate_group_severity(self, alerts: List[Dict]) -> str:
        """Calculate severity for grouped alerts"""
        
        confidences = [alert.get('confidence', 0.5) for alert in alerts]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.5
        
        if avg_confidence > 0.8:
            return 'critical'
        elif avg_confidence > 0.6:
            return 'high'
        elif avg_confidence > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _fetch_aoi_metadata(self, aoi_id: str) -> Optional[Dict]:
        """Fetch AOI metadata from database"""
        
        try:
            response = self.supabase.table('aois').select('*').eq('id', aoi_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
        except Exception as e:
            logger.error(f"Error fetching AOI metadata: {e}")
        
        return None
    
    def _fetch_historical_context(self, aoi_id: str) -> Optional[Dict]:
        """Fetch historical alert context"""
        
        try:
            # Get recent alerts (last 90 days)
            cutoff_date = (datetime.now() - timedelta(days=90)).isoformat()
            
            response = self.supabase.table('alerts')\
                .select('type,confidence,created_at')\
                .eq('aoi_id', aoi_id)\
                .gte('created_at', cutoff_date)\
                .execute()
            
            if response.data:
                # Extract patterns
                alert_types = list(set([a['type'] for a in response.data]))
                recent_changes = [a.get('confidence', 0.5) for a in response.data]
                
                return {
                    'alert_count': len(response.data),
                    'alert_types': alert_types,
                    'recent_changes': recent_changes
                }
        except Exception as e:
            logger.error(f"Error fetching historical context: {e}")
        
        return None
    
    def _count_recent_alerts(self, aoi_id: str, days: int = 30) -> int:
        """Count recent alerts for an AOI"""
        
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            response = self.supabase.table('alerts')\
                .select('id', count='exact')\
                .eq('aoi_id', aoi_id)\
                .gte('created_at', cutoff_date)\
                .execute()
            
            return response.count if response.count else 0
        except Exception as e:
            logger.error(f"Error counting alerts: {e}")
            return 0
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string to datetime"""
        
        if not date_str:
            return None
        
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            return None
