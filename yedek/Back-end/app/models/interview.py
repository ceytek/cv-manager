"""
Interview Models - AI Interview System
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class InterviewSessionStatus(str, enum.Enum):
    """Interview session status enum"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"


class InterviewTemplate(Base):
    """Interview Template model - reusable interview configurations"""
    __tablename__ = "interview_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    intro_text = Column(Text, nullable=True)
    language = Column(String(5), nullable=False, default="tr")
    duration_per_question = Column(Integer, nullable=False, default=120)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="interview_templates")
    questions = relationship("InterviewQuestion", back_populates="template", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="interview_template")

    def __repr__(self):
        return f"<InterviewTemplate(id={self.id}, name={self.name})>"


class InterviewQuestion(Base):
    """Interview question model"""
    __tablename__ = "interview_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys - can belong to job directly or to template
    job_id = Column(String(36), ForeignKey('jobs.id', ondelete='CASCADE'), nullable=True, index=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey('interview_templates.id', ondelete='CASCADE'), nullable=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=True, index=True)
    
    # Question Content
    question_text = Column(Text, nullable=False)
    question_order = Column(Integer, default=1, nullable=False)
    time_limit = Column(Integer, default=120)  # seconds
    is_ai_generated = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    job = relationship("Job", back_populates="interview_questions")
    template = relationship("InterviewTemplate", back_populates="questions")
    answers = relationship("InterviewAnswer", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<InterviewQuestion {self.question_order}: {self.question_text[:50]}...>"


class InterviewSession(Base):
    """Interview session model - tracks candidate's interview progress"""
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    job_id = Column(String(36), ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey('applications.id', ondelete='CASCADE'), nullable=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=True, index=True)
    
    # Session Info
    token = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(20), default=InterviewSessionStatus.PENDING.value)
    
    # Invitation Info
    invitation_sent_at = Column(DateTime, nullable=True)
    invitation_email = Column(String(255), nullable=True)
    
    # Session Timing
    expires_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Agreement
    agreement_accepted_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    job = relationship("Job", back_populates="interview_sessions")
    candidate = relationship("Candidate", back_populates="interview_sessions")
    application = relationship("Application", back_populates="interview_session")
    answers = relationship("InterviewAnswer", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<InterviewSession(id={self.id}, status={self.status})>"


class InterviewAnswer(Base):
    """Interview answer model - stores candidate's answers"""
    __tablename__ = "interview_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    session_id = Column(String(36), ForeignKey('interview_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey('interview_questions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Answer Content
    answer_text = Column(Text, nullable=True)
    video_url = Column(String(512), nullable=True)
    audio_url = Column(String(512), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("InterviewQuestion", back_populates="answers")

    def __repr__(self):
        return f"<InterviewAnswer(session={self.session_id}, question={self.question_id})>"

