"""
Multi-Temporal Analysis Module
Analyzes spectral index changes over multiple time periods for trend detection,
velocity calculation, and early warning predictions
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
from scipy import stats
from scipy.signal import find_peaks

logger = logging.getLogger(__name__)


@dataclass
class TimeSeriesPoint:
    """Single point in time series"""
    date: datetime
    value: float
    quality_score: float = 1.0


@dataclass
class TrendAnalysis:
    """Result of trend analysis"""
    direction: str  # 'increasing', 'decreasing', 'stable'
    slope: float
    r_squared: float
    p_value: float
    confidence: float


@dataclass
class VelocityAnalysis:
    """Result of velocity and acceleration analysis"""
    average_velocity: float
    current_velocity: float
    acceleration: float
    is_accelerating: bool
    days_to_critical: Optional[float]
    severity: str


@dataclass
class TemporalResult:
    """Complete temporal analysis result"""
    index_name: str
    periods_analyzed: int
    trend: TrendAnalysis
    velocity: VelocityAnalysis
    anomalies: List[Dict]
    seasonal_pattern: Dict
    next_period_forecast: float
    time_series: List[Dict]
    interpretation: str


class TemporalIndexAnalyzer:
    """Analyze spectral index changes over multiple time periods"""
    
    def __init__(self):
        self.epsilon = 1e-8
    
    async def analyze_temporal_trends(
        self,
        time_series_data: List[Dict],
        index_name: str,
        critical_threshold: Optional[float] = None
    ) -> TemporalResult:
        """
        Analyze trends in a specific index over time
        
        Args:
            time_series_data: List of {date, indices, quality_score} dictionaries
            index_name: Name of the spectral index to analyze (e.g., 'ndvi')
            critical_threshold: Optional critical threshold for prediction
            
        Returns:
            TemporalResult with comprehensive temporal analysis
        """
        
        if len(time_series_data) < 3:
            raise ValueError("Need at least 3 data points for temporal analysis")
        
        # Extract time series for the specific index
        time_series = self._extract_time_series(time_series_data, index_name)
        
        if len(time_series) < 3:
            raise ValueError(f"Insufficient data for index '{index_name}'")
        
        # Sort by date
        time_series.sort(key=lambda x: x.date)
        
        # Perform analyses
        trend = self._calculate_trend(time_series)
        velocity = self._calculate_velocity_acceleration(time_series, critical_threshold)
        anomalies = self._detect_anomalies(time_series, trend)
        seasonal_pattern = self._detect_seasonality(time_series)
        forecast = self._simple_forecast(time_series, trend)
        interpretation = self._generate_interpretation(trend, velocity, seasonal_pattern)
        
        # Convert to dictionary format for response
        time_series_dict = [
            {
                'date': ts.date.isoformat(),
                'value': float(ts.value),
                'quality_score': float(ts.quality_score)
            }
            for ts in time_series
        ]
        
        return TemporalResult(
            index_name=index_name,
            periods_analyzed=len(time_series),
            trend=trend,
            velocity=velocity,
            anomalies=anomalies,
            seasonal_pattern=seasonal_pattern,
            next_period_forecast=forecast,
            time_series=time_series_dict,
            interpretation=interpretation
        )
    
    def _extract_time_series(
        self,
        data: List[Dict],
        index_name: str
    ) -> List[TimeSeriesPoint]:
        """Extract time series for specific index"""
        
        time_series = []
        
        for record in data:
            # Handle different data formats
            if 'capture_date' in record:
                date = datetime.fromisoformat(record['capture_date'].replace('Z', '+00:00'))
            elif 'date' in record:
                date = record['date'] if isinstance(record['date'], datetime) else datetime.fromisoformat(record['date'])
            else:
                continue
            
            # Extract index value (handle different naming conventions)
            value = None
            quality_score = record.get('data_quality_score', 1.0)
            
            # Try different keys
            if f'{index_name}_mean' in record:
                value = record[f'{index_name}_mean']
            elif index_name in record:
                value = record[index_name]
            elif 'indices' in record and index_name in record['indices']:
                value = record['indices'][index_name]
            
            if value is not None and not np.isnan(value):
                time_series.append(TimeSeriesPoint(
                    date=date,
                    value=float(value),
                    quality_score=float(quality_score)
                ))
        
        return time_series
    
    def _calculate_trend(self, time_series: List[TimeSeriesPoint]) -> TrendAnalysis:
        """Calculate trend using linear regression"""
        
        # Convert dates to numeric values (days since first observation)
        first_date = time_series[0].date
        x = np.array([(ts.date - first_date).days for ts in time_series])
        y = np.array([ts.value for ts in time_series])
        
        # Weight by quality score
        weights = np.array([ts.quality_score for ts in time_series])
        
        # Perform weighted linear regression
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        
        r_squared = r_value ** 2
        
        # Determine direction
        if abs(slope) < 0.0001:
            direction = 'stable'
            confidence = 0.9 if p_value < 0.05 else 0.5
        elif slope > 0:
            direction = 'increasing'
            confidence = min(r_squared * (1 - p_value), 1.0)
        else:
            direction = 'decreasing'
            confidence = min(r_squared * (1 - p_value), 1.0)
        
        return TrendAnalysis(
            direction=direction,
            slope=float(slope),
            r_squared=float(r_squared),
            p_value=float(p_value),
            confidence=float(confidence)
        )
    
    def _calculate_velocity_acceleration(
        self,
        time_series: List[TimeSeriesPoint],
        critical_threshold: Optional[float] = None
    ) -> VelocityAnalysis:
        """
        Calculate velocity (rate of change) and acceleration
        """
        
        # Calculate velocities (change per day)
        velocities = []
        for i in range(1, len(time_series)):
            dt = (time_series[i].date - time_series[i-1].date).days
            if dt > 0:
                dv = time_series[i].value - time_series[i-1].value
                velocity = dv / dt
                velocities.append(velocity)
        
        if not velocities:
            return VelocityAnalysis(
                average_velocity=0.0,
                current_velocity=0.0,
                acceleration=0.0,
                is_accelerating=False,
                days_to_critical=None,
                severity='stable'
            )
        
        # Calculate accelerations (change in velocity)
        accelerations = []
        for i in range(1, len(velocities)):
            acceleration = velocities[i] - velocities[i-1]
            accelerations.append(acceleration)
        
        avg_velocity = float(np.mean(velocities))
        current_velocity = float(velocities[-1])
        avg_acceleration = float(np.mean(accelerations)) if accelerations else 0.0
        
        # Predict time to critical threshold
        days_to_critical = None
        if critical_threshold is not None and current_velocity != 0:
            current_value = time_series[-1].value
            remaining = critical_threshold - current_value
            days_to_critical = remaining / current_velocity
            
            # Only consider if it's approaching the threshold
            if days_to_critical < 0:
                days_to_critical = None
            else:
                days_to_critical = float(days_to_critical)
        
        # Classify severity
        severity = self._classify_severity(current_velocity, avg_acceleration)
        
        return VelocityAnalysis(
            average_velocity=avg_velocity,
            current_velocity=current_velocity,
            acceleration=avg_acceleration,
            is_accelerating=bool(avg_acceleration > 0.0001),
            days_to_critical=days_to_critical,
            severity=severity
        )
    
    def _classify_severity(self, velocity: float, acceleration: float) -> str:
        """Classify change severity based on velocity and acceleration"""
        
        abs_vel = abs(velocity)
        
        if abs_vel < 0.001 and abs(acceleration) < 0.0001:
            return 'stable'
        elif abs_vel < 0.002 and acceleration <= 0:
            return 'slow_improvement'
        elif abs_vel < 0.002 and acceleration > 0:
            return 'slow_degradation'
        elif abs_vel >= 0.002 and abs_vel < 0.005 and acceleration <= 0:
            return 'moderate_improvement'
        elif abs_vel >= 0.002 and abs_vel < 0.005 and acceleration > 0:
            return 'moderate_degradation'
        elif abs_vel >= 0.005 and velocity < 0:
            return 'rapid_degradation'
        elif abs_vel >= 0.005 and velocity > 0:
            return 'rapid_improvement'
        else:
            return 'moderate_change'
    
    def _detect_anomalies(
        self,
        time_series: List[TimeSeriesPoint],
        trend: TrendAnalysis
    ) -> List[Dict]:
        """Detect anomalies using statistical methods"""
        
        values = np.array([ts.value for ts in time_series])
        
        # Calculate z-scores
        mean = np.mean(values)
        std = np.std(values)
        
        if std < self.epsilon:
            return []  # No variation, no anomalies
        
        z_scores = np.abs((values - mean) / std)
        
        # Identify anomalies (z-score > 2.5)
        anomalies = []
        for i, (ts, z) in enumerate(zip(time_series, z_scores)):
            if z > 2.5:
                # Determine if spike or drop
                anomaly_type = 'spike' if ts.value > mean else 'drop'
                
                anomalies.append({
                    'index': i,
                    'date': ts.date.isoformat(),
                    'value': float(ts.value),
                    'z_score': float(z),
                    'type': anomaly_type,
                    'severity': 'high' if z > 3.5 else 'moderate'
                })
        
        return anomalies
    
    def _detect_seasonality(self, time_series: List[TimeSeriesPoint]) -> Dict:
        """Detect seasonal patterns in the time series"""
        
        if len(time_series) < 12:
            return {
                'seasonal': False,
                'confidence': 0.0,
                'period_days': None,
                'amplitude': 0.0
            }
        
        values = np.array([ts.value for ts in time_series])
        
        # Calculate coefficient of variation
        mean_val = np.mean(values)
        std_val = np.std(values)
        
        if abs(mean_val) < self.epsilon:
            cv = 0.0
        else:
            cv = std_val / abs(mean_val)
        
        # Detect peaks and valleys
        peaks, _ = find_peaks(values, distance=5)
        valleys, _ = find_peaks(-values, distance=5)
        
        # Estimate period if enough peaks/valleys
        seasonal = False
        period_days = None
        confidence = 0.0
        
        if len(peaks) >= 2:
            # Calculate average distance between peaks
            peak_dates = [time_series[i].date for i in peaks]
            peak_intervals = [(peak_dates[i+1] - peak_dates[i]).days 
                            for i in range(len(peak_dates)-1)]
            
            if peak_intervals:
                avg_interval = np.mean(peak_intervals)
                interval_std = np.std(peak_intervals)
                
                # Seasonal if intervals are consistent (low std dev)
                if interval_std < avg_interval * 0.3:  # Within 30% variation
                    seasonal = True
                    period_days = int(avg_interval)
                    confidence = min(cv / 0.5, 1.0)  # Higher CV = more seasonal
        
        # Calculate amplitude
        amplitude = float(np.ptp(values))  # Peak-to-peak
        
        return {
            'seasonal': seasonal,
            'confidence': float(confidence),
            'period_days': period_days,
            'amplitude': amplitude,
            'coefficient_of_variation': float(cv)
        }
    
    def _simple_forecast(
        self,
        time_series: List[TimeSeriesPoint],
        trend: TrendAnalysis
    ) -> float:
        """Simple linear forecast for next period"""
        
        if len(time_series) < 2:
            return time_series[-1].value
        
        # Use trend slope to predict next value
        last_point = time_series[-1]
        second_last_point = time_series[-2]
        
        days_between = (last_point.date - second_last_point.date).days
        
        if days_between == 0:
            days_between = 30  # Assume monthly
        
        # Forecast using trend slope
        forecast = last_point.value + (trend.slope * days_between)
        
        return float(forecast)
    
    def _generate_interpretation(
        self,
        trend: TrendAnalysis,
        velocity: VelocityAnalysis,
        seasonal: Dict
    ) -> str:
        """Generate human-readable interpretation"""
        
        interpretations = []
        
        # Trend interpretation
        if trend.direction == 'stable':
            interpretations.append("The index shows stable values with no significant trend.")
        elif trend.direction == 'increasing':
            strength = 'strong' if trend.confidence > 0.7 else 'moderate' if trend.confidence > 0.5 else 'weak'
            interpretations.append(f"A {strength} increasing trend is detected (R²={trend.r_squared:.3f}).")
        else:
            strength = 'strong' if trend.confidence > 0.7 else 'moderate' if trend.confidence > 0.5 else 'weak'
            interpretations.append(f"A {strength} decreasing trend is detected (R²={trend.r_squared:.3f}).")
        
        # Velocity interpretation
        if velocity.severity in ['rapid_degradation', 'rapid_improvement']:
            interpretations.append(f"Change is happening rapidly ({velocity.severity.replace('_', ' ')}).")
            
            if velocity.is_accelerating:
                interpretations.append("The rate of change is accelerating, requiring immediate attention.")
            
            if velocity.days_to_critical is not None and velocity.days_to_critical < 180:
                interpretations.append(
                    f"Critical threshold may be reached in approximately {int(velocity.days_to_critical)} days."
                )
        
        # Seasonal interpretation
        if seasonal['seasonal'] and seasonal['confidence'] > 0.6:
            interpretations.append(
                f"Seasonal pattern detected with ~{seasonal['period_days']} day cycle. "
                "Some changes may be natural seasonal variation."
            )
        
        return " ".join(interpretations)


class ChangeHotspotDetector:
    """Detect spatial hotspots of change within an AOI"""
    
    def detect_change_hotspots(
        self,
        before_image: np.ndarray,
        after_image: np.ndarray,
        grid_size: int = 10,
        threshold_percentile: float = 75
    ) -> Dict:
        """
        Divide AOI into grid and identify hotspots
        
        Args:
            before_image: Image from earlier date
            after_image: Image from later date
            grid_size: Number of grid cells (grid_size x grid_size)
            threshold_percentile: Percentile for hotspot threshold
            
        Returns:
            Dictionary with hotspot information
        """
        
        # Calculate change map
        change_map = self._calculate_change_map(before_image, after_image)
        
        # Divide into grid
        hotspots = self._grid_analysis(change_map, grid_size, threshold_percentile)
        
        # Classify distribution
        distribution = self._classify_distribution(hotspots)
        
        # Find largest hotspot
        largest_hotspot = max(hotspots, key=lambda x: x['intensity']) if hotspots else None
        
        return {
            'total_hotspots': len(hotspots),
            'hotspots': hotspots,
            'distribution': distribution,
            'largest_hotspot': largest_hotspot,
            'coverage_percent': self._calculate_coverage(hotspots, grid_size)
        }
    
    def _calculate_change_map(
        self,
        before: np.ndarray,
        after: np.ndarray
    ) -> np.ndarray:
        """Calculate per-pixel change magnitude"""
        
        # Handle multi-band images
        if before.ndim == 3:
            # Calculate change magnitude across all bands
            change = np.sqrt(np.sum((after - before) ** 2, axis=2))
        else:
            change = np.abs(after - before)
        
        return change
    
    def _grid_analysis(
        self,
        change_map: np.ndarray,
        grid_size: int,
        threshold_percentile: float
    ) -> List[Dict]:
        """Analyze change in grid cells"""
        
        height, width = change_map.shape[:2]
        cell_height = height // grid_size
        cell_width = width // grid_size
        
        # Calculate global threshold
        threshold = np.percentile(change_map, threshold_percentile)
        
        hotspots = []
        
        for i in range(grid_size):
            for j in range(grid_size):
                # Extract cell
                y_start = i * cell_height
                y_end = min((i + 1) * cell_height, height)
                x_start = j * cell_width
                x_end = min((j + 1) * cell_width, width)
                
                cell = change_map[y_start:y_end, x_start:x_end]
                
                # Calculate cell statistics
                mean_intensity = np.mean(cell)
                max_intensity = np.max(cell)
                
                if mean_intensity > threshold:
                    hotspots.append({
                        'grid_position': {'row': i, 'col': j},
                        'intensity': float(mean_intensity),
                        'max_intensity': float(max_intensity),
                        'pixels_affected': int(np.sum(cell > threshold)),
                        'severity': self._classify_hotspot_severity(mean_intensity, threshold)
                    })
        
        return hotspots
    
    def _classify_hotspot_severity(self, intensity: float, threshold: float) -> str:
        """Classify hotspot severity"""
        
        ratio = intensity / threshold if threshold > 0 else 1.0
        
        if ratio > 2.0:
            return 'critical'
        elif ratio > 1.5:
            return 'high'
        elif ratio > 1.2:
            return 'moderate'
        else:
            return 'low'
    
    def _classify_distribution(self, hotspots: List[Dict]) -> str:
        """Classify spatial distribution of hotspots"""
        
        if not hotspots:
            return 'none'
        
        if len(hotspots) == 1:
            return 'isolated'
        
        # Calculate spatial spread
        positions = np.array([[h['grid_position']['row'], h['grid_position']['col']] 
                             for h in hotspots])
        
        std_dev = np.std(positions, axis=0)
        avg_std = np.mean(std_dev)
        
        if avg_std < 2:
            return 'clustered'
        elif avg_std < 4:
            return 'scattered'
        else:
            return 'dispersed'
    
    def _calculate_coverage(self, hotspots: List[Dict], grid_size: int) -> float:
        """Calculate percentage of area affected"""
        
        if not hotspots:
            return 0.0
        
        total_cells = grid_size * grid_size
        affected_cells = len(hotspots)
        
        return float(affected_cells / total_cells * 100)
