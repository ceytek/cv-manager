"""
Offer Models - Teklif ve Teklif Şablonları
"""

import uuid
import secrets
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer, Numeric, Enum as SQLEnum, Date
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base
from .enums import OfferStatus, Currency


class OfferTemplate(Base):
    """
    Teklif Şablonu modeli
    Tekliflerin temel yapısını tanımlar
    """
    __tablename__ = "offer_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Template details
    name = Column(String(255), nullable=False)
    intro_text = Column(Text, nullable=True)  # Giriş metni - placeholder'lı
    outro_text = Column(Text, nullable=True)  # Kapanış metni
    
    # Default settings
    default_validity_days = Column(Integer, default=7)  # Varsayılan geçerlilik süresi (gün)
    default_benefits = Column(JSON, nullable=True)  # Varsayılan yan haklar [{"id": "...", "name": "...", ...}]
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="offer_templates")
    offers = relationship("Offer", back_populates="template")

    def __repr__(self):
        return f"<OfferTemplate {self.name}>"


class Offer(Base):
    """
    Teklif modeli
    Adaylara gönderilen iş tekliflerini yönetir
    """
    __tablename__ = "offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("offer_templates.id", ondelete="SET NULL"), nullable=True)
    
    # Access token for candidate portal
    token = Column(String(64), unique=True, nullable=False, default=lambda: secrets.token_urlsafe(32))
    
    # Status
    status = Column(SQLEnum(OfferStatus), default=OfferStatus.DRAFT, nullable=False)
    
    # Salary information
    salary_gross = Column(Numeric(12, 2), nullable=True)  # Brüt maaş
    salary_net = Column(Numeric(12, 2), nullable=True)    # Net maaş
    currency = Column(SQLEnum(Currency), default=Currency.TRY, nullable=False)
    
    # Dates
    start_date = Column(Date, nullable=True)      # İşe başlama tarihi
    valid_until = Column(Date, nullable=True)     # Son kabul tarihi
    
    # Benefits (selected from Benefits module)
    benefits = Column(JSON, nullable=True)  # [{"id": "...", "name": "...", "value": ..., ...}, ...]
    
    # Content
    intro_text = Column(Text, nullable=True)   # Şablondan veya özel
    outro_text = Column(Text, nullable=True)   # Şablondan veya özel
    custom_notes = Column(Text, nullable=True) # HR'ın ek notları
    
    # PDF
    pdf_path = Column(String(500), nullable=True)
    
    # Response tracking
    sent_at = Column(DateTime, nullable=True)
    viewed_at = Column(DateTime, nullable=True)      # Aday ilk görüntülediğinde
    responded_at = Column(DateTime, nullable=True)   # Yanıt tarihi
    response_note = Column(Text, nullable=True)      # Adayın notu (red/revizyon sebebi)
    
    # Revision tracking
    revision_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    company = relationship("Company", backref="offers")
    application = relationship("Application", backref="offers")
    template = relationship("OfferTemplate", back_populates="offers")

    def __repr__(self):
        return f"<Offer {self.id} - {self.status.value}>"
