from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Financier(Base):
    __tablename__ = "financiers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)  # Contact email
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    business_id = Column(String(50), nullable=True)  # Y-tunnus
    
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="financier")
    assignments = relationship("ApplicationAssignment", back_populates="financier")
    info_requests = relationship("InfoRequest", back_populates="financier")
    offers = relationship("Offer", back_populates="financier")
    contracts = relationship("Contract", back_populates="financier")

