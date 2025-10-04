"""
Historical Spectral Data Manager
Handles storage and retrieval of historical spectral indices for seasonal detection
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import numpy as np

from .database import get_supabase

logger = logging.getLogger(__name__)


class HistoricalDataManager:
    """
    Manages historical spectral index data for AOIs
    """
    
    def __init__(self):
        """Initialize the historical data manager"""
        self.supabase = get_supabase()
    
    def store_spectral_indices(
        self,
        aoi_id: str,
        indices: Dict[str, np.ndarray],
        capture_date: datetime,
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Store spectral indices for an AOI
        
        Args:
            aoi_id: AOI identifier
            indices: Dictionary of spectral indices (name -> 2D array)
            capture_date: Date when image was captured
            metadata: Optional metadata (cloud coverage, quality score, etc.)
            
        Returns:
            Success status
        """
        
        try:
            # Calculate statistics for each index
            index_stats = {}
            for index_name, index_data in indices.items():
                if isinstance(index_data, np.ndarray):
                    # Calculate mean, std, min, max
                    valid_data = index_data[~np.isnan(index_data)]
                    if len(valid_data) > 0:
                        index_stats[f"{index_name}_mean"] = float(np.mean(valid_data))
                        index_stats[f"{index_name}_std"] = float(np.std(valid_data))
                        index_stats[f"{index_name}_min"] = float(np.min(valid_data))
                        index_stats[f"{index_name}_max"] = float(np.max(valid_data))
            
            # Prepare data for insertion
            record = {
                'aoi_id': aoi_id,
                'capture_date': capture_date.isoformat(),
                **index_stats,
                'cloud_coverage': metadata.get('cloud_coverage', 0.0) if metadata else 0.0,
                'data_quality_score': metadata.get('quality_score', 0.8) if metadata else 0.8,
                'satellite_source': metadata.get('satellite', 'Sentinel-2') if metadata else 'Sentinel-2',
                'processing_metadata': metadata.get('processing', {}) if metadata else {}
            }
            
            # Insert or update (upsert based on unique constraint)
            response = self.supabase.table('spectral_history').upsert(
                record,
                on_conflict='aoi_id,capture_date'
            ).execute()
            
            if response.data:
                logger.info(f"Stored spectral history for AOI {aoi_id} on {capture_date.date()}")
                return True
            else:
                logger.warning(f"Failed to store spectral history for AOI {aoi_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing spectral indices: {e}")
            return False
    
    def get_historical_indices(
        self,
        aoi_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        min_quality: float = 0.6
    ) -> List[Dict]:
        """
        Retrieve historical spectral indices for an AOI
        
        Args:
            aoi_id: AOI identifier
            start_date: Optional start date filter
            end_date: Optional end date filter
            min_quality: Minimum data quality score (0-1)
            
        Returns:
            List of historical records
        """
        
        try:
            query = self.supabase.table('spectral_history').select('*').eq('aoi_id', aoi_id)
            
            # Apply filters
            if start_date:
                query = query.gte('capture_date', start_date.isoformat())
            if end_date:
                query = query.lte('capture_date', end_date.isoformat())
            
            query = query.gte('data_quality_score', min_quality)
            query = query.order('capture_date', desc=True)
            
            response = query.execute()
            
            if response.data:
                logger.info(f"Retrieved {len(response.data)} historical records for AOI {aoi_id}")
                return response.data
            else:
                logger.info(f"No historical data found for AOI {aoi_id}")
                return []
                
        except Exception as e:
            logger.error(f"Error retrieving historical indices: {e}")
            return []
    
    def get_seasonal_baseline(
        self,
        aoi_id: str,
        target_month: int,
        years_back: int = 3
    ) -> Dict[str, Dict]:
        """
        Get seasonal baseline for a specific month
        
        Args:
            aoi_id: AOI identifier
            target_month: Target month (1-12)
            years_back: Number of years to look back
            
        Returns:
            Dictionary of baseline statistics per index
        """
        
        try:
            # Use the SQL function we created
            response = self.supabase.rpc(
                'get_seasonal_baseline',
                {
                    'p_aoi_id': aoi_id,
                    'p_target_month': target_month,
                    'p_years_back': years_back
                }
            ).execute()
            
            if response.data:
                # Convert to dictionary format
                baseline = {}
                for record in response.data:
                    baseline[record['index_name']] = {
                        'mean': record['baseline_mean'],
                        'std': record['baseline_std'],
                        'sample_count': record['sample_count']
                    }
                
                logger.info(f"Retrieved seasonal baseline for AOI {aoi_id}, month {target_month}")
                return baseline
            else:
                logger.info(f"No seasonal baseline data for AOI {aoi_id}, month {target_month}")
                return {}
                
        except Exception as e:
            logger.error(f"Error retrieving seasonal baseline: {e}")
            return {}
    
    def get_historical_for_fusion(
        self,
        aoi_id: str,
        years_back: int = 2
    ) -> List[Dict[str, float]]:
        """
        Get historical data formatted for fusion engine
        
        Args:
            aoi_id: AOI identifier
            years_back: Number of years of history to retrieve
            
        Returns:
            List of dictionaries with mean values for each index
        """
        
        try:
            start_date = datetime.now() - timedelta(days=365 * years_back)
            historical_records = self.get_historical_indices(
                aoi_id,
                start_date=start_date,
                min_quality=0.6
            )
            
            # Convert to fusion format (list of index dictionaries)
            fusion_data = []
            for record in historical_records:
                indices = {}
                for key, value in record.items():
                    if key.endswith('_mean') and value is not None:
                        index_name = key.replace('_mean', '')
                        indices[index_name] = value
                
                if indices:
                    fusion_data.append(indices)
            
            logger.info(f"Retrieved {len(fusion_data)} historical samples for fusion analysis")
            return fusion_data
            
        except Exception as e:
            logger.error(f"Error retrieving historical data for fusion: {e}")
            return []
    
    def get_data_availability(self, aoi_id: str) -> Dict:
        """
        Get data availability statistics for an AOI
        
        Args:
            aoi_id: AOI identifier
            
        Returns:
            Dictionary with availability statistics
        """
        
        try:
            response = self.supabase.table('spectral_history_summary').select('*').eq('aoi_id', aoi_id).execute()
            
            if response.data and len(response.data) > 0:
                summary = response.data[0]
                return {
                    'total_samples': summary.get('total_samples', 0),
                    'earliest_sample': summary.get('earliest_sample'),
                    'latest_sample': summary.get('latest_sample'),
                    'avg_ndvi': summary.get('avg_ndvi'),
                    'stddev_ndvi': summary.get('stddev_ndvi'),
                    'avg_quality_score': summary.get('avg_quality_score'),
                    'has_sufficient_data': summary.get('total_samples', 0) >= 4
                }
            else:
                return {
                    'total_samples': 0,
                    'has_sufficient_data': False
                }
                
        except Exception as e:
            logger.error(f"Error getting data availability: {e}")
            return {'total_samples': 0, 'has_sufficient_data': False}
    
    def cleanup_old_data(self) -> int:
        """
        Clean up old low-quality historical data
        
        Returns:
            Number of records deleted
        """
        
        try:
            response = self.supabase.rpc('cleanup_old_spectral_history').execute()
            
            if response.data is not None:
                deleted_count = response.data
                logger.info(f"Cleaned up {deleted_count} old spectral history records")
                return deleted_count
            else:
                return 0
                
        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            return 0


# Singleton instance
_historical_manager = None

def get_historical_manager() -> HistoricalDataManager:
    """Get singleton historical data manager instance"""
    global _historical_manager
    if _historical_manager is None:
        _historical_manager = HistoricalDataManager()
    return _historical_manager
