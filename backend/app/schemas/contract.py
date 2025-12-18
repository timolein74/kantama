from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.contract import ContractStatus


class LeaseObject(BaseModel):
    is_new: bool = False  # Uusi/Käytetty
    brand_model: str  # Merkki ja malli
    accessories: Optional[str] = None  # Lisävarusteet
    serial_number: Optional[str] = None  # Sarja-/Rekisterinumero
    year_model: Optional[int] = None  # Vuosimalli


class ContractCreate(BaseModel):
    application_id: int
    offer_id: Optional[int] = None
    
    # Lessee info (can be auto-filled from application)
    lessee_company_name: Optional[str] = None
    lessee_business_id: Optional[str] = None
    lessee_street_address: Optional[str] = None
    lessee_postal_code: Optional[str] = None
    lessee_city: Optional[str] = None
    lessee_country: Optional[str] = "Finland"
    lessee_contact_person: Optional[str] = None
    lessee_phone: Optional[str] = None
    lessee_email: Optional[str] = None
    lessee_tax_country: Optional[str] = "Suomi"
    
    # Lessor info (can be set by financier)
    lessor_company_name: Optional[str] = "Rahoittaja Oy"
    lessor_business_id: Optional[str] = None
    lessor_street_address: Optional[str] = None
    lessor_postal_code: Optional[str] = None
    lessor_city: Optional[str] = None
    
    # Seller info
    seller_company_name: Optional[str] = None
    seller_business_id: Optional[str] = None
    seller_street_address: Optional[str] = None
    seller_postal_code: Optional[str] = None
    seller_city: Optional[str] = None
    seller_contact_person: Optional[str] = None
    seller_phone: Optional[str] = None
    seller_email: Optional[str] = None
    seller_tax_country: Optional[str] = "Suomi"
    
    # Lease objects
    lease_objects: Optional[List[LeaseObject]] = None
    usage_location: Optional[str] = "Suomi"
    
    # Delivery
    delivery_method: Optional[str] = None
    estimated_delivery_date: Optional[datetime] = None
    other_delivery_terms: Optional[str] = None
    
    # Rent
    advance_payment: Optional[float] = None
    monthly_rent: Optional[float] = None
    rent_installments_count: Optional[int] = None
    rent_installments_start: Optional[int] = 1
    rent_installments_end: Optional[int] = None
    residual_value: Optional[float] = None
    processing_fee: Optional[float] = 500.0
    arrangement_fee: Optional[float] = 10.0
    invoicing_method: Optional[str] = "E-Lasku"
    
    # Lease period
    lease_period_months: Optional[int] = None
    lease_start_date: Optional[datetime] = None
    
    # Insurance
    insurance_type: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    
    # Bank details
    bank_name: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_bic: Optional[str] = None
    
    # Guarantees
    guarantees: Optional[str] = None
    guarantee_type: Optional[str] = None
    
    # Special conditions
    special_conditions: Optional[str] = None
    
    # Messages
    message_to_customer: Optional[str] = None
    internal_notes: Optional[str] = None


