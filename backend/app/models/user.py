from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"
    FINANCIER = "FINANCIER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    
    # Customer fields
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(50))
    company_name = Column(String(255))
    business_id = Column(String(50))  # Y-tunnus
    
    # Financier link
    financier_id = Column(Integer, ForeignKey("financiers.id"), nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    financier = relationship("Financier", back_populates="users")
    applications = relationship("Application", back_populates="customer")
    notifications = relationship("Notification", back_populates="user")
    
    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email

