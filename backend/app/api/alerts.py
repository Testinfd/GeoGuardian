from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List, Optional
from ..models.models import Alert, AlertResponse, Vote, VoteCreate, VoteResponse, User, AOI
from ..core.auth import get_current_user
from ..core.database import get_supabase

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/aoi/{aoi_id}", response_model=Optional[AlertResponse])
async def get_aoi_alert(
    aoi_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get the latest alert for an AOI"""
    
    # Verify AOI belongs to user
    aoi_response = supabase.table("aois").select("*").eq("id", aoi_id).eq("user_id", current_user.id).execute()
    
    if not aoi_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Area of Interest not found"
        )
    
    # Get latest alert
    alert_response = supabase.table("alerts").select("*").eq("aoi_id", aoi_id).order("created_at", desc=True).limit(1).execute()
    
    if not alert_response.data:
        # Return None if no alert exists yet
        return None
    
    alert = alert_response.data[0]
    
    if alert["processing"]:
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Alert is still being processed"
        )
    
    return AlertResponse(
        id=alert["id"],
        aoi_id=alert["aoi_id"],
        gif_url=alert["gif_url"],
        type=alert["type"],
        confidence=alert["confidence"],
        confirmed=alert["confirmed"],
        processing=alert["processing"],
        created_at=alert["created_at"]
    )


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Get specific alert (public endpoint for sharing)"""
    response = supabase.table("alerts").select("*").eq("id", alert_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert = response.data[0]
    return AlertResponse(
        id=alert["id"],
        aoi_id=alert["aoi_id"],
        gif_url=alert["gif_url"],
        type=alert["type"],
        confidence=alert["confidence"],
        confirmed=alert["confirmed"],
        processing=alert["processing"],
        created_at=alert["created_at"]
    )


@router.get("", response_model=List[AlertResponse])
async def get_user_alerts(
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get all alerts for the current user"""
    
    # Get user's AOIs
    aoi_response = supabase.table("aois").select("id").eq("user_id", current_user.id).execute()
    aoi_ids = [aoi["id"] for aoi in aoi_response.data] if aoi_response.data else []
    
    if not aoi_ids:
        return []
    
    # Get alerts for user's AOIs
    alert_response = supabase.table("alerts").select("*").in_("aoi_id", aoi_ids).order("created_at", desc=True).execute()
    alerts = alert_response.data or []
    
    return [
        AlertResponse(
            id=alert["id"],
            aoi_id=alert["aoi_id"],
            gif_url=alert["gif_url"],
            type=alert["type"],
            confidence=alert["confidence"],
            confirmed=alert["confirmed"],
            processing=alert["processing"],
            created_at=alert["created_at"]
        )
        for alert in alerts
    ]


@router.post("/verify", response_model=VoteResponse)
async def verify_alert(
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Submit verification vote for an alert"""
    
    # Check if alert exists
    alert_response = supabase.table("alerts").select("*").eq("id", vote_data.alert_id).execute()
    
    if not alert_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert = alert_response.data[0]
    
    # Check if user already voted
    existing_vote_response = supabase.table("votes").select("*").eq("alert_id", vote_data.alert_id).eq("user_id", current_user.id).execute()
    
    if existing_vote_response.data:
        # Update existing vote
        vote_id = existing_vote_response.data[0]["id"]
        supabase.table("votes").update({"vote": vote_data.vote}).eq("id", vote_id).execute()
    else:
        # Create new vote
        new_vote = {
            "alert_id": vote_data.alert_id,
            "user_id": current_user.id,
            "vote": vote_data.vote
        }
        supabase.table("votes").insert(new_vote).execute()
    
    # Count total confirmations
    confirmations_response = supabase.table("votes").select("*").eq("alert_id", vote_data.alert_id).eq("vote", "agree").execute()
    confirmations = len(confirmations_response.data) if confirmations_response.data else 0
    
    # Update alert confirmation status
    if confirmations >= 2 and not alert["confirmed"]:
        supabase.table("alerts").update({"confirmed": True}).eq("id", vote_data.alert_id).execute()
    
    return VoteResponse(
        status="confirmed" if confirmations >= 2 else "pending",
        confirmations=confirmations
    )
