from fastapi import BackgroundTasks
from ..core.database import get_supabase
from ..models.models import AlertType, EnhancedAlert, AlgorithmResult, SpectralIndices
from ..core.config import settings
from ..core.analysis_engine import AdvancedAnalysisEngine, AnalysisConfig
from ..core.satellite_data import SentinelDataFetcher, FetchConfig
from ..core.asset_manager import AssetManager
from datetime import datetime, timedelta
import asyncio
import logging
import numpy as np
from typing import Dict, List, Optional, Tuple
import uuid
import json


async def process_aoi_analysis(aoi_id: str, temp_geojson: dict = None):
    """Background task to process AOI analysis"""
    supabase = get_supabase()
    
    try:
        # Get AOI from database or use temporary data
        if temp_geojson:
            # Anonymous user - use temporary data
            aoi = {
                "id": aoi_id,
                "geojson": temp_geojson,
                "name": "Anonymous AOI",
                "users": None
            }
            print(f"Processing anonymous AOI {aoi_id}")
        else:
            # Registered user - get from database
            aoi_response = supabase.table("aois").select("*, users(email, name)").eq("id", aoi_id).execute()
            
            if not aoi_response.data:
                print(f"AOI {aoi_id} not found")
                return
            
            aoi = aoi_response.data[0]
            print(f"Processing registered AOI {aoi_id}")
        
        # Real satellite analysis with enhanced algorithms
        try:
            print(f"Starting real satellite analysis for AOI {aoi_id}")
            
            # Initialize real analysis components
            analysis_engine = AdvancedAnalysisEngine()
            satellite_fetcher = SentinelDataFetcher()
            asset_manager = AssetManager()
            
            # Get real satellite imagery with enhanced capabilities
            aoi_geometry = aoi.get('geojson', temp_geojson)
            recent_image, older_image = await satellite_fetcher.get_latest_images_for_change_detection(
                aoi_geometry, days_back=30
            )
            
            if recent_image is None or older_image is None:
                print(f"Insufficient satellite data for AOI {aoi_id}")
                # Create info alert about insufficient data
                alert_data = await _create_data_insufficient_alert(aoi_id)
            else:
                print(f"Processing real satellite data for AOI {aoi_id}")
                print(f"Recent image quality: {recent_image.quality_score:.2f}, Cloud coverage: {recent_image.cloud_coverage:.2f}")
                print(f"Baseline image quality: {older_image.quality_score:.2f}, Cloud coverage: {older_image.cloud_coverage:.2f}")
                
                # Run comprehensive environmental analysis with real data
                analysis_results = analysis_engine.analyze_environmental_change(
                    before_image=older_image.data,
                    after_image=recent_image.data,
                    geojson=aoi_geometry,
                    analysis_type='comprehensive'
                )
                
                if analysis_results.get('success'):
                    # Process real analysis results
                    enhanced_alerts = await _process_analysis_results(
                        aoi_id, analysis_results, aoi_geometry, asset_manager, recent_image, older_image
                    )
                    
                    # Create alerts from real detections
                    if enhanced_alerts:
                        for alert_data in enhanced_alerts:
                            await _save_enhanced_alert(supabase, alert_data, temp_geojson)
                    else:
                        # No significant changes detected
                        print(f"No significant environmental changes detected for AOI {aoi_id}")
                else:
                    print(f"Analysis failed for AOI {aoi_id}: {analysis_results.get('error')}")
                    alert_data = await _create_analysis_failed_alert(aoi_id, analysis_results.get('error'))
                    await _save_enhanced_alert(supabase, alert_data, temp_geojson)
            
        except Exception as e:
            print(f"Error in real satellite analysis for AOI {aoi_id}: {e}")
            logging.error(f"Satellite analysis error for AOI {aoi_id}: {str(e)}")
            
            # Create error alert with details
            error_alert = await _create_processing_error_alert(aoi_id, str(e))
            await _save_enhanced_alert(supabase, error_alert, temp_geojson)
            
    except Exception as e:
        print(f"Error processing AOI {aoi_id}: {e}")


def schedule_aoi_analysis(background_tasks: BackgroundTasks, aoi_id: str, temp_geojson: dict = None):
    """Schedule AOI analysis as background task"""
    background_tasks.add_task(process_aoi_analysis, aoi_id, temp_geojson)


