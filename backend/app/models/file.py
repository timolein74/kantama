from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)  # MIME type
    file_size = Column(Integer, nullable=True)  # bytes
    
    # Context
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    description = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="files")
    uploaded_by = relationship("User")

