from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class AlertType(str, Enum):
    # Original MVP types
    TRASH = "trash"
    ALGAL_BLOOM = "algal_bloom"
    CONSTRUCTION = "construction"
    
    # Enhanced environmental types
    VEGETATION_LOSS = "vegetation_loss"
    VEGETATION_GAIN = "vegetation_gain"
    DEFORESTATION = "deforestation"
    COASTAL_EROSION = "coastal_erosion"
    COASTAL_ACCRETION = "coastal_accretion"
    WATER_QUALITY_CHANGE = "water_quality_change"
    POTENTIAL_POLLUTION = "potential_pollution"
    URBAN_EXPANSION = "urban_expansion"
    
    # Catch-all
    OTHER = "other"


class VoteType(str, Enum):
    AGREE = "agree"
    DISMISS = "dismiss"


# Pydantic models for API
class User(BaseModel):
    id: Optional[str] = None
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[datetime] = None


class AOI(BaseModel):
    id: Optional[str] = None
    name: str
    geojson: Dict[str, Any]
    user_id: str
    created_at: Optional[datetime] = None


class Alert(BaseModel):
    id: Optional[str] = None
    aoi_id: str
    gif_url: Optional[str] = None
    type: AlertType
    confidence: float = Field(ge=0.0, le=1.0)
    confirmed: bool = False
    processing: bool = True
    created_at: Optional[datetime] = None


class Vote(BaseModel):
    id: Optional[str] = None
    alert_id: str
    user_id: str
    vote: VoteType
    created_at: Optional[datetime] = None


# API Models
class AOICreate(BaseModel):
    name: str
    geojson: Dict[str, Any]


class AOIResponse(BaseModel):
    id: str
    name: str
    geojson: Dict[str, Any]
    created_at: datetime


class AlertResponse(BaseModel):
    id: str
    aoi_id: str
    gif_url: Optional[str]
    type: AlertType
    confidence: float
    confirmed: bool
    processing: bool
    created_at: datetime


class VoteCreate(BaseModel):
    alert_id: str
    vote: VoteType


class VoteResponse(BaseModel):
    status: str
    confirmations: int


# Enhanced Analysis Models
class AlgorithmResult(BaseModel):
    """Result from a single detection algorithm"""
    algorithm_name: str
    change_detected: bool
    confidence: float = Field(ge=0.0, le=1.0)
    change_type: Optional[str] = None
    severity: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SpectralIndices(BaseModel):
    """Spectral indices calculated from satellite imagery"""
    ndvi: Optional[float] = None
    evi: Optional[float] = None
    ndwi: Optional[float] = None
    mndwi: Optional[float] = None
    bsi: Optional[float] = None
    algae_index: Optional[float] = None
    turbidity_index: Optional[float] = None


class EnhancedAlert(BaseModel):
    """Enhanced alert with multi-algorithm analysis"""
    id: Optional[str] = None
    aoi_id: str
    gif_url: Optional[str] = None
    type: AlertType
    overall_confidence: float = Field(ge=0.0, le=1.0)
    priority_level: str  # "high", "medium", "low", "info"
    
    # Multi-algorithm results
    algorithm_results: List[AlgorithmResult] = []
    spectral_indices: Optional[SpectralIndices] = None
    
    # Enhanced metadata
    analysis_type: str = "comprehensive"
    algorithms_used: List[str] = []
    processing_time: Optional[float] = None
    
    # Original fields
    confirmed: bool = False
    processing: bool = True
    created_at: Optional[datetime] = None


class AnalysisRequest(BaseModel):
    """Request for enhanced analysis"""
    aoi_id: str
    analysis_type: str = "comprehensive"  # comprehensive, vegetation, water, coastal, construction
    algorithms: Optional[List[str]] = None  # Specific algorithms to use
    date_range_days: int = 30
    use_baseline: bool = True


class AnalysisStatus(BaseModel):
    """System analysis capabilities status"""
    advanced_analysis_available: bool
    algorithms_available: List[str]
    vedgesat_status: str
    spectral_bands_supported: int
    max_concurrent_analyses: int
