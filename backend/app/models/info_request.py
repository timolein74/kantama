from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class InfoRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    RESPONDED = "RESPONDED"
    CLOSED = "CLOSED"


class InfoRequest(Base):
    __tablename__ = "info_requests"

    id = Column(Integer, primary_key=True, index=True)
    
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    financier_id = Column(Integer, ForeignKey("financiers.id"), nullable=False)
    
    message = Column(Text, nullable=False)
    requested_items = Column(JSON, nullable=True)  # List of specific items requested
    
    status = Column(Enum(InfoRequestStatus), default=InfoRequestStatus.PENDING)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="info_requests")
    financier = relationship("Financier", back_populates="info_requests")
    responses = relationship("InfoRequestResponse", back_populates="info_request")


class InfoRequestResponse(Base):
    __tablename__ = "info_request_responses"

    id = Column(Integer, primary_key=True, index=True)
    
    info_request_id = Column(Integer, ForeignKey("info_requests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Customer or Financier
    
    message = Column(Text, nullable=False)
    attachments = Column(JSON, nullable=True)  # List of file IDs
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    info_request = relationship("InfoRequest", back_populates="responses")
    user = relationship("User")

