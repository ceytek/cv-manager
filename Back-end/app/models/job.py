"""
Job Model
Represents job postings in the system
Completely separate from User/Role/Department (only FK to department)
"""
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, Date, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base

# pgvector import (if available)
try:
    from pgvector.sqlalchemy import Vector
    VECTOR_AVAILABLE = True
except ImportError:
    VECTOR_AVAILABLE = False


class Job(Base):
    """Job posting model with AI matching fields"""
    __tablename__ = "jobs"

    # Primary Key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Multi-tenancy
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=True, index=True)

    # Basic Info
    title = Column(String(200), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey('departments.id'), nullable=False)

    # Intro Text (Preamble/Girizgah)
    intro_text = Column(Text, nullable=True)  # Optional job introduction text
    
    # Outro Text (What we offer / Conclusion)
    outro_text = Column(Text, nullable=True)  # Optional job conclusion text
    
    # Detailed Description (Rich Text)
    description = Column(Text, nullable=False)  # Job description (HTML format)
    requirements = Column(Text, nullable=False)  # Required qualifications (HTML format)
    
    # Plain text versions for AI matching/embeddings
    description_plain = Column(Text, nullable=True)
    requirements_plain = Column(Text, nullable=True)
    
    keywords = Column(ARRAY(String), default=list)  # ["Python", "Django", "AWS"]

    # Location & Work Type
    location = Column(String(100), nullable=False)  # "İstanbul", "Ankara", "Remote"
    remote_policy = Column(String(50), default='office')  # office/hybrid/remote
    employment_type = Column(String(50), default='full-time')  # full-time/part-time/contract/internship

    # Experience & Education
    experience_level = Column(String(50), default='mid')  # junior/mid/senior/lead
    required_education = Column(String(50), nullable=True)  # high_school/associate/bachelor/master/phd
    preferred_majors = Column(Text, nullable=True)  # "Computer Engineering, Software Engineering"
    required_languages = Column(JSONB, default=dict)  # {"English": "business", "German": "basic"}

    # Salary (Optional)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(3), default='TRY')

    # Dates & Status
    deadline = Column(Date, nullable=True)  # Application deadline
    start_date = Column(String(50), nullable=True)  # immediate/1month/3months/flexible
    status = Column(String(20), default='draft', index=True)  # draft/active/closed/archived
    is_active = Column(Boolean, default=True, index=True)

    # AI Interview Settings (Template-based)
    interview_enabled = Column(Boolean, default=False)
    interview_template_id = Column(UUID(as_uuid=True), ForeignKey('interview_templates.id', ondelete='SET NULL'), nullable=True)
    interview_deadline_hours = Column(Integer, default=72)
    
    # Agreement Template
    agreement_template_id = Column(UUID(as_uuid=True), ForeignKey('agreement_templates.id', ondelete='SET NULL'), nullable=True)
    
    # Likert Test Settings
    likert_enabled = Column(Boolean, default=False)
    likert_template_id = Column(UUID(as_uuid=True), ForeignKey('likert_templates.id', ondelete='SET NULL'), nullable=True)
    likert_deadline_hours = Column(Integer, default=72)
    
    # Disabled-friendly job flag (Engelli dostu ilan)
    is_disabled_friendly = Column(Boolean, default=False, index=True)

    # AI Embeddings (pgvector) - optional, for semantic search
    if VECTOR_AVAILABLE:
        description_embedding = Column(Vector(1536), nullable=True)  # OpenAI ada-002 dimension
        requirements_embedding = Column(Vector(1536), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    department = relationship("Department", foreign_keys=[department_id])
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    interview_questions = relationship("InterviewQuestion", back_populates="job", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="job", cascade="all, delete-orphan")
    interview_template = relationship("InterviewTemplate", back_populates="jobs")
    agreement_template = relationship("AgreementTemplate", back_populates="jobs")
    likert_template = relationship("LikertTemplate", back_populates="jobs")
    likert_sessions = relationship("LikertSession", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Job {self.title} ({self.status})>"
