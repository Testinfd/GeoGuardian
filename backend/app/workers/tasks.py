from fastapi import BackgroundTasks
from ..core.database import get_supabase
from ..models.models import AlertType
from ..core.config import settings
from datetime import datetime
import asyncio


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
        
        # For MVP, create a mock alert (satellite processing would go here)
        try:
            # TODO: Implement actual satellite analysis with Sentinel Hub
            # For now, create a demo alert
            import random
            alert_types = [AlertType.TRASH, AlertType.ALGAL_BLOOM, AlertType.CONSTRUCTION]
            
            alert_data = {
                "aoi_id": aoi_id,
                "type": random.choice(alert_types).value,
                "confidence": round(random.uniform(0.6, 0.95), 2),
                "processing": False,
                "confirmed": False,
                "gif_url": "https://via.placeholder.com/400x300.gif"  # Placeholder for MVP
            }
            
            # Create alert in database only for registered users
            if not temp_geojson:
                alert_response = supabase.table("alerts").insert(alert_data).execute()
                
                if alert_response.data:
                    alert = alert_response.data[0]
                    print(f"Created alert {alert['id']} for AOI {aoi_id}")
                    
                    # TODO: Send email notification
                    # await email_service.send_alert_email(...)
                    
                else:
                    print(f"Failed to create alert for AOI {aoi_id}")
            else:
                # For anonymous users, just log the mock alert
                print(f"Mock alert created for anonymous AOI {aoi_id}: {alert_data['type']} with {alert_data['confidence']} confidence")
            
        except Exception as e:
            print(f"Error processing satellite data for AOI {aoi_id}: {e}")
            # Create failed alert only for registered users
            if not temp_geojson:
                failed_alert = {
                    "aoi_id": aoi_id,
                    "type": AlertType.TRASH.value,
                    "confidence": 0.0,
                    "processing": False,
                    "confirmed": False
                }
                supabase.table("alerts").insert(failed_alert).execute()
            
    except Exception as e:
        print(f"Error processing AOI {aoi_id}: {e}")


def schedule_aoi_analysis(background_tasks: BackgroundTasks, aoi_id: str, temp_geojson: dict = None):
    """Schedule AOI analysis as background task"""
    background_tasks.add_task(process_aoi_analysis, aoi_id, temp_geojson)
