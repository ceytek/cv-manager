"""
Agreement Template Model - Privacy/KVKK agreements
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class AgreementTemplate(Base):
    """Agreement Template model for interview consent forms"""
    __tablename__ = "agreement_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="agreement_templates")
    creator = relationship("User", backref="created_agreements")
    jobs = relationship("Job", back_populates="agreement_template")

    def __repr__(self):
        return f"<AgreementTemplate(id={self.id}, name={self.name})>"


