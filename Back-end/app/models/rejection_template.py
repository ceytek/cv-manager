"""
Rejection Template Model
Stores email templates for candidate rejection messages with variable placeholders
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base


class RejectionTemplate(Base):
    """
    RejectionTemplate Model - Stores rejection email templates
    
    Supports variable placeholders like {ad}, {soyad}, {telefon}, {ilan_adi}
    that get replaced with actual candidate/job data when sending.
    """
    __tablename__ = "rejection_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Template info
    name = Column(String(255), nullable=False)  # Template name for identification
    subject = Column(String(500), nullable=False)  # Email subject line
    body = Column(Text, nullable=False)  # Email body with variable placeholders
    
    # Template settings
    language = Column(String(10), default='TR')  # TR, EN, etc.
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # Default template for quick use
    
    # Multi-tenancy
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=False)
    created_by = Column(String(36), nullable=True)  # User ID who created
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<RejectionTemplate(id={self.id}, name={self.name})>"

