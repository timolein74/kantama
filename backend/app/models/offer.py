from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class OfferStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_ADMIN = "PENDING_ADMIN"  # Odottaa adminin hyväksyntää
    SENT = "SENT"  # Lähetetty asiakkaalle
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    financier_id = Column(Integer, ForeignKey("financiers.id"), nullable=False)
    
    # Offer terms
    monthly_payment = Column(Float, nullable=False)  # €/kk
    term_months = Column(Integer, nullable=False)  # Sopimuskausi
    upfront_payment = Column(Float, nullable=True)  # Käsiraha / alkumaksu
    residual_value = Column(Float, nullable=True)  # Jäännösarvo
    interest_or_margin = Column(Float, nullable=True)  # Korko/marginaali (vain rahoittajalle)
    
    # Additional terms
    included_services = Column(Text, nullable=True)  # Sisällytetyt palvelut
    notes_to_customer = Column(Text, nullable=True)  # Viesti asiakkaalle
    internal_notes = Column(Text, nullable=True)  # Rahoittajan sisäiset muistiinpanot
    
    # Full terms as JSON (flexible storage)
    terms_json = Column(JSON, nullable=True)
    
    status = Column(Enum(OfferStatus), default=OfferStatus.DRAFT)
    
    # Attachment
    attachment_file_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    application = relationship("Application", back_populates="offers")
    financier = relationship("Financier", back_populates="offers")
    attachment = relationship("File")

