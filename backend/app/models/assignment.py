from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class AssignmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class ApplicationAssignment(Base):
    __tablename__ = "application_assignments"

    id = Column(Integer, primary_key=True, index=True)
    
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    financier_id = Column(Integer, ForeignKey("financiers.id"), nullable=False)
    
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.PENDING)
    notes = Column(Text, nullable=True)
    
    # Who assigned it
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="assignments")
    financier = relationship("Financier", back_populates="assignments")
    assigned_by = relationship("User")

