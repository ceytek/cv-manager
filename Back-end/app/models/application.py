"""
Application model for storing CV-to-Job analysis results.
"""

from sqlalchemy import Column, String, Integer, Text, DateTime, Enum as SQLEnum, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import enum
import uuid

from app.core.database import Base


class ApplicationStatus(enum.Enum):
    """Status of a job application analysis."""
    PENDING = "pending"
    ANALYZED = "analyzed"
    REVIEWED = "reviewed"
    REJECTED = "rejected"
    ACCEPTED = "accepted"


class Application(Base):
    """
    Application model - stores AI analysis results for job-candidate pairs.
    
    Attributes:
        id: Unique UUID identifier
        job_id: Foreign key to jobs table
        candidate_id: Foreign key to candidates table
        analysis_data: JSONB containing detailed analysis results
        overall_score: Overall match score (0-100)
        status: Current status of the application
        analyzed_at: Timestamp when analysis was completed
        reviewed_at: Timestamp when application was reviewed
        reviewed_by: User ID who reviewed the application
        notes: Additional notes from reviewer
        created_at: Record creation timestamp
        updated_at: Last update timestamp
    """
    
    __tablename__ = "applications"
    
    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign keys
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    
    # Analysis data
    analysis_data = Column(JSONB, nullable=True, comment="Detailed AI analysis results")
    overall_score = Column(
        Integer, 
        nullable=True,
        comment="Overall match score (0-100)"
    )
    
    # Status
    status = Column(
        SQLEnum(ApplicationStatus, name="application_status"),
        nullable=False,
        default=ApplicationStatus.PENDING,
        comment="Current application status"
    )
    
    # Review data
    analyzed_at = Column(DateTime, nullable=True, comment="When AI analysis was completed")
    reviewed_at = Column(DateTime, nullable=True, comment="When application was reviewed by HR")
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True, comment="Reviewer notes")
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    
    # Constraints
    __table_args__ = (
        CheckConstraint('overall_score >= 0 AND overall_score <= 100', name='check_score_range'),
    )
    
    def __repr__(self):
        return f"<Application {self.id}: Job {self.job_id} - Candidate {self.candidate_id} (Score: {self.overall_score})>"
    
    @property
    def match_percentage(self) -> str:
        """Return formatted match percentage."""
        if self.overall_score is None:
            return "N/A"
        return f"{self.overall_score}%"
    
    @property
    def is_strong_match(self) -> bool:
        """Check if this is a strong match (score >= 70)."""
        return self.overall_score is not None and self.overall_score >= 70
    
    @property
    def is_analyzed(self) -> bool:
        """Check if analysis is complete."""
        return self.status != ApplicationStatus.PENDING
