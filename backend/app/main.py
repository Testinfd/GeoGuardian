from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
import os
import tempfile
from .core.config import settings
from .core.database import create_db_and_tables
from .api import auth, aoi, alerts
from .api.v2 import analysis, aoi as aoi_v2, alerts as alerts_v2

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="GeoGuardian Environmental Monitoring API"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(aoi.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)

# Include v2 routers with enhanced capabilities
app.include_router(analysis.router, prefix="/api/v2/analysis", tags=["analysis-v2"])
app.include_router(aoi_v2.router, prefix="/api/v2/aoi", tags=["aoi-v2"])
app.include_router(alerts_v2.router, prefix="/api/v2/alerts", tags=["alerts-v2"])

# Mount static assets directory for serving generated visualizations
assets_path = os.path.join(tempfile.gettempdir(), "geoguardian_assets")
os.makedirs(assets_path, exist_ok=True)
app.mount("/assets", StaticFiles(directory=assets_path), name="assets")


@app.on_event("startup")
def on_startup():
    """Initialize database on startup"""
    create_db_and_tables()  # This is now a no-op for Supabase


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "GeoGuardian API is running! 🌍"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connectivity
        from .core.database import get_supabase
        supabase = get_supabase()
        # Simple test query
        test_result = supabase.table("aois").select("count", count="exact").limit(1).execute()
        db_status = "connected" if test_result.count is not None else "disconnected"
        
        # Check Sentinel Hub configuration
        from .core.config import settings
        sentinel_status = "configured" if settings.SENTINELHUB_CLIENT_ID and settings.SENTINELHUB_CLIENT_SECRET else "not_configured"
        
        return {
            "status": "ok",
            "service": "geoguardian-api",
            "database": db_status,
            "sentinel_hub": sentinel_status,
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "error",
            "service": "geoguardian-api",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
