from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import create_db_and_tables
from .api import auth, aoi, alerts
from .api.v2 import analysis

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="GeoGuardian Environmental Monitoring API"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(aoi.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)

# Include v2 routers with enhanced capabilities
app.include_router(analysis.router, prefix="/api/v2", tags=["analysis-v2"])


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
    return {"status": "ok", "service": "geoguardian-api"}
