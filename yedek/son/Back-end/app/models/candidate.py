"""
Candidate Model - CV Management
Stores uploaded candidate information
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.core.database import Base


class CandidateStatus(str, enum.Enum):
    """Candidate application status"""
    NEW = "new"
    REVIEWING = "reviewing"
    INTERVIEWED = "interviewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Candidate(Base):
    """
    Candidate Model - Represents uploaded CVs
    
    Stores parsed CV information and file metadata.
    Each candidate is associated with a department.
    """
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    
    # Personal Information (parsed from CV)
    name = Column(String(255), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    
    # CV File Information
    cv_file_name = Column(String(500), nullable=False)
    cv_file_path = Column(String(1000), nullable=False)
    cv_file_size = Column(Integer, nullable=False)  # in bytes
    
    # Parsed CV Content
    cv_text = Column(Text, nullable=True)  # Full text extracted from CV
    parsed_data = Column(JSONB, nullable=True)  # AI-parsed structured data
    cv_language = Column(String(10), nullable=True, index=True)  # CV language (TR, EN, DE, etc.)
    cv_photo_path = Column(String(500), nullable=True)  # Path to extracted photo from CV
    # Candidate location (city or free-form from CV personal info)
    location = Column(String(255), nullable=True, index=True)
    # Derived/normalized fields
    # birth_year stores the 4-digit year of birth (e.g., 1985). UI computes current age.
    birth_year = Column(Integer, nullable=True, index=True)
    experience_months = Column(Integer, nullable=True, index=True)  # total months of experience
    
    # Status
    status = Column(
        SQLEnum(CandidateStatus),
        default=CandidateStatus.NEW,
        nullable=False,
        index=True
    )
    
    # Department Association
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False, index=True)
    # Multi-tenancy
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id'), nullable=True, index=True)
    # Batch tracking
    batch_number = Column(String(20), nullable=True, index=True)
    
    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    department = relationship("Department", back_populates="candidates")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="candidate", cascade="all, delete-orphan")
    likert_sessions = relationship("LikertSession", back_populates="candidate", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Candidate(id={self.id}, name={self.name}, department_id={self.department_id})>"

