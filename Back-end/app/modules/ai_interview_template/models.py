"""
AI Interview Email Template Model
Stores email templates for AI interview invitations with variable placeholders

Variables:
- {candidate_name} - Candidate's name
- {position} - Job position title
- {company_name} - Company name
- {interview_link} - Unique interview link for the candidate
- {expiry_date} - Link expiration date
- {expiry_time} - Link expiration time
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base


class AIInterviewEmailTemplate(Base):
    """
    AIInterviewEmailTemplate Model - Stores AI interview invitation email templates
    
    Supports variable placeholders that get replaced with actual data when sending:
    
    Variables:
    - {candidate_name} - Aday adı / Candidate name
    - {position} - Pozisyon adı / Position title
    - {company_name} - Şirket adı / Company name
    - {interview_link} - Mülakat linki / Interview link
    - {expiry_date} - Son geçerlilik tarihi / Expiry date
    - {expiry_time} - Son geçerlilik saati / Expiry time
    - {duration} - Mülakat süresi / Interview duration
    """
    __tablename__ = "ai_interview_email_templates"

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
        return f"<AIInterviewEmailTemplate(id={self.id}, name={self.name})>"


# Available template variables for frontend reference
AI_INTERVIEW_TEMPLATE_VARIABLES = [
    {'key': 'candidate_name', 'label_tr': 'Aday Adı', 'label_en': 'Candidate Name'},
    {'key': 'position', 'label_tr': 'Pozisyon', 'label_en': 'Position'},
    {'key': 'company_name', 'label_tr': 'Şirket Adı', 'label_en': 'Company Name'},
    {'key': 'interview_link', 'label_tr': 'Mülakat Linki', 'label_en': 'Interview Link'},
    {'key': 'expiry_date', 'label_tr': 'Son Geçerlilik Tarihi', 'label_en': 'Expiry Date'},
    {'key': 'expiry_time', 'label_tr': 'Son Geçerlilik Saati', 'label_en': 'Expiry Time'},
    {'key': 'duration', 'label_tr': 'Mülakat Süresi', 'label_en': 'Interview Duration'},
]
