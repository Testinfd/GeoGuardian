"""
Enhanced Alerts API v2 - Advanced Alert Management
Provides enhanced alert operations with real-time capabilities
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from ...models.models import User
from ...core.auth import get_current_user_optional
from ...core.database import get_supabase

router = APIRouter()
logger = logging.getLogger(__name__)

class EnhancedAlert(BaseModel):
    """Enhanced alert model matching actual database schema"""
    id: str
    aoi_id: str
    aoi_name: Optional[str] = None
    type: str  # alert_type enum
    confidence: Optional[float] = None
    confirmed: Optional[bool] = False
    processing: Optional[bool] = True
    created_at: datetime
    overall_confidence: Optional[float] = 0.0
    priority_level: Optional[str] = "info"
    analysis_type: Optional[str] = "basic"
    algorithms_used: Optional[List[str]] = []
    detections: Optional[List[Dict[str, Any]]] = []
    spectral_indices: Optional[Dict[str, Any]] = {}
    satellite_metadata: Optional[Dict[str, Any]] = {}
    processing_metadata: Optional[Dict[str, Any]] = {}
    processing_time_seconds: Optional[float] = 0.0
    data_quality_score: Optional[float] = 0.0
    gif_url: Optional[str] = None

@router.get("", response_model=List[EnhancedAlert])
async def get_all_alerts(
    current_user: User = Depends(get_current_user_optional),
    limit: int = 50,
    offset: int = 0,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    aoi_id: Optional[str] = None,
    days_back: int = 30
):
    """
    Get all alerts with enhanced filtering and pagination
    
    This endpoint provides comprehensive alert listing with support for:
    - Severity-based filtering
    - Status-based filtering  
    - AOI-specific filtering
    - Time range filtering
    - Pagination support
    """
    
    try:
        supabase = get_supabase()
        
        # Build query based on authentication and filters
        query = supabase.table("alerts").select("""
            *,
            aois(name, user_id)
        """)
        
        # Apply access control - show alerts for user's AOIs or public AOIs
        if current_user:
            # Show alerts for user's AOIs or public AOIs (null user_id)
            query = query.or_(f"aois.user_id.eq.{current_user.id},aois.user_id.is.null")
        else:
            # Show only alerts for public AOIs for unauthenticated users
            query = query.is_("aois.user_id", "null")
        
        # Apply filters
        if status == "confirmed":
            query = query.eq("confirmed", True)
        elif status == "processing":
            query = query.eq("processing", True)
        elif status == "completed":
            query = query.eq("processing", False)
        
        if aoi_id:
            query = query.eq("aoi_id", aoi_id)
        
        # Apply time range filter
        cutoff_date = datetime.now() - timedelta(days=days_back)
        query = query.gte("created_at", cutoff_date.isoformat())
        
        # Apply pagination and ordering
        query = query.range(offset, offset + limit - 1)
        query = query.order("created_at", desc=True)
        
        response = query.execute()
        
        if response.data is None:
            logger.warning("No alert data returned from Supabase")
            return []
        
        # Process alerts into enhanced format
        enhanced_alerts = []
        for alert_data in response.data:
            enhanced_alert = EnhancedAlert(
                id=alert_data['id'],
                aoi_id=alert_data['aoi_id'],
                aoi_name=alert_data.get('aois', {}).get('name') if alert_data.get('aois') else None,
                type=alert_data['type'],
                confidence=alert_data.get('confidence'),
                confirmed=alert_data.get('confirmed', False),
                processing=alert_data.get('processing', True),
                created_at=datetime.fromisoformat(alert_data['created_at'].replace('Z', '+00:00')),
                overall_confidence=alert_data.get('overall_confidence', 0.0),
                priority_level=alert_data.get('priority_level', 'info'),
                analysis_type=alert_data.get('analysis_type', 'basic'),
                algorithms_used=alert_data.get('algorithms_used', []),
                detections=alert_data.get('detections', []),
                spectral_indices=alert_data.get('spectral_indices', {}),
                satellite_metadata=alert_data.get('satellite_metadata', {}),
                processing_metadata=alert_data.get('processing_metadata', {}),
                processing_time_seconds=alert_data.get('processing_time_seconds', 0.0),
                data_quality_score=alert_data.get('data_quality_score', 0.0),
                gif_url=alert_data.get('gif_url')
            )
            enhanced_alerts.append(enhanced_alert)
        
        logger.info(f"Retrieved {len(enhanced_alerts)} alerts for user: {current_user.id if current_user else 'anonymous'}")
        return enhanced_alerts
        
    except Exception as e:
        logger.error(f"Failed to retrieve alerts: {str(e)}")
        # Return empty list instead of raising exception for better UX
        return []

@router.get("/{alert_id}", response_model=EnhancedAlert)
async def get_alert_by_id(
    alert_id: str,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Get a specific alert by ID with enhanced metadata
    """
    
    try:
        supabase = get_supabase()
        
        # Get alert with access control
        query = supabase.table("alerts").select("""
            *,
            aois(name, is_public, user_id)
        """).eq("id", alert_id)
        
        response = query.execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alert_data = response.data[0]
        aoi_data = alert_data.get('aois', {})
        
        # Check access permissions
        if current_user:
            # User can see their own alerts or public AOI alerts
            has_access = (
                alert_data.get('user_id') == current_user.id or
                aoi_data.get('is_public', False)
            )
        else:
            # Anonymous users can only see public AOI alerts
            has_access = aoi_data.get('is_public', False)
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        enhanced_alert = EnhancedAlert(
            id=alert_data['id'],
            aoi_id=alert_data['aoi_id'],
            aoi_name=aoi_data.get('name'),
            type=alert_data['type'],
            confidence=alert_data.get('confidence'),
            confirmed=alert_data.get('confirmed', False),
            processing=alert_data.get('processing', True),
            created_at=datetime.fromisoformat(alert_data['created_at'].replace('Z', '+00:00')),
            overall_confidence=alert_data.get('overall_confidence', 0.0),
            priority_level=alert_data.get('priority_level', 'info'),
            analysis_type=alert_data.get('analysis_type', 'basic'),
            algorithms_used=alert_data.get('algorithms_used', []),
            detections=alert_data.get('detections', []),
            spectral_indices=alert_data.get('spectral_indices', {}),
            satellite_metadata=alert_data.get('satellite_metadata', {}),
            processing_metadata=alert_data.get('processing_metadata', {}),
            processing_time_seconds=alert_data.get('processing_time_seconds', 0.0),
            data_quality_score=alert_data.get('data_quality_score', 0.0),
            gif_url=alert_data.get('gif_url')
        )
        
        logger.info(f"Retrieved alert {alert_id} for user: {current_user.id if current_user else 'anonymous'}")
        return enhanced_alert
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve alert {alert_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve alert: {str(e)}"
        )

