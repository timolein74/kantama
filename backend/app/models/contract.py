from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class ContractStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_ADMIN = "PENDING_ADMIN"  # Waiting admin approval
    SENT = "SENT"
    SIGNED = "SIGNED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String(50), unique=True, nullable=True)  # e.g., A000379000
    
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    financier_id = Column(Integer, ForeignKey("financiers.id"), nullable=False)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)  # Link to accepted offer
    
    # ============= LESSEE / VUOKRALLEOTTAJA =============
    lessee_company_name = Column(String(255), nullable=True)
    lessee_business_id = Column(String(20), nullable=True)
    lessee_street_address = Column(String(255), nullable=True)
    lessee_postal_code = Column(String(20), nullable=True)
    lessee_city = Column(String(100), nullable=True)
    lessee_country = Column(String(100), default="Finland")
    lessee_contact_person = Column(String(255), nullable=True)
    lessee_phone = Column(String(50), nullable=True)
    lessee_email = Column(String(255), nullable=True)
    lessee_tax_country = Column(String(100), default="Suomi")
    
    # ============= LESSOR / VUOKRALLEANTAJA =============
    lessor_company_name = Column(String(255), default="Rahoittaja Oy")
    lessor_business_id = Column(String(20), nullable=True)
    lessor_street_address = Column(String(255), nullable=True)
    lessor_postal_code = Column(String(20), nullable=True)
    lessor_city = Column(String(100), nullable=True)
    
    # ============= SELLER / MYYJÄ =============
    seller_company_name = Column(String(255), nullable=True)
    seller_business_id = Column(String(20), nullable=True)
    seller_street_address = Column(String(255), nullable=True)
    seller_postal_code = Column(String(20), nullable=True)
    seller_city = Column(String(100), nullable=True)
    seller_contact_person = Column(String(255), nullable=True)
    seller_phone = Column(String(50), nullable=True)
    seller_email = Column(String(255), nullable=True)
    seller_tax_country = Column(String(100), default="Suomi")
    
    # ============= LEASE OBJECT / VUOKRAKOHDE =============
    lease_objects = Column(JSON, nullable=True)  # Array of objects with: is_new, brand_model, accessories, serial_number, year_model
    usage_location = Column(String(255), default="Suomi")
    
    # ============= DELIVERY / TOIMITUS =============
    delivery_method = Column(String(100), nullable=True)  # Toimitus / Nouto
    estimated_delivery_date = Column(DateTime, nullable=True)
    other_delivery_terms = Column(Text, nullable=True)
    
    # ============= RENT / VUOKRAN MÄÄRÄ =============
    advance_payment = Column(Float, nullable=True)  # Ennakkovuokra
    monthly_rent = Column(Float, nullable=True)  # Vuokraerä
    rent_installments_count = Column(Integer, nullable=True)  # Number of installments (e.g., 1-60)
    rent_installments_start = Column(Integer, default=1)
    rent_installments_end = Column(Integer, nullable=True)
    
    residual_value = Column(Float, nullable=True)  # Jäännösarvo
    processing_fee = Column(Float, default=500.0)  # Käsittelymaksu (per installment)
    arrangement_fee = Column(Float, default=10.0)  # Järjestelypalkkio
    invoicing_method = Column(String(50), default="E-Lasku")  # Laskutustapa
    
    # ============= LEASE PERIOD / VUOKRA-AIKA =============
    lease_period_months = Column(Integer, nullable=True)  # Vuokra-aika/kk
    lease_start_date = Column(DateTime, nullable=True)  # Vuokra-ajan alkamispäivä
    
    # ============= INSURANCE / VAKUUTUS =============
    insurance_type = Column(String(100), nullable=True)
    insurance_provider = Column(String(255), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)
    
    # ============= BANK DETAILS =============
    bank_name = Column(String(255), nullable=True)
    bank_iban = Column(String(50), nullable=True)
    bank_bic = Column(String(20), nullable=True)
    
    # ============= GUARANTEES / VAKUUDET =============
    guarantees = Column(Text, nullable=True)  # Tarvittaessa tarkemmat sopimustiedot vakuuksista
    guarantee_type = Column(String(100), nullable=True)  # Tyhjä = ei vakuutta, henkilötakaus, etc.
    
    # ============= SPECIAL CONDITIONS / ERITYISEHDOT =============
    special_conditions = Column(Text, nullable=True)
    
    # ============= FINANCIER LOGO =============
    logo_file_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    
    # ============= MESSAGES =============
    message_to_customer = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    
    # Contract document
    contract_file_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Generated PDF
    signed_file_id = Column(Integer, ForeignKey("files.id"), nullable=True)  # Signed version
    
    # ============= SIGNATURES =============
    lessee_signature_date = Column(DateTime, nullable=True)
    lessee_signature_place = Column(String(100), nullable=True)
    lessee_signer_name = Column(String(255), nullable=True)
    lessor_signature_date = Column(DateTime, nullable=True)
    lessor_signature_place = Column(String(100), nullable=True)
    lessor_signer_name = Column(String(255), nullable=True)
    
    status = Column(Enum(ContractStatus), default=ContractStatus.DRAFT)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    signed_at = Column(DateTime, nullable=True)
    
    # Relationships
    application = relationship("Application", back_populates="contracts")
    financier = relationship("Financier", back_populates="contracts")
    offer = relationship("Offer")
    contract_file = relationship("File", foreign_keys=[contract_file_id])
    signed_file = relationship("File", foreign_keys=[signed_file_id])
    logo_file = relationship("File", foreign_keys=[logo_file_id])
