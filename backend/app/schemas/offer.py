from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.offer import OfferStatus


class OfferCreate(BaseModel):
    application_id: int
    monthly_payment: float
    term_months: int
    upfront_payment: Optional[float] = None
    residual_value: Optional[float] = None
    interest_or_margin: Optional[float] = None
    included_services: Optional[str] = None
    notes_to_customer: Optional[str] = None
    internal_notes: Optional[str] = None
    terms_json: Optional[Dict[str, Any]] = None


class OfferUpdate(BaseModel):
    monthly_payment: Optional[float] = None
    term_months: Optional[int] = None
    upfront_payment: Optional[float] = None
    residual_value: Optional[float] = None
    interest_or_margin: Optional[float] = None
    included_services: Optional[str] = None
    notes_to_customer: Optional[str] = None
    internal_notes: Optional[str] = None
    terms_json: Optional[Dict[str, Any]] = None
    status: Optional[OfferStatus] = None


class OfferResponse(BaseModel):
    id: int
    application_id: int
    financier_id: int
    monthly_payment: float
    term_months: int
    upfront_payment: Optional[float]
    residual_value: Optional[float]
    interest_or_margin: Optional[float]
    included_services: Optional[str]
    notes_to_customer: Optional[str]
    internal_notes: Optional[str]
    terms_json: Optional[Dict[str, Any]]
    status: OfferStatus
    attachment_file_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime]
    responded_at: Optional[datetime]
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class OfferCustomerResponse(BaseModel):
    """Offer response without internal fields - for customer view"""
    id: int
    application_id: int
    financier_id: int
    monthly_payment: float
    term_months: int
    upfront_payment: Optional[float]
    residual_value: Optional[float]
    included_services: Optional[str]
    notes_to_customer: Optional[str]
    status: OfferStatus
    attachment_file_id: Optional[int]
    created_at: datetime
    sent_at: Optional[datetime]
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True

