"""
Likert Test Models - Personality/Fit Assessment System
"""
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class LikertTemplate(Base):
    """Likert Test Template model"""
    __tablename__ = "likert_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scale_type = Column(Integer, nullable=False, default=5)  # 3, 4, or 5 point scale
    scale_labels = Column(JSONB, nullable=False, default=["Kesinlikle Katılmıyorum", "Katılmıyorum", "Kararsızım", "Katılıyorum", "Kesinlikle Katılıyorum"])
    language = Column(String(5), nullable=False, default="tr")
    is_active = Column(Boolean, default=True)
    
    # Timer settings
    time_limit = Column(Integer, nullable=True)  # Total time limit in seconds (null = no limit)
    
    # Optional agreement template
    agreement_template_id = Column(String(36), ForeignKey("agreement_templates.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="likert_templates")
    creator = relationship("User", backref="created_likert_templates")
    questions = relationship("LikertQuestion", back_populates="template", cascade="all, delete-orphan", order_by="LikertQuestion.question_order")
    jobs = relationship("Job", back_populates="likert_template")
    sessions = relationship("LikertSession", back_populates="template", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LikertTemplate(id={self.id}, name={self.name})>"


class LikertQuestion(Base):
    """Likert question model"""
    __tablename__ = "likert_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("likert_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    question_text = Column(Text, nullable=False)
    question_order = Column(Integer, nullable=False, default=1)
    is_required = Column(Boolean, default=True)
    is_reverse_scored = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    template = relationship("LikertTemplate", back_populates="questions")
    answers = relationship("LikertAnswer", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LikertQuestion(order={self.question_order}, text={self.question_text[:30]}...)>"


class LikertSession(Base):
    """Likert test session model"""
    __tablename__ = "likert_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    template_id = Column(UUID(as_uuid=True), ForeignKey("likert_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Session Info
    token = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, in_progress, completed, expired
    
    # Timing
    expires_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Results
    total_score = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    template = relationship("LikertTemplate", back_populates="sessions")
    job = relationship("Job", back_populates="likert_sessions")
    candidate = relationship("Candidate", back_populates="likert_sessions")
    application = relationship("Application", back_populates="likert_session")
    answers = relationship("LikertAnswer", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LikertSession(id={self.id}, status={self.status})>"


class LikertAnswer(Base):
    """Likert answer model"""
    __tablename__ = "likert_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    session_id = Column(UUID(as_uuid=True), ForeignKey("likert_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("likert_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    
    selected_value = Column(Integer, nullable=False)  # 1-5 (or 1-3, 1-4 based on scale)
    score = Column(Integer, nullable=True)  # Same as selected_value, for compatibility
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("LikertSession", back_populates="answers")
    question = relationship("LikertQuestion", back_populates="answers")

    def __repr__(self):
        return f"<LikertAnswer(session={self.session_id}, score={self.selected_value})>"

