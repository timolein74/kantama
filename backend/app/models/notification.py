from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # e.g., INFO_REQUEST, OFFER_SENT, etc.
    
    # Reference to related entity
    reference_type = Column(String(50), nullable=True)  # application, offer, contract, etc.
    reference_id = Column(Integer, nullable=True)
    
    # Link for CTA
    action_url = Column(String(500), nullable=True)
    
    # Additional data
    data = Column(JSON, nullable=True)
    
    is_read = Column(Boolean, default=False)
    is_email_sent = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

