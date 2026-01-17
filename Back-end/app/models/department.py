from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    # Remove global unique; enforce uniqueness per company via table args
    name = Column(String(100), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    # Department color (hex format like #3B82F6)
    color = Column(String(7), nullable=True, default=None)
    # Multi-tenancy (should be NOT NULL after migrations)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint('company_id', 'name', name='uq_department_company_name'),
    )
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    candidates = relationship("Candidate", back_populates="department")

    def __repr__(self):
        return f"<Department(id={self.id}, name={self.name})>"