@router.put("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Acknowledge an alert (mark as seen/reviewed)
    """
    
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to acknowledge alerts"
        )
    
    try:
        supabase = get_supabase()
        
        # Check if alert exists and user has access
        existing_query = supabase.table("alerts").select("""
            *,
            aois(is_public, user_id)
        """).eq("id", alert_id)
        
        existing_response = existing_query.execute()
        
        if not existing_response.data:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alert_data = existing_response.data[0]
        aoi_data = alert_data.get('aois', {})
        
        # Check access permissions
        has_access = (
            alert_data.get('user_id') == current_user.id or
            aoi_data.get('user_id') == current_user.id or
            aoi_data.get('is_public', False)
        )
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update alert status
        update_data = {
            "status": "acknowledged",
            "acknowledged_at": datetime.now().isoformat(),
            "acknowledged_by": current_user.id,
            "updated_at": datetime.now().isoformat()
        }
        
        response = supabase.table("alerts").update(update_data).eq("id", alert_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to acknowledge alert"
            )
        
        logger.info(f"Alert {alert_id} acknowledged by user {current_user.id}")
        
        return {
            "success": True,
            "message": "Alert acknowledged successfully",
            "acknowledged_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to acknowledge alert {alert_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to acknowledge alert: {str(e)}"
        )

@router.put("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Resolve an alert (mark as handled/fixed)
    """
    
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to resolve alerts"
        )
    
    try:
        supabase = get_supabase()
        
        # Check if alert exists and user has access
        existing_query = supabase.table("alerts").select("""
            *,
            aois(is_public, user_id)
        """).eq("id", alert_id)
        
        existing_response = existing_query.execute()
        
        if not existing_response.data:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alert_data = existing_response.data[0]
        aoi_data = alert_data.get('aois', {})
        
        # Check access permissions (only owner or AOI owner can resolve)
        has_access = (
            alert_data.get('user_id') == current_user.id or
            aoi_data.get('user_id') == current_user.id
        )
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update alert status
        update_data = {
            "status": "resolved",
            "updated_at": datetime.now().isoformat()
        }
        
        # If not already acknowledged, mark as acknowledged too
        if alert_data.get('status') != 'acknowledged':
            update_data.update({
                "acknowledged_at": datetime.now().isoformat(),
                "acknowledged_by": current_user.id
            })
        
        response = supabase.table("alerts").update(update_data).eq("id", alert_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to resolve alert"
            )
        
        logger.info(f"Alert {alert_id} resolved by user {current_user.id}")
        
        return {
            "success": True,
            "message": "Alert resolved successfully",
            "resolved_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to resolve alert {alert_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to resolve alert: {str(e)}"
        )

