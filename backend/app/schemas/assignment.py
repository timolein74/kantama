from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.assignment import AssignmentStatus


class AssignmentCreate(BaseModel):
    application_id: int
    financier_id: int
    notes: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: int
    application_id: int
    financier_id: int
    status: AssignmentStatus
    notes: Optional[str]
    assigned_by_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