class ContractUpdate(BaseModel):
    # Lessee
    lessee_company_name: Optional[str] = None
    lessee_business_id: Optional[str] = None
    lessee_street_address: Optional[str] = None
    lessee_postal_code: Optional[str] = None
    lessee_city: Optional[str] = None
    lessee_country: Optional[str] = None
    lessee_contact_person: Optional[str] = None
    lessee_phone: Optional[str] = None
    lessee_email: Optional[str] = None
    lessee_tax_country: Optional[str] = None
    
    # Lessor
    lessor_company_name: Optional[str] = None
    lessor_business_id: Optional[str] = None
    lessor_street_address: Optional[str] = None
    lessor_postal_code: Optional[str] = None
    lessor_city: Optional[str] = None
    
    # Seller
    seller_company_name: Optional[str] = None
    seller_business_id: Optional[str] = None
    seller_street_address: Optional[str] = None
    seller_postal_code: Optional[str] = None
    seller_city: Optional[str] = None
    seller_contact_person: Optional[str] = None
    seller_phone: Optional[str] = None
    seller_email: Optional[str] = None
    seller_tax_country: Optional[str] = None
    
    # Lease objects
    lease_objects: Optional[List[LeaseObject]] = None
    usage_location: Optional[str] = None
    
    # Delivery
    delivery_method: Optional[str] = None
    estimated_delivery_date: Optional[datetime] = None
    other_delivery_terms: Optional[str] = None
    
    # Rent
    advance_payment: Optional[float] = None
    monthly_rent: Optional[float] = None
    rent_installments_count: Optional[int] = None
    rent_installments_start: Optional[int] = None
    rent_installments_end: Optional[int] = None
    residual_value: Optional[float] = None
    processing_fee: Optional[float] = None
    arrangement_fee: Optional[float] = None
    invoicing_method: Optional[str] = None
    
    # Lease period
    lease_period_months: Optional[int] = None
    lease_start_date: Optional[datetime] = None
    
    # Insurance
    insurance_type: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    
    # Bank details
    bank_name: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_bic: Optional[str] = None
    
    # Guarantees
    guarantees: Optional[str] = None
    guarantee_type: Optional[str] = None
    
    # Special conditions
    special_conditions: Optional[str] = None
    
    # Messages
    message_to_customer: Optional[str] = None
    internal_notes: Optional[str] = None
    status: Optional[ContractStatus] = None


class ContractResponse(BaseModel):
    id: int
    contract_number: Optional[str]
    application_id: int
    financier_id: int
    offer_id: Optional[int]
    
    # Lessee
    lessee_company_name: Optional[str]
    lessee_business_id: Optional[str]
    lessee_street_address: Optional[str]
    lessee_postal_code: Optional[str]
    lessee_city: Optional[str]
    lessee_country: Optional[str]
    lessee_contact_person: Optional[str]
    lessee_phone: Optional[str]
    lessee_email: Optional[str]
    lessee_tax_country: Optional[str]
    
    # Lessor
    lessor_company_name: Optional[str]
    lessor_business_id: Optional[str]
    lessor_street_address: Optional[str]
    lessor_postal_code: Optional[str]
    lessor_city: Optional[str]
    
    # Seller
    seller_company_name: Optional[str]
    seller_business_id: Optional[str]
    seller_street_address: Optional[str]
    seller_postal_code: Optional[str]
    seller_city: Optional[str]
    seller_contact_person: Optional[str]
    seller_phone: Optional[str]
    seller_email: Optional[str]
    seller_tax_country: Optional[str]
    
    # Lease objects
    lease_objects: Optional[List[LeaseObject]]
    usage_location: Optional[str]
    
    # Delivery
    delivery_method: Optional[str]
    estimated_delivery_date: Optional[datetime]
    other_delivery_terms: Optional[str]
    
    # Rent
    advance_payment: Optional[float]
    monthly_rent: Optional[float]
    rent_installments_count: Optional[int]
    rent_installments_start: Optional[int]
    rent_installments_end: Optional[int]
    residual_value: Optional[float]
    processing_fee: Optional[float]
    arrangement_fee: Optional[float]
    invoicing_method: Optional[str]
    
    # Lease period
    lease_period_months: Optional[int]
    lease_start_date: Optional[datetime]
    
    # Insurance
    insurance_type: Optional[str]
    insurance_provider: Optional[str]
    insurance_policy_number: Optional[str]
    
    # Bank details
    bank_name: Optional[str]
    bank_iban: Optional[str]
    bank_bic: Optional[str]
    
    # Guarantees
    guarantees: Optional[str]
    guarantee_type: Optional[str]
    
    # Special conditions
    special_conditions: Optional[str]
    
    # Messages & files
    message_to_customer: Optional[str]
    internal_notes: Optional[str]
    contract_file_id: Optional[int]
    signed_file_id: Optional[int]
    logo_file_id: Optional[int]
    
    # Signatures
    lessee_signature_date: Optional[datetime]
    lessee_signature_place: Optional[str]
    lessee_signer_name: Optional[str]
    lessor_signature_date: Optional[datetime]
    lessor_signature_place: Optional[str]
    lessor_signer_name: Optional[str]
    
    status: ContractStatus
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime]
    signed_at: Optional[datetime]
    
    class Config:
        from_attributes = True
