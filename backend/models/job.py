from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class Region(BaseModel):
    id: str
    name: str
    x: float
    y: float
    width: float
    height: float

class BeautyParams(BaseModel):
    smoothing: int = 50
    brightening: int = 30
    sharpening: int = 20
    blemish_removal: int = 0
    detail_enhance: int = 0
    unsharp_mask: int = 0
    inpaint_spot: int = 0

class ProcessRequest(BaseModel):
    user_id: str
    media_type: str
    input_url: str = ""
    regions: List[Region] = []
    beauty_params: BeautyParams = BeautyParams()

class JobResponse(BaseModel):
    id: UUID
    user_id: str
    status: str
    input_url: str
    output_url: Optional[str] = None
    media_type: str
    credit_cost: int
    created_at: datetime
    completed_at: Optional[datetime] = None