async def _process_analysis_results(
    aoi_id: str, 
    analysis_results: Dict, 
    aoi_geometry: Dict,
    asset_manager: AssetManager,
    recent_image,
    older_image
) -> List[Dict]:
    """Process analysis results and create enhanced alert data with real assets"""
    
    enhanced_alerts = []
    detections = analysis_results.get('detections', [])
    
    for detection in detections:
        if detection.get('change_detected', False):
            # Map detection types to alert types
            alert_type = _map_detection_to_alert_type(detection)
            
            # Create algorithm result
            algorithm_result = AlgorithmResult(
                algorithm_name=detection.get('algorithm', 'unknown'),
                change_detected=True,
                confidence=detection.get('confidence', 0.0),
                change_type=detection.get('type', 'unknown'),
                severity=detection.get('severity', 'low'),
                metadata={
                    'spatial_metrics': detection.get('spatial_metrics', {}),
                    'change_percentage': detection.get('change_percentage', 0.0)
                }
            )
            
            # Extract spectral indices if available
            spectral_indices = None
            if 'spectral_indices' in detection:
                indices_data = detection['spectral_indices']
                spectral_indices = SpectralIndices(
                    ndvi=indices_data.get('ndvi'),
                    evi=indices_data.get('evi'),
                    ndwi=indices_data.get('ndwi'),
                    mndwi=indices_data.get('mndwi'),
                    bsi=indices_data.get('bsi'),
                    algae_index=indices_data.get('algae_index'),
                    turbidity_index=indices_data.get('turbidity_index')
                )
            
            # Generate real change detection GIF using AssetManager
            try:
                change_mask = np.array(detection.get('change_mask', [])) if 'change_mask' in detection else \
                             np.array(detection.get('construction_map', [])) if 'construction_map' in detection else \
                             np.array(detection.get('deforestation_map', [])) if 'deforestation_map' in detection else \
                             np.zeros((recent_image.data.shape[0], recent_image.data.shape[1]))
                
                # Prepare detection results for asset generation
                detection_for_asset = {
                    'overall_confidence': analysis_results.get('overall_confidence', detection.get('confidence', 0.0)),
                    'priority_level': analysis_results.get('priority_level', 'medium'),
                    'primary_detection_type': detection.get('type', 'unknown')
                }
                
                # Generate real GIF with satellite imagery
                gif_url = await asset_manager.generate_change_detection_gif(
                    aoi_id=aoi_id,
                    before_image=older_image.data,
                    after_image=recent_image.data,
                    change_mask=change_mask,
                    detection_results=detection_for_asset,
                    metadata={
                        'recent_image_quality': recent_image.quality_score,
                        'baseline_image_quality': older_image.quality_score,
                        'recent_cloud_coverage': recent_image.cloud_coverage,
                        'baseline_cloud_coverage': older_image.cloud_coverage,
                        'time_separation_days': abs((recent_image.timestamp - older_image.timestamp).days)
                    }
                )
                
                print(f"Generated real change detection GIF: {gif_url}")
                
            except Exception as e:
                logging.error(f"Error generating real GIF for {aoi_id}: {str(e)}")
                gif_url = await _generate_fallback_gif_url(aoi_id, detection, "gif_generation_error")
            
            # Create enhanced alert data
            alert_data = {
                "id": str(uuid.uuid4()),
                "aoi_id": aoi_id,
                "type": alert_type.value,
                "overall_confidence": analysis_results.get('overall_confidence', detection.get('confidence', 0.0)),
                "priority_level": analysis_results.get('priority_level', 'medium'),
                "algorithm_results": [algorithm_result.dict()],
                "spectral_indices": spectral_indices.dict() if spectral_indices else None,
                "analysis_type": analysis_results.get('analysis_type', 'comprehensive'),
                "algorithms_used": analysis_results.get('algorithms_used', []),
                "processing_time": analysis_results.get('processing_metadata', {}).get('processing_time'),
                "gif_url": gif_url,
                "processing": False,
                "confirmed": False,
                "created_at": datetime.now().isoformat()
            }
            
            enhanced_alerts.append(alert_data)
    
    return enhanced_alerts


def _map_detection_to_alert_type(detection: Dict) -> AlertType:
    """Map detection type to appropriate alert type"""
    
    detection_type = detection.get('type', '').lower()
    
    # Map detection types to alert types
    type_mapping = {
        'vegetation_loss': AlertType.VEGETATION_LOSS,
        'vegetation_gain': AlertType.VEGETATION_GAIN,
        'vegetation_analysis': AlertType.VEGETATION_LOSS,  # Default to loss if detected
        'deforestation_analysis': AlertType.DEFORESTATION,
        'construction_analysis': AlertType.CONSTRUCTION,
        'coastal_analysis': AlertType.COASTAL_EROSION,
        'water_quality_analysis': AlertType.WATER_QUALITY_CHANGE,
        'algal_bloom': AlertType.ALGAL_BLOOM,
        'potential_algal_bloom': AlertType.ALGAL_BLOOM
    }
    
    # Check for specific interpretations
    interpretation = detection.get('interpretation', '')
    if 'algal_bloom' in interpretation:
        return AlertType.ALGAL_BLOOM
    elif 'erosion' in interpretation:
        return AlertType.COASTAL_EROSION
    elif 'accretion' in interpretation:
        return AlertType.COASTAL_ACCRETION
    
    return type_mapping.get(detection_type, AlertType.OTHER)


