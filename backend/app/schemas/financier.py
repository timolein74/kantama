from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class FinancierCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    business_id: Optional[str] = None
    notes: Optional[str] = None


class FinancierUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    business_id: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class FinancierUserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class FinancierResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    business_id: Optional[str]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    users: Optional[List[FinancierUserResponse]] = None
    
    class Config:
        from_attributes = True

