"""
Pydantic Models for GeoGuardian API
Defines data models for authentication, AOIs, alerts, and analysis results
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, List, Any, Union
from datetime import datetime
from enum import Enum


# Enums for various types
class AlertType(str, Enum):
    """Types of environmental alerts"""
    VEGETATION_LOSS = "vegetation_loss"
    VEGETATION_GAIN = "vegetation_gain"
    DEFORESTATION = "deforestation"
    CONSTRUCTION = "construction"
    COASTAL_EROSION = "coastal_erosion"
    COASTAL_ACCRETION = "coastal_accretion"
    WATER_QUALITY_CHANGE = "water_quality_change"
    ALGAL_BLOOM = "algal_bloom"
    URBAN_EXPANSION = "urban_expansion"
    OTHER = "other"
    UNKNOWN = "unknown"


class VoteType(str, Enum):
    """Vote types for community verification"""
    AGREE = "agree"
    DISAGREE = "disagree"


class AnalysisStatus(str, Enum):
    """Status of analysis processing"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PriorityLevel(str, Enum):
    """Priority levels for alerts"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


# Base Models
class User(BaseModel):
    """User model"""
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# AOI Models
class AOICreate(BaseModel):
    """Model for creating new AOI"""
    name: str = Field(..., min_length=1, max_length=255, description="Name of the area of interest")
    geojson: Dict[str, Any] = Field(..., description="GeoJSON geometry (Polygon)")
    description: Optional[str] = Field(None, description="Optional description of the AOI")
    is_public: bool = Field(False, description="Whether the AOI is publicly visible")
    tags: Optional[List[str]] = Field([], description="Optional tags for categorizing the AOI")
    auto_analyze: bool = Field(False, description="Whether to automatically schedule analysis after creation")

    @validator('geojson')
    def validate_geojson(cls, v):
        """Validate GeoJSON structure"""
        if not isinstance(v, dict):
            raise ValueError('GeoJSON must be a dictionary')
        if v.get('type') != 'Polygon':
            raise ValueError('GeoJSON must be a Polygon')
        if 'coordinates' not in v:
            raise ValueError('GeoJSON must have coordinates')
        return v

    class Config:
        schema_extra = {
            "example": {
                "name": "Forest Area Monitoring",
                "description": "Monitoring deforestation in the Amazon rainforest",
                "is_public": False,
                "tags": ["forest", "deforestation", "amazon"],
                "auto_analyze": True,
                "geojson": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-74.0059, 40.7128],
                        [-74.0059, 40.7628],
                        [-73.9559, 40.7628],
                        [-73.9559, 40.7128],
                        [-74.0059, 40.7128]
                    ]]
                }
            }
        }


class AOI(BaseModel):
    """AOI model for database operations"""
    id: str
    name: str
    geojson: Dict[str, Any]
    user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AOIResponse(BaseModel):
    """AOI response model"""
    id: str
    name: str
    geojson: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Alert Models
class AlertBase(BaseModel):
    """Base alert model"""
    aoi_id: str
    type: AlertType = AlertType.UNKNOWN
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    
    
class AlertCreate(AlertBase):
    """Model for creating alerts"""
    gif_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Alert(AlertBase):
    """Alert model for database operations"""
    id: str
    gif_url: Optional[str] = None
    confirmed: bool = False
    processing: bool = False
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    """Alert response model"""
    id: str
    aoi_id: str
    type: AlertType
    confidence: float
    gif_url: Optional[str] = None
    confirmed: bool = False
    processing: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class EnhancedAlert(BaseModel):
    """Enhanced alert model with comprehensive analysis results"""
    id: str
    aoi_id: str
    analysis_type: str = "comprehensive"
    status: AnalysisStatus = AnalysisStatus.PENDING
    priority_level: PriorityLevel = PriorityLevel.INFO
    overall_confidence: float = Field(0.0, ge=0, le=1)
    
    # Detection results
    detections: List[Dict[str, Any]] = []
    algorithms_used: List[str] = []
    
    # Visualization assets
    visualization_urls: Optional[Dict[str, str]] = None
    
    # Metadata
    satellite_metadata: Optional[Dict[str, Any]] = None
    processing_metadata: Optional[Dict[str, Any]] = None
    spectral_indices: Optional[Dict[str, Any]] = None
    
    # Quality metrics
    processing_time_seconds: float = 0.0
    data_quality_score: float = 0.0
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Vote Models
class VoteCreate(BaseModel):
    """Model for creating votes"""
    alert_id: str
    vote: VoteType


class Vote(BaseModel):
    """Vote model"""
    id: str
    alert_id: str
    user_id: str
    vote: VoteType
    created_at: datetime

    class Config:
        from_attributes = True


class VoteResponse(BaseModel):
    """Vote response model"""
    status: str  # "confirmed" or "pending"
    confirmations: int


# Analysis Models
class SpectralIndices(BaseModel):
    """Spectral indices calculated from satellite imagery"""
    ndvi: Optional[float] = Field(None, description="Normalized Difference Vegetation Index")
    evi: Optional[float] = Field(None, description="Enhanced Vegetation Index")
    ndwi: Optional[float] = Field(None, description="Normalized Difference Water Index")
    mndwi: Optional[float] = Field(None, description="Modified NDWI")
    bsi: Optional[float] = Field(None, description="Bare Soil Index")
    algae_index: Optional[float] = Field(None, description="Algae Detection Index")
    turbidity_index: Optional[float] = Field(None, description="Water Turbidity Index")
    savi: Optional[float] = Field(None, description="Soil Adjusted Vegetation Index")
    arvi: Optional[float] = Field(None, description="Atmospherically Resistant Vegetation Index")
    gndvi: Optional[float] = Field(None, description="Green NDVI")

    class Config:
        schema_extra = {
            "example": {
                "ndvi": 0.45,
                "evi": 0.38,
                "ndwi": 0.12,
                "bsi": 0.23
            }
        }


class AlgorithmResult(BaseModel):
    """Result from a specific algorithm"""
    algorithm_name: str = Field(..., description="Name of the algorithm (e.g., 'EWMA', 'CUSUM')")
    change_detected: bool = Field(False, description="Whether change was detected")
    confidence: float = Field(0.0, ge=0, le=1, description="Algorithm confidence score")
    change_type: Optional[str] = Field(None, description="Type of change detected")
    severity: Optional[str] = Field(None, description="Severity level (high, medium, low)")
    
    # Algorithm-specific metrics
    spatial_metrics: Optional[Dict[str, Any]] = Field(None, description="Spatial analysis metrics")
    temporal_metrics: Optional[Dict[str, Any]] = Field(None, description="Temporal analysis metrics")
    
    # Visualization data
    change_mask: Optional[List[List[int]]] = Field(None, description="Binary change mask")
    confidence_map: Optional[List[List[float]]] = Field(None, description="Pixel-wise confidence scores")
    
    # Processing metadata
    parameters_used: Optional[Dict[str, Any]] = Field(None, description="Algorithm parameters")
    processing_notes: Optional[str] = Field(None, description="Additional processing information")

    class Config:
        schema_extra = {
            "example": {
                "algorithm_name": "CUSUM",
                "change_detected": True,
                "confidence": 0.87,
                "change_type": "construction",
                "severity": "medium",
                "spatial_metrics": {
                    "affected_area_percentage": 3.2,
                    "total_pixels": 10000,
                    "changed_pixels": 320
                }
            }
        }


class SatelliteImageMetadata(BaseModel):
    """Metadata for satellite imagery"""
    timestamp: datetime
    satellite: str = "Sentinel-2"
    cloud_coverage: float = Field(0.0, ge=0, le=1, description="Cloud coverage percentage")
    quality_score: float = Field(0.0, ge=0, le=1, description="Image quality score")
    resolution: float = Field(10.0, description="Spatial resolution in meters")
    bands: List[str] = Field(default_factory=list, description="Available spectral bands")
    
    class Config:
        schema_extra = {
            "example": {
                "timestamp": "2024-01-15T10:30:00Z",
                "satellite": "Sentinel-2",
                "cloud_coverage": 0.15,
                "quality_score": 0.92,
                "resolution": 10.0,
                "bands": ["B02", "B03", "B04", "B08"]
            }
        }


class AnalysisRequest(BaseModel):
    """Request model for comprehensive analysis"""
    aoi_id: str
    geojson: Dict[str, Any]
    analysis_type: str = Field("comprehensive", description="Type of analysis to perform")
    date_range_days: int = Field(30, ge=7, le=365, description="Days back to search for imagery")
    max_cloud_coverage: float = Field(0.3, ge=0, le=1, description="Maximum acceptable cloud coverage")
    
    # Analysis options
    include_spectral_analysis: bool = True
    include_visualizations: bool = True
    algorithms: Optional[List[str]] = Field(None, description="Specific algorithms to use")
    
    # Quality thresholds
    priority_threshold: float = Field(0.7, ge=0, le=1, description="Minimum confidence for high priority")
    
    class Config:
        schema_extra = {
            "example": {
                "aoi_id": "123e4567-e89b-12d3-a456-426614174000",
                "geojson": {
                    "type": "Polygon",
                    "coordinates": [[[-74.0059, 40.7128], [-74.0059, 40.7628], [-73.9559, 40.7628], [-73.9559, 40.7128], [-74.0059, 40.7128]]]
                },
                "analysis_type": "comprehensive",
                "date_range_days": 30,
                "max_cloud_coverage": 0.2
            }
        }


class AnalysisResponse(BaseModel):
    """Comprehensive analysis response"""
    aoi_id: str
    status: AnalysisStatus
    success: bool
    
    # Core results
    overall_confidence: float = Field(0.0, ge=0, le=1)
    priority_level: PriorityLevel
    detections: List[AlgorithmResult] = []
    algorithms_used: List[str] = []
    
    # Enhanced data
    spectral_indices: Optional[SpectralIndices] = None
    visualization_urls: Optional[Dict[str, str]] = None
    satellite_metadata: Optional[Dict[str, SatelliteImageMetadata]] = None
    
    # Processing information
    processing_metadata: Optional[Dict[str, Any]] = None
    processing_time_seconds: float = 0.0
    data_quality_score: float = Field(0.0, ge=0, le=1)
    
    created_at: datetime

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "aoi_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "completed",
                "success": True,
                "overall_confidence": 0.85,
                "priority_level": "high",
                "algorithms_used": ["CUSUM", "EWMA", "Spectral Analysis"],
                "processing_time_seconds": 23.5,
                "data_quality_score": 0.92
            }
        }


# Configuration and Settings Models
class AnalysisConfiguration(BaseModel):
    """Configuration for analysis algorithms"""
    ewma_lambda: float = Field(0.2, ge=0.01, le=0.99, description="EWMA smoothing parameter")
    cusum_threshold: float = Field(3.0, ge=1.0, le=10.0, description="CUSUM detection threshold")
    confidence_threshold: float = Field(0.7, ge=0.1, le=0.95, description="Minimum confidence for alerts")
    
    # Spatial parameters
    min_change_area_pixels: int = Field(25, ge=1, description="Minimum pixels for valid change detection")
    spatial_smoothing_kernel: int = Field(3, ge=1, le=9, description="Spatial filtering kernel size")
    
    # Temporal parameters
    baseline_period_days: int = Field(90, ge=30, le=365, description="Baseline calculation period")
    
    class Config:
        schema_extra = {
            "example": {
                "ewma_lambda": 0.2,
                "cusum_threshold": 3.5,
                "confidence_threshold": 0.7,
                "min_change_area_pixels": 25
            }
        }


# API Response Models
class APIResponse(BaseModel):
    """Generic API response wrapper"""
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Analysis completed successfully",
                "data": {"confidence": 0.85, "change_detected": True},
                "timestamp": "2024-01-15T14:30:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)

    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "error": "Insufficient satellite data for analysis",
                "error_code": "INSUFFICIENT_DATA",
                "timestamp": "2024-01-15T14:30:00Z"
            }
        }