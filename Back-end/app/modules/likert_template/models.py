"""
Likert Test Template Model
Stores email templates for Likert test invitations with variable placeholders

Template Variables:
- {candidate_name} - Aday adı
- {position} - Pozisyon
- {company_name} - Şirket adı
- {test_link} - Test linki
- {expiry_date} - Son geçerlilik tarihi
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base


class LikertTemplate(Base):
    """
    LikertTemplate Model - Stores Likert test invitation email templates
    
    Supports variable placeholders that get replaced with actual data when sending:
    - {candidate_name} - Aday adı
    - {position} - Pozisyon adı
    - {company_name} - Şirket adı
    - {test_link} - Test linki
    - {expiry_date} - Son geçerlilik tarihi
    """
    __tablename__ = "likert_templates"

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
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(String(36), nullable=True)  # User ID who created
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<LikertTemplate(id={self.id}, name={self.name})>"


# Available template variables for frontend reference
LIKERT_TEMPLATE_VARIABLES = [
    {'key': 'candidate_name', 'label_tr': 'Aday Adı', 'label_en': 'Candidate Name'},
    {'key': 'position', 'label_tr': 'Pozisyon', 'label_en': 'Position'},
    {'key': 'company_name', 'label_tr': 'Şirket Adı', 'label_en': 'Company Name'},
    {'key': 'test_link', 'label_tr': 'Test Linki', 'label_en': 'Test Link'},
    {'key': 'expiry_date', 'label_tr': 'Son Geçerlilik Tarihi', 'label_en': 'Expiry Date'},
]
