from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from app.models.application import ApplicationType, ApplicationStatus


class ApplicationCreate(BaseModel):
    application_type: ApplicationType
    company_name: str
    business_id: str
    contact_person: Optional[str] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    street_address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    equipment_description: str
    equipment_supplier: Optional[str] = None
    equipment_price: float
    equipment_age_months: Optional[int] = None
    equipment_serial_number: Optional[str] = None
    original_purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    requested_term_months: Optional[int] = None
    requested_residual_value: Optional[float] = None
    additional_info: Optional[str] = None


class LeasingApplicationCreate(BaseModel):
    company_name: str
    business_id: str
    contact_person: Optional[str] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    password: Optional[str] = None  # Customer sets their own password
    street_address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    equipment_description: Optional[str] = None
    equipment_supplier: Optional[str] = None
    equipment_price: float
    requested_term_months: Optional[int] = None
    requested_residual_value: Optional[float] = None
    additional_info: Optional[str] = None
    link_to_item: Optional[str] = None
    ytj_data: Optional[Any] = None  # Full YTJ company data from PRH


class SaleLeasebackApplicationCreate(BaseModel):
    company_name: str
    business_id: str
    contact_person: Optional[str] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    password: Optional[str] = None  # Customer sets their own password
    street_address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    equipment_description: str
    year_model: int  # Vuosimalli
    hours: Optional[int] = None  # Tunnit
    kilometers: Optional[int] = None  # Kilometrit
    current_value: float
    requested_term_months: Optional[int] = None
    additional_info: Optional[str] = None
    ytj_data: Optional[Any] = None  # Full YTJ company data from PRH


class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    business_id: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    street_address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    equipment_description: Optional[str] = None
    equipment_supplier: Optional[str] = None
    equipment_price: Optional[float] = None
    equipment_age_months: Optional[int] = None
    equipment_serial_number: Optional[str] = None
    original_purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    requested_term_months: Optional[int] = None
    requested_residual_value: Optional[float] = None
    additional_info: Optional[str] = None
    status: Optional[ApplicationStatus] = None


class FileResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: Optional[str]
    file_size: Optional[int]
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ApplicationResponse(BaseModel):
    id: int
    reference_number: str
    application_type: ApplicationType
    status: ApplicationStatus
    customer_id: int
    company_name: str
    business_id: str
    contact_person: Optional[str]
    contact_email: str
    contact_phone: Optional[str]
    street_address: Optional[str]
    postal_code: Optional[str]
    city: Optional[str]
    equipment_description: str
    equipment_supplier: Optional[str]
    equipment_price: float
    equipment_age_months: Optional[int]
    equipment_serial_number: Optional[str]
    original_purchase_price: Optional[float]
    current_value: Optional[float]
    requested_term_months: Optional[int]
    requested_residual_value: Optional[float]
    additional_info: Optional[str]
    extra_data: Optional[Any] = None  # For year_model, hours, kilometers, link_to_item
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    files: Optional[List[FileResponse]] = None
    
    class Config:
        from_attributes = True

