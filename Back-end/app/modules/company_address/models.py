"""
Company Address Database Model
Şirket Adresleri Veritabanı Modeli
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class CompanyAddress(Base):
    """
    Şirket Adresleri Tablosu
    - Her şirketin birden fazla adresi olabilir
    - Her adresin bir ismi, açık adresi ve Google Maps linki var
    - is_default: Varsayılan adres mi?
    - is_active: Aktif mi?
    """
    __tablename__ = "company_addresses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Adres bilgileri
    name = Column(String(255), nullable=False)  # Adres ismi (örn: "Merkez Ofis", "Fabrika")
    address = Column(Text, nullable=False)  # Açık adres
    google_maps_link = Column(String(1024), nullable=True)  # Google Maps linki
    
    # Ek bilgiler
    city = Column(String(100), nullable=True)  # Şehir
    district = Column(String(100), nullable=True)  # İlçe
    postal_code = Column(String(20), nullable=True)  # Posta kodu
    
    # Durum
    is_default = Column(Boolean, default=False, nullable=False)  # Varsayılan adres
    is_active = Column(Boolean, default=True, nullable=False)  # Aktif mi
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", backref="addresses")

    def __repr__(self):
        return f"<CompanyAddress {self.name} - {self.company_id}>"