async def _generate_fallback_gif_url(
    aoi_id: str, 
    detection: Dict, 
    error_type: str
) -> str:
    """Generate fallback GIF URL for errors"""
    
    try:
        change_type = detection.get('type', 'change')
        confidence = detection.get('confidence', 0.0)
        
        # Use a more descriptive placeholder URL that includes analysis metadata
        placeholder_url = (
            f"https://via.placeholder.com/400x300.gif?"
            f"text=Error+{error_type}&"
            f"type={change_type}&"
            f"conf={confidence:.2f}"
        )
        
        print(f"Generated fallback GIF URL for {error_type}: {placeholder_url}")
        return placeholder_url
        
    except Exception as e:
        logging.error(f"Error generating fallback GIF URL for AOI {aoi_id}: {str(e)}")
        return f"https://via.placeholder.com/400x300.gif?text=Processing+Error"


async def _create_data_insufficient_alert(aoi_id: str) -> Dict:
    """Create alert for insufficient satellite data"""
    
    return {
        "id": str(uuid.uuid4()),
        "aoi_id": aoi_id,
        "type": AlertType.OTHER.value,
        "overall_confidence": 0.0,
        "priority_level": "info",
        "algorithm_results": [],
        "spectral_indices": None,
        "analysis_type": "data_check",
        "algorithms_used": [],
        "processing_time": 0.0,
        "gif_url": "https://via.placeholder.com/400x300.gif?text=Insufficient+Data",
        "processing": False,
        "confirmed": False,
        "created_at": datetime.now().isoformat(),
        "error_message": "Insufficient satellite data available for analysis"
    }


async def _create_analysis_failed_alert(aoi_id: str, error_message: str) -> Dict:
    """Create alert for analysis failure"""
    
    return {
        "id": str(uuid.uuid4()),
        "aoi_id": aoi_id,
        "type": AlertType.OTHER.value,
        "overall_confidence": 0.0,
        "priority_level": "info",
        "algorithm_results": [],
        "spectral_indices": None,
        "analysis_type": "error",
        "algorithms_used": [],
        "processing_time": 0.0,
        "gif_url": "https://via.placeholder.com/400x300.gif?text=Analysis+Failed",
        "processing": False,
        "confirmed": False,
        "created_at": datetime.now().isoformat(),
        "error_message": f"Analysis failed: {error_message}"
    }


async def _create_processing_error_alert(aoi_id: str, error_message: str) -> Dict:
    """Create alert for processing error"""
    
    return {
        "id": str(uuid.uuid4()),
        "aoi_id": aoi_id,
        "type": AlertType.OTHER.value,
        "overall_confidence": 0.0,
        "priority_level": "info",
        "algorithm_results": [],
        "spectral_indices": None,
        "analysis_type": "processing_error",
        "algorithms_used": [],
        "processing_time": 0.0,
        "gif_url": "https://via.placeholder.com/400x300.gif?text=Processing+Error",
        "processing": False,
        "confirmed": False,
        "created_at": datetime.now().isoformat(),
        "error_message": error_message
    }


async def _save_enhanced_alert(
    supabase, 
    alert_data: Dict, 
    temp_geojson: Optional[Dict] = None
) -> bool:
    """Save enhanced alert to database"""
    
    try:
        # Only save to database for registered users
        if not temp_geojson:
            # Convert enhanced alert to basic format for current database schema
            basic_alert_data = {
                "aoi_id": alert_data["aoi_id"],
                "type": alert_data["type"],
                "confidence": alert_data["overall_confidence"],
                "processing": alert_data["processing"],
                "confirmed": alert_data["confirmed"],
                "gif_url": alert_data["gif_url"]
            }
            
            alert_response = supabase.table("alerts").insert(basic_alert_data).execute()
            
            if alert_response.data:
                alert = alert_response.data[0]
                print(f"Created enhanced alert {alert['id']} for AOI {alert_data['aoi_id']}")
                print(f"Alert type: {alert_data['type']}, Confidence: {alert_data['overall_confidence']:.2f}")
                
                # TODO: Send email notification with enhanced details
                # await email_service.send_enhanced_alert_email(...)
                
                return True
            else:
                print(f"Failed to create alert for AOI {alert_data['aoi_id']}")
                return False
        else:
            # For anonymous users, just log the enhanced alert
            print(f"Enhanced alert for anonymous AOI {alert_data['aoi_id']}:")
            print(f"  Type: {alert_data['type']}")
            print(f"  Confidence: {alert_data['overall_confidence']:.2f}")
            print(f"  Priority: {alert_data['priority_level']}")
            print(f"  Algorithms: {', '.join(alert_data['algorithms_used'])}")
            return True
            
    except Exception as e:
        logging.error(f"Error saving enhanced alert: {str(e)}")
        return False
