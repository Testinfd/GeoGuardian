from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class AlertType(str, Enum):
    TRASH = "trash"
    ALGAL_BLOOM = "algal_bloom"
    CONSTRUCTION = "construction"


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
