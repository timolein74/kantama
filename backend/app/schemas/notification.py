from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    reference_type: Optional[str]
    reference_id: Optional[int]
    action_url: Optional[str]
    data: Optional[Dict[str, Any]]
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True

