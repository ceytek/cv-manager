"""
Second Interview Template Model
Stores email templates for second interview invitations with variable placeholders

Template Types:
- ONLINE: For video calls (Zoom, Teams, Meet) - uses {platform}, {meeting_link}
- IN_PERSON: For face-to-face meetings - uses {address_name}, {address_detail}, {google_maps_link}

Common Variables:
- {candidate_name}, {position}, {company_name}, {date}, {time}
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.core.database import Base


class SecondInterviewTemplateType(str, enum.Enum):
    """Template type for different interview formats"""
    ONLINE = "online"
    IN_PERSON = "in_person"


class SecondInterviewTemplate(Base):
    """
    SecondInterviewTemplate Model - Stores second interview invitation email templates
    
    Supports variable placeholders that get replaced with actual data when sending:
    
    Common variables:
    - {candidate_name} - Aday adı
    - {position} - Pozisyon adı
    - {company_name} - Şirket adı
    - {date} - Görüşme tarihi
    - {time} - Görüşme saati
    
    Online-specific variables:
    - {platform} - Platform adı (Zoom, Teams, Meet)
    - {meeting_link} - Toplantı linki
    
    In-person-specific variables:
    - {address_name} - Adres adı (Merkez Ofis, Fabrika, vb.)
    - {address_detail} - Tam adres
    - {google_maps_link} - Google Maps linki
    """
    __tablename__ = "second_interview_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Template info
    name = Column(String(255), nullable=False)  # Template name for identification
    template_type = Column(
        SQLEnum(SecondInterviewTemplateType, name='second_interview_template_type_enum', create_type=False),
        nullable=False,
        default=SecondInterviewTemplateType.ONLINE
    )
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
        return f"<SecondInterviewTemplate(id={self.id}, name={self.name}, type={self.template_type})>"


# Available template variables for frontend reference
ONLINE_TEMPLATE_VARIABLES = [
    {'key': 'candidate_name', 'label_tr': 'Aday Adı', 'label_en': 'Candidate Name'},
    {'key': 'position', 'label_tr': 'Pozisyon', 'label_en': 'Position'},
    {'key': 'company_name', 'label_tr': 'Şirket Adı', 'label_en': 'Company Name'},
    {'key': 'date', 'label_tr': 'Tarih', 'label_en': 'Date'},
    {'key': 'time', 'label_tr': 'Saat', 'label_en': 'Time'},
    {'key': 'platform', 'label_tr': 'Platform', 'label_en': 'Platform'},
    {'key': 'meeting_link', 'label_tr': 'Toplantı Linki', 'label_en': 'Meeting Link'},
]

IN_PERSON_TEMPLATE_VARIABLES = [
    {'key': 'candidate_name', 'label_tr': 'Aday Adı', 'label_en': 'Candidate Name'},
    {'key': 'position', 'label_tr': 'Pozisyon', 'label_en': 'Position'},
    {'key': 'company_name', 'label_tr': 'Şirket Adı', 'label_en': 'Company Name'},
    {'key': 'date', 'label_tr': 'Tarih', 'label_en': 'Date'},
    {'key': 'time', 'label_tr': 'Saat', 'label_en': 'Time'},
    {'key': 'address_name', 'label_tr': 'Adres Adı', 'label_en': 'Address Name'},
    {'key': 'address_detail', 'label_tr': 'Adres Detayı', 'label_en': 'Address Detail'},
    {'key': 'google_maps_link', 'label_tr': 'Google Maps Linki', 'label_en': 'Google Maps Link'},
]
