from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from supabase import Client
from typing import List
from ..models.models import AOI, AOICreate, AOIResponse, User
from ..core.auth import get_current_user, get_current_user_optional
from ..core.database import get_supabase
from ..workers.tasks import schedule_aoi_analysis

router = APIRouter(prefix="/aoi", tags=["areas-of-interest"])


@router.post("", response_model=dict)
async def create_aoi(
    aoi_data: AOICreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase)
):
    """Create a new Area of Interest (authentication optional)"""
    
    # If user is authenticated, check AOI limits and save to database
    if current_user:
        # For MVP: Skip AOI limit check due to RLS, just proceed with creation
        # TODO: Implement proper RLS policies or use service role key
        pass
    
    # Validate GeoJSON (basic validation)
    if not aoi_data.geojson.get("type") == "Polygon":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GeoJSON must be a Polygon"
        )
    
    # Create AOI
    import uuid
    aoi_id = str(uuid.uuid4())
    
    # For authenticated users, save to database
    if current_user:
        try:
            # Insert AOI into database respecting RLS policies
            from datetime import datetime
            aoi_data_dict = {
                "id": aoi_id,
                "name": aoi_data.name,
                "geojson": aoi_data.geojson,
                "user_id": current_user.id
                # created_at will be set automatically by Supabase
            }
            
            # Insert using regular client (respecting RLS)
            result = supabase.table("aois").insert(aoi_data_dict).execute()
            
            # Schedule background analysis
            schedule_aoi_analysis(background_tasks, aoi_id, aoi_data.geojson)
            
            return {
                "aoi_id": aoi_id,
                "status": "created",
                "saved": True,
                "message": "AOI created and saved successfully"
            }
            
        except Exception as e:
            print(f"Database error: {e}")
            # Fall back to temporary processing if database fails
            schedule_aoi_analysis(background_tasks, aoi_id, aoi_data.geojson)
            
            return {
                "aoi_id": aoi_id,
                "status": "created",
                "saved": False,
                "message": "AOI created but not saved (database error)"
            }
    else:
        # For anonymous users, save to database with null user_id
        try:
            # Insert AOI into database with null user_id for anonymous users
            aoi_data_dict = {
                "id": aoi_id,
                "name": aoi_data.name,
                "geojson": aoi_data.geojson,
                "user_id": None  # Allow anonymous AOIs
            }
            
            result = supabase.table("aois").insert(aoi_data_dict).execute()
            
            # Schedule background analysis
            schedule_aoi_analysis(background_tasks, aoi_id, aoi_data.geojson)
            
            return {
                "aoi_id": aoi_id,
                "status": "created",
                "saved": True,
                "message": "AOI created successfully (login to manage permanently)"
            }
        except Exception as e:
            print(f"Anonymous AOI creation error: {e}")
            # Fallback to processing without saving
            schedule_aoi_analysis(background_tasks, aoi_id, aoi_data.geojson)
            return {
                "aoi_id": aoi_id,
                "status": "created", 
                "saved": False,
                "message": "AOI processed successfully"
            }


@router.get("", response_model=List[AOIResponse])
async def get_user_aois(
    current_user: User = Depends(get_current_user_optional),
    supabase: Client = Depends(get_supabase)
):
    """Get AOIs for the current user or all AOIs if anonymous"""
    if current_user:
        # For authenticated users, get their specific AOIs
        response = supabase.table("aois").select("*").eq("user_id", current_user.id).execute()
    else:
        # For anonymous users, show all anonymous AOIs (user_id is null) + a few sample ones
        response = supabase.table("aois").select("*").is_("user_id", "null").execute()
    
    aois = response.data or []
    
    return [
        AOIResponse(
            id=aoi["id"],
            name=aoi["name"],
            geojson=aoi["geojson"],
            created_at=aoi["created_at"]
        )
        for aoi in aois
    ]


@router.get("/{aoi_id}", response_model=AOIResponse)
async def get_aoi(
    aoi_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get specific AOI"""
    response = supabase.table("aois").select("*").eq("id", aoi_id).eq("user_id", current_user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Area of Interest not found"
        )
    
    aoi = response.data[0]
    return AOIResponse(
        id=aoi["id"],
        name=aoi["name"],
        geojson=aoi["geojson"],
        created_at=aoi["created_at"]
    )


@router.delete("/{aoi_id}")
async def delete_aoi(
    aoi_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete AOI"""
    response = supabase.table("aois").select("*").eq("id", aoi_id).eq("user_id", current_user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Area of Interest not found"
        )
    
    supabase.table("aois").delete().eq("id", aoi_id).execute()
    
    return {"message": "AOI deleted successfully"}
