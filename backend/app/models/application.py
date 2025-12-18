from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class ApplicationType(str, enum.Enum):
    LEASING = "LEASING"
    SALE_LEASEBACK = "SALE_LEASEBACK"  # Takaisinvuokraus


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    SUBMITTED_TO_FINANCIER = "SUBMITTED_TO_FINANCIER"
    INFO_REQUESTED = "INFO_REQUESTED"
    OFFER_SENT = "OFFER_SENT"
    OFFER_ACCEPTED = "OFFER_ACCEPTED"
    OFFER_REJECTED = "OFFER_REJECTED"
    CONTRACT_SENT = "CONTRACT_SENT"
    SIGNED = "SIGNED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(50), unique=True, index=True)
    
    # Application type
    application_type = Column(Enum(ApplicationType), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.SUBMITTED)
    
    # Customer reference
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Company info
    company_name = Column(String(255), nullable=False)
    business_id = Column(String(50), nullable=False)  # Y-tunnus
    contact_person = Column(String(200))
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50))
    
    # Address
    street_address = Column(String(255))
    postal_code = Column(String(20))
    city = Column(String(100))
    
    # Equipment/Asset info
    equipment_description = Column(Text, nullable=False)
    equipment_supplier = Column(String(255))
    equipment_price = Column(Float, nullable=False)  # Hankintahinta
    
    # For Sale-Leaseback
    equipment_age_months = Column(Integer, nullable=True)  # Kohteen ikä kuukausina
    equipment_serial_number = Column(String(255), nullable=True)
    original_purchase_price = Column(Float, nullable=True)  # Alkuperäinen ostohinta
    current_value = Column(Float, nullable=True)  # Nykyarvo
    
    # Financing terms requested
    requested_term_months = Column(Integer)  # Toivottu sopimuskausi
    requested_residual_value = Column(Float, nullable=True)  # Toivottu jäännösarvo
    
    # Additional info
    additional_info = Column(Text)
    
    # Extra data stored as JSON
    extra_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    
    # Relationships
    customer = relationship("User", back_populates="applications")
    assignments = relationship("ApplicationAssignment", back_populates="application")
    info_requests = relationship("InfoRequest", back_populates="application")
    offers = relationship("Offer", back_populates="application")
    contracts = relationship("Contract", back_populates="application")
    files = relationship("File", back_populates="application")

