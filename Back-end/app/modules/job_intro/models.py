"""
Job Intro Template Model - Job introduction/preamble templates
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class JobIntroTemplate(Base):
    """Job Intro Template model for job posting introductions"""
    __tablename__ = "job_intro_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String(255), nullable=False)  # Template name
    content = Column(Text, nullable=False)  # Intro text content
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="job_intro_templates")
    creator = relationship("User", backref="created_job_intros")

    def __repr__(self):
        return f"<JobIntroTemplate(id={self.id}, name={self.name})>"