@router.get("/aoi/{aoi_id}", response_model=List[EnhancedAlert])
async def get_alerts_by_aoi(
    aoi_id: str,
    current_user: User = Depends(get_current_user_optional),
    limit: int = 50,
    offset: int = 0,
    days_back: int = 30
):
    """
    Get alerts for a specific Area of Interest (AOI)

    This endpoint provides alerts filtered by AOI with support for:
    - Pagination
    - Time range filtering
    - Access control based on AOI ownership
    """

    try:
        supabase = get_supabase()

        # Build query with AOI filtering
        query = supabase.table("alerts").select("""
            *,
            aois(name, user_id, is_public)
        """).eq("aoi_id", aoi_id)

        # Apply access control
        if current_user:
            # Show alerts for user's AOIs or public AOIs
            query = query.or_(f"aois.user_id.eq.{current_user.id},aois.is_public.eq.true")
        else:
            # Show only alerts for public AOIs for unauthenticated users
            query = query.eq("aois.is_public", True)

        # Apply time range filter
        cutoff_date = datetime.now() - timedelta(days=days_back)
        query = query.gte("created_at", cutoff_date.isoformat())

        # Apply pagination and ordering
        query = query.range(offset, offset + limit - 1)
        query = query.order("created_at", desc=True)

        response = query.execute()

        if response.data is None:
            logger.warning(f"No alert data returned for AOI {aoi_id}")
            return []

        # Process alerts into enhanced format
        enhanced_alerts = []
        for alert_data in response.data:
            enhanced_alert = EnhancedAlert(
                id=alert_data['id'],
                aoi_id=alert_data['aoi_id'],
                aoi_name=alert_data.get('aois', {}).get('name') if alert_data.get('aois') else None,
                type=alert_data['type'],
                confidence=alert_data.get('confidence'),
                confirmed=alert_data.get('confirmed', False),
                processing=alert_data.get('processing', True),
                created_at=datetime.fromisoformat(alert_data['created_at'].replace('Z', '+00:00')),
                overall_confidence=alert_data.get('overall_confidence', 0.0),
                priority_level=alert_data.get('priority_level', 'info'),
                analysis_type=alert_data.get('analysis_type', 'basic'),
                algorithms_used=alert_data.get('algorithms_used', []),
                detections=alert_data.get('detections', []),
                spectral_indices=alert_data.get('spectral_indices', {}),
                satellite_metadata=alert_data.get('satellite_metadata', {}),
                processing_metadata=alert_data.get('processing_metadata', {}),
                processing_time_seconds=alert_data.get('processing_time_seconds', 0.0),
                data_quality_score=alert_data.get('data_quality_score', 0.0),
                gif_url=alert_data.get('gif_url')
            )
            enhanced_alerts.append(enhanced_alert)

        logger.info(f"Retrieved {len(enhanced_alerts)} alerts for AOI {aoi_id}, user: {current_user.id if current_user else 'anonymous'}")
        return enhanced_alerts

    except Exception as e:
        logger.error(f"Failed to retrieve alerts for AOI {aoi_id}: {str(e)}")
        # Return empty list instead of raising exception for better UX
        return []

