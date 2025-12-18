from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.info_request import InfoRequestStatus


class InfoRequestCreate(BaseModel):
    application_id: int
    message: str
    requested_items: Optional[List[str]] = None


class InfoRequestResponseCreate(BaseModel):
    info_request_id: int
    message: str
    attachment_ids: Optional[List[int]] = None


class InfoRequestUserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    
    class Config:
        from_attributes = True


class InfoResponseItem(BaseModel):
    id: int
    message: str
    user: InfoRequestUserResponse
    attachments: Optional[List[int]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class InfoRequestResponse(BaseModel):
    id: int
    application_id: int
    financier_id: int
    message: str
    requested_items: Optional[List[str]]
    status: InfoRequestStatus
    created_at: datetime
    updated_at: datetime
    responses: Optional[List[InfoResponseItem]] = None
    
    class Config:
        from_attributes = True

