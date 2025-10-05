"""
Enhanced AOI API v2 - Advanced Area of Interest Management
Provides enhanced AOI operations with better validation and integration
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import logging

from ...models.models import AOI, AOICreate, AOIResponse, User
from ...core.auth import get_current_user_optional
from ...core.database import get_supabase
from ...workers.tasks import schedule_aoi_analysis

router = APIRouter()
logger = logging.getLogger(__name__)

class EnhancedAOIResponse(BaseModel):
    """Enhanced AOI response with actual database schema"""
    id: str
    name: str
    description: Optional[str] = None
    geojson: Dict[str, Any]
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_public: bool = False
    tags: Optional[List[str]] = []
    analysis_count: Optional[int] = 0
    last_analysis: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    status: str = "active"
    area_km2: Optional[float] = None  # Calculated field
    bounds: Optional[Dict[str, Any]] = None  # Calculated field

@router.get("", response_model=List[EnhancedAOIResponse])
async def get_all_aois(
    current_user: User = Depends(get_current_user_optional),
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None
):
    """
    Get all AOIs with enhanced filtering and pagination
    
    This endpoint provides comprehensive AOI listing with support for:
    - User-specific filtering
    - Status-based filtering
    - Pagination support
    - Enhanced metadata
    """
    
    try:
        supabase = get_supabase()
        
        # Build query based on authentication and filters
        query = supabase.table("aois").select("*")
        
        # Apply user filtering - show user's AOIs or all if no auth
        if current_user:
            # Show user's AOIs
            query = query.eq("user_id", current_user.id)
        # For unauthenticated users, show AOIs with null user_id (public)
        else:
            query = query.is_("user_id", "null")
        
        # Apply status filtering
        if status:
            query = query.eq("status", status)
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        query = query.order("created_at", desc=True)
        
        response = query.execute()
        
        if response.data is None:
            logger.warning("No AOI data returned from Supabase")
            return []
        
        # Enhanced AOI data processing
        enhanced_aois = []
        for aoi_data in response.data:
            # Calculate area if geojson is available
            area_km2 = None
            bounds = None
            
            if aoi_data.get('geojson'):
                try:
                    from shapely.geometry import shape
                    from shapely.ops import transform
                    import pyproj
                    
                    # Create shape from geojson
                    geom = shape(aoi_data['geojson'])
                    
                    # Calculate bounds
                    minx, miny, maxx, maxy = geom.bounds
                    bounds = {
                        "minLng": minx,
                        "minLat": miny, 
                        "maxLng": maxx,
                        "maxLat": maxy
                    }
                    
                    # Calculate area in km2 (approximate)
                    # Project to equal area projection for area calculation
                    wgs84 = pyproj.CRS('EPSG:4326')
                    utm = pyproj.CRS('EPSG:3857')  # Web Mercator for approximation
                    project = pyproj.Transformer.from_crs(wgs84, utm, always_xy=True).transform
                    utm_geom = transform(project, geom)
                    area_km2 = utm_geom.area / 1000000  # Convert m2 to km2
                    
                except Exception as e:
                    logger.warning(f"Failed to calculate area for AOI {aoi_data.get('id')}: {str(e)}")
            
            enhanced_aoi = EnhancedAOIResponse(
                id=aoi_data['id'],
                name=aoi_data['name'],
                description=aoi_data.get('description'),
                geojson=aoi_data['geojson'],
                user_id=aoi_data.get('user_id'),
                created_at=datetime.fromisoformat(aoi_data['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(aoi_data['updated_at'].replace('Z', '+00:00')) if aoi_data.get('updated_at') else None,
                is_public=aoi_data.get('is_public', False),
                tags=aoi_data.get('tags', []),
                analysis_count=aoi_data.get('analysis_count', 0),
                last_analysis=datetime.fromisoformat(aoi_data['last_analysis'].replace('Z', '+00:00')) if aoi_data.get('last_analysis') else None,
                metadata=aoi_data.get('metadata', {}),
                status=aoi_data.get('status', 'active'),
                area_km2=area_km2,
                bounds=bounds
            )
            enhanced_aois.append(enhanced_aoi)
        
        logger.info(f"Retrieved {len(enhanced_aois)} AOIs for user: {current_user.id if current_user else 'anonymous'}")
        return enhanced_aois
        
    except Exception as e:
        logger.error(f"Failed to retrieve AOIs: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve AOIs: {str(e)}"
        )

@router.get("/{aoi_id}", response_model=EnhancedAOIResponse)
async def get_aoi_by_id(
    aoi_id: str,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Get a specific AOI by ID with enhanced metadata
    """
    
    try:
        supabase = get_supabase()
        
        # Get AOI with access control
        query = supabase.table("aois").select("*").eq("id", aoi_id)
        
        # Apply access control - user's AOIs or public AOIs (user_id is null)
        if current_user:
            query = query.or_(f"user_id.eq.{current_user.id},user_id.is.null")
        else:
            query = query.is_("user_id", "null")
        
        response = query.execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="AOI not found or access denied")
        
        aoi_data = response.data[0]
        
        # Enhanced processing (same as in get_all_aois)
        area_km2 = None
        bounds = None
        
        if aoi_data.get('geojson'):
            try:
                from shapely.geometry import shape
                from shapely.ops import transform
                import pyproj
                
                geom = shape(aoi_data['geojson'])
                minx, miny, maxx, maxy = geom.bounds
                bounds = {
                    "minLng": minx,
                    "minLat": miny, 
                    "maxLng": maxx,
                    "maxLat": maxy
                }
                
                wgs84 = pyproj.CRS('EPSG:4326')
                utm = pyproj.CRS('EPSG:3857')
                project = pyproj.Transformer.from_crs(wgs84, utm, always_xy=True).transform
                utm_geom = transform(project, geom)
                area_km2 = utm_geom.area / 1000000
                
            except Exception as e:
                logger.warning(f"Failed to calculate area for AOI {aoi_id}: {str(e)}")
        
        enhanced_aoi = EnhancedAOIResponse(
            id=aoi_data['id'],
            name=aoi_data['name'],
            description=aoi_data.get('description'),
            geojson=aoi_data['geojson'],
            user_id=aoi_data.get('user_id'),
            created_at=datetime.fromisoformat(aoi_data['created_at'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(aoi_data['updated_at'].replace('Z', '+00:00')) if aoi_data.get('updated_at') else None,
            is_public=aoi_data.get('is_public', False),
            tags=aoi_data.get('tags', []),
            analysis_count=aoi_data.get('analysis_count', 0),
            last_analysis=datetime.fromisoformat(aoi_data['last_analysis'].replace('Z', '+00:00')) if aoi_data.get('last_analysis') else None,
            metadata=aoi_data.get('metadata', {}),
            status=aoi_data.get('status', 'active'),
            area_km2=area_km2,
            bounds=bounds
        )
        
        logger.info(f"Retrieved AOI {aoi_id} for user: {current_user.id if current_user else 'anonymous'}")
        return enhanced_aoi
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve AOI {aoi_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve AOI: {str(e)}"
        )

@router.post("", response_model=EnhancedAOIResponse)
async def create_aoi_v2(
    aoi_data: AOICreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Create a new AOI with enhanced validation and processing
    
    This v2 endpoint provides:
    - Enhanced GeoJSON validation
    - Automatic area calculation
    - Background analysis scheduling
    - Improved error handling
    - Returns full AOI object
    """
    
    try:
        # Enhanced GeoJSON validation
        if aoi_data.geojson.get("type") != "Polygon":
            raise HTTPException(
                status_code=400,
                detail="GeoJSON must be a Polygon type"
            )
        
        # Validate polygon coordinates
        coordinates = aoi_data.geojson.get("coordinates", [])
        if not coordinates or len(coordinates) == 0:
            raise HTTPException(
                status_code=400,
                detail="Polygon coordinates are required"
            )
        
        # Create AOI ID
        aoi_id = str(uuid.uuid4())
        
        # Calculate enhanced metadata
        area_km2 = None
        bounds = None
        
        try:
            from shapely.geometry import shape
            from shapely.ops import transform
            import pyproj
            
            geom = shape(aoi_data.geojson)
            
            # Validate geometry
            if not geom.is_valid:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid polygon geometry"
                )
            
            # Calculate bounds
            minx, miny, maxx, maxy = geom.bounds
            bounds = {
                "minLng": minx,
                "minLat": miny, 
                "maxLng": maxx,
                "maxLat": maxy
            }
            
            # Calculate area
            wgs84 = pyproj.CRS('EPSG:4326')
            utm = pyproj.CRS('EPSG:3857')
            project = pyproj.Transformer.from_crs(wgs84, utm, always_xy=True).transform
            utm_geom = transform(project, geom)
            area_km2 = utm_geom.area / 1000000
            
        except Exception as e:
            logger.warning(f"Failed to calculate area for new AOI: {str(e)}")
        
        # Current timestamp
        now = datetime.now()
        
        # Prepare AOI data for database (matching actual schema)
        aoi_db_data = {
            "id": aoi_id,
            "name": aoi_data.name,
            "description": aoi_data.description,
            "geojson": aoi_data.geojson,
            "user_id": current_user.id if current_user else None,
            "is_public": aoi_data.is_public,
            "tags": aoi_data.tags or [],
            "status": "active",
            "area_km2": area_km2,
            "analysis_count": 0,
            "metadata": {
                "bounds": bounds,
                "created_by_api": "v2"
            }
        }
        
        # Save to database if user is authenticated
        saved_successfully = False
        if current_user:
            try:
                supabase = get_supabase()
                response = supabase.table("aois").insert(aoi_db_data).execute()
                
                if not response.data:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to save AOI to database"
                    )
                
                saved_successfully = True
                logger.info(f"Created AOI {aoi_id} for user {current_user.id}")
                
            except Exception as e:
                logger.error(f"Database error creating AOI: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save AOI to database: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=401,
                detail="Authentication required to create AOI"
            )
        
        # Schedule background analysis
        if aoi_data.auto_analyze:
            background_tasks.add_task(
                schedule_aoi_analysis,
                background_tasks,
                aoi_id,
                aoi_data.geojson
            )
        
        # Return full AOI object
        return EnhancedAOIResponse(
            id=aoi_id,
            name=aoi_data.name,
            description=aoi_data.description,
            geojson=aoi_data.geojson,
            user_id=current_user.id if current_user else None,
            created_at=now,
            updated_at=now,
            is_public=aoi_data.is_public or False,
            tags=aoi_data.tags or [],
            analysis_count=0,
            last_analysis=None,
            metadata={
                "bounds": bounds,
                "created_by_api": "v2",
                "analysis_scheduled": aoi_data.auto_analyze
            },
            status="active",
            area_km2=area_km2,
            bounds=bounds
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create AOI: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create AOI: {str(e)}"
        )

@router.put("/{aoi_id}", response_model=Dict[str, Any])
async def update_aoi_v2(
    aoi_id: str,
    aoi_data: AOICreate,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Update an existing AOI with enhanced validation
    """
    
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to update AOI"
        )
    
    try:
        supabase = get_supabase()
        
        # Check if AOI exists and user has access
        existing_query = supabase.table("aois").select("*").eq("id", aoi_id).eq("user_id", current_user.id)
        existing_response = existing_query.execute()
        
        if not existing_response.data:
            raise HTTPException(
                status_code=404,
                detail="AOI not found or access denied"
            )
        
        # Enhanced validation (same as create)
        if aoi_data.geojson.get("type") != "Polygon":
            raise HTTPException(
                status_code=400,
                detail="GeoJSON must be a Polygon type"
            )
        
        # Calculate metadata
        area_km2 = None
        bounds = None
        
        try:
            from shapely.geometry import shape
            from shapely.ops import transform
            import pyproj
            
            geom = shape(aoi_data.geojson)
            
            if not geom.is_valid:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid polygon geometry"
                )
            
            minx, miny, maxx, maxy = geom.bounds
            bounds = {
                "minLng": minx,
                "minLat": miny, 
                "maxLng": maxx,
                "maxLat": maxy
            }
            
            wgs84 = pyproj.CRS('EPSG:4326')
            utm = pyproj.CRS('EPSG:3857')
            project = pyproj.Transformer.from_crs(wgs84, utm, always_xy=True).transform
            utm_geom = transform(project, geom)
            area_km2 = utm_geom.area / 1000000
            
        except Exception as e:
            logger.warning(f"Failed to calculate area for updated AOI: {str(e)}")
        
        # Update data
        update_data = {
            "name": aoi_data.name,
            "description": aoi_data.description,
            "geojson": aoi_data.geojson,
            "is_public": aoi_data.is_public,
            "tags": aoi_data.tags or [],
            "updated_at": datetime.now().isoformat(),
            "area_km2": area_km2
        }
        
        response = supabase.table("aois").update(update_data).eq("id", aoi_id).eq("user_id", current_user.id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to update AOI"
            )
        
        logger.info(f"Updated AOI {aoi_id} for user {current_user.id}")
        
        return {
            "success": True,
            "aoi_id": aoi_id,
            "message": "AOI updated successfully",
            "metadata": {
                "area_km2": area_km2,
                "bounds": bounds
            },
            "updated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update AOI {aoi_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update AOI: {str(e)}"
        )

@router.delete("/{aoi_id}")
async def delete_aoi_v2(
    aoi_id: str,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Delete an AOI with enhanced access control
    Requires authentication
    """
    
    if not current_user:
        logger.warning(f"Unauthenticated attempt to delete AOI {aoi_id}")
        raise HTTPException(
            status_code=401,
            detail="Authentication required to delete AOI"
        )
    
    try:
        supabase = get_supabase()
        
        # Check if AOI exists and user has access
        existing_query = supabase.table("aois").select("*").eq("id", aoi_id).eq("user_id", current_user.id)
        existing_response = existing_query.execute()
        
        if not existing_response.data:
            raise HTTPException(
                status_code=404,
                detail="AOI not found or access denied"
            )
        
        # Delete AOI
        response = supabase.table("aois").delete().eq("id", aoi_id).eq("user_id", current_user.id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete AOI"
            )
        
        logger.info(f"Deleted AOI {aoi_id} for user {current_user.id}")
        
        return {
            "success": True,
            "message": "AOI deleted successfully",
            "deleted_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete AOI {aoi_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete AOI: {str(e)}"
        )
