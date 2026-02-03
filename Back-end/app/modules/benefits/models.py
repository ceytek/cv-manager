"""
Benefit Model - Yan Haklar
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from .enums import BenefitCategory, ValuePeriod


class Benefit(Base):
    """
    Yan Hak modeli
    Şirketlerin adaylara sunabileceği yan hakları tanımlar
    """
    __tablename__ = "benefits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Benefit details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(BenefitCategory), nullable=False, default=BenefitCategory.FINANCIAL)
    
    # Value
    value = Column(Numeric(12, 2), nullable=True)  # NULL = Değişken
    value_period = Column(SQLEnum(ValuePeriod), nullable=True, default=ValuePeriod.MONTHLY)
    is_variable = Column(Boolean, default=False)  # True ise değer gösterilmez, "Değişken" yazılır
    
    # Icon (emoji or icon name)
    icon = Column(String(50), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="benefits")

    def __repr__(self):
        return f"<Benefit {self.name}>"