@router.get("/stats/summary")
async def get_alert_statistics(
    current_user: User = Depends(get_current_user_optional),
    days_back: int = 30
):
    """
    Get alert statistics and summary data
    
    Provides overview statistics for dashboards and monitoring
    """
    
    try:
        supabase = get_supabase()
        
        # Time range filter
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        # Build base query with access control
        base_query = supabase.table("alerts").select("*")
        
        if current_user:
            base_query = base_query.or_(f"user_id.eq.{current_user.id},aois.is_public.eq.true")
        else:
            base_query = base_query.eq("aois.is_public", True)
        
        base_query = base_query.gte("created_at", cutoff_date.isoformat())
        
        # Get all alerts for analysis
        response = base_query.execute()
        alerts = response.data or []
        
        # Calculate statistics
        total_alerts = len(alerts)
        active_alerts = len([a for a in alerts if a.get('status') == 'active'])
        acknowledged_alerts = len([a for a in alerts if a.get('status') == 'acknowledged'])
        resolved_alerts = len([a for a in alerts if a.get('status') == 'resolved'])
        
        # Severity breakdown
        severity_counts = {
            'low': len([a for a in alerts if a.get('severity') == 'low']),
            'medium': len([a for a in alerts if a.get('severity') == 'medium']),
            'high': len([a for a in alerts if a.get('severity') == 'high']),
            'critical': len([a for a in alerts if a.get('severity') == 'critical'])
        }
        
        # Type breakdown
        type_counts = {}
        for alert in alerts:
            alert_type = alert.get('type', 'unknown')
            type_counts[alert_type] = type_counts.get(alert_type, 0) + 1
        
        # Recent trend (last 7 days vs previous 7 days)
        recent_cutoff = datetime.now() - timedelta(days=7)
        previous_cutoff = datetime.now() - timedelta(days=14)
        
        recent_alerts = len([a for a in alerts if datetime.fromisoformat(a['created_at'].replace('Z', '+00:00')) >= recent_cutoff])
        previous_alerts = len([a for a in alerts if previous_cutoff <= datetime.fromisoformat(a['created_at'].replace('Z', '+00:00')) < recent_cutoff])
        
        trend_percentage = 0
        if previous_alerts > 0:
            trend_percentage = ((recent_alerts - previous_alerts) / previous_alerts) * 100
        
        statistics = {
            "summary": {
                "total_alerts": total_alerts,
                "active_alerts": active_alerts,
                "acknowledged_alerts": acknowledged_alerts,
                "resolved_alerts": resolved_alerts,
                "response_rate": (acknowledged_alerts + resolved_alerts) / total_alerts * 100 if total_alerts > 0 else 0
            },
            "severity_breakdown": severity_counts,
            "type_breakdown": type_counts,
            "trend": {
                "recent_7_days": recent_alerts,
                "previous_7_days": previous_alerts,
                "percentage_change": round(trend_percentage, 1)
            },
            "time_range": {
                "days_back": days_back,
                "from_date": cutoff_date.isoformat(),
                "to_date": datetime.now().isoformat()
            },
            "generated_at": datetime.now().isoformat()
        }
        
        logger.info(f"Generated alert statistics for user: {current_user.id if current_user else 'anonymous'}")
        return statistics
        
    except Exception as e:
        logger.error(f"Failed to generate alert statistics: {str(e)}")
        # Return basic stats on error
        return {
            "summary": {
                "total_alerts": 0,
                "active_alerts": 0,
                "acknowledged_alerts": 0,
                "resolved_alerts": 0,
                "response_rate": 0
            },
            "severity_breakdown": {"low": 0, "medium": 0, "high": 0, "critical": 0},
            "type_breakdown": {},
            "trend": {"recent_7_days": 0, "previous_7_days": 0, "percentage_change": 0},
            "error": str(e),
            "generated_at": datetime.now().isoformat()
        }
