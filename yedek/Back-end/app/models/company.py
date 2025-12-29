"""
Company Model
Represents a tenant/company in the multi-tenancy system
"""
from sqlalchemy import Column, String, Boolean, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Company(Base):
    """Company (tenant) model"""
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_code = Column(String(6), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    address = Column(String, nullable=True)
    subdomain = Column(String(100), unique=True, nullable=True)
    custom_domain = Column(String(255), unique=True, nullable=True)
    logo_url = Column(String(500), nullable=True)
    theme_colors = Column(JSON, default={"primary": "#667eea", "secondary": "#764ba2"})
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    agreement_templates = relationship("AgreementTemplate", back_populates="company", cascade="all, delete-orphan")
    likert_templates = relationship("LikertTemplate", back_populates="company", cascade="all, delete-orphan")
    interview_templates = relationship("InterviewTemplate", back_populates="company", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Company {self.company_code}: {self.name}>"
