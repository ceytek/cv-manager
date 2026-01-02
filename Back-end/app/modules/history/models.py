"""
History Models - Application Event Tracking System
Tracks all actions/events for candidates throughout the recruitment process.
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class ActionType(Base):
    """
    Action Type model - defines all possible actions/events in the system.
    Examples: cv_uploaded, likert_sent, likert_completed, interview_sent, 
              interview_completed, rejected, etc.
    """
    __tablename__ = "action_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)  # NULL = system-wide action
    
    code = Column(String(50), nullable=False, unique=True)  # e.g., 'cv_uploaded', 'rejected'
    name_tr = Column(String(100), nullable=False)  # Turkish name
    name_en = Column(String(100), nullable=False)  # English name
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # Icon name for UI
    color = Column(String(20), nullable=True)  # Color for UI (e.g., 'green', 'red', '#FF5733')
    is_system = Column(Boolean, default=True)  # True = system action, False = custom action
    sort_order = Column(Integer, default=0)  # For ordering in UI
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    history_entries = relationship("ApplicationHistory", back_populates="action_type")

    def __repr__(self):
        return f"<ActionType(code={self.code}, name_en={self.name_en})>"


class ApplicationHistory(Base):
    """
    Application History model - stores every action/event for a candidate's application.
    This is the single source of truth for tracking candidate progress.
    """
    __tablename__ = "application_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Multi-tenancy - ALWAYS required
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # References
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Action
    action_type_id = Column(UUID(as_uuid=True), ForeignKey("action_types.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Who performed the action (NULL = system/automatic)
    performed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Additional data for the action (flexible storage)
    # Examples: rejection_note, template_id, score, link, etc.
    action_data = Column(JSONB, nullable=True, default={})
    
    # Note/comment for this action
    note = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    company = relationship("Company")
    application = relationship("Application", back_populates="history_entries")
    candidate = relationship("Candidate")
    job = relationship("Job")
    action_type = relationship("ActionType", back_populates="history_entries")
    performed_by_user = relationship("User", foreign_keys=[performed_by])

    def __repr__(self):
        return f"<ApplicationHistory(application_id={self.application_id}, action={self.action_type_id}, created_at={self.created_at})>"


# Default system action types (will be seeded)
DEFAULT_ACTION_TYPES = [
    {
        "code": "cv_uploaded",
        "name_tr": "CV Yüklendi",
        "name_en": "CV Uploaded",
        "icon": "upload",
        "color": "blue",
        "sort_order": 1,
    },
    {
        "code": "cv_analyzed",
        "name_tr": "CV Analiz Edildi",
        "name_en": "CV Analyzed",
        "icon": "search",
        "color": "purple",
        "sort_order": 2,
    },
    {
        "code": "likert_sent",
        "name_tr": "Likert Testi Gönderildi",
        "name_en": "Likert Test Sent",
        "icon": "send",
        "color": "orange",
        "sort_order": 3,
    },
    {
        "code": "likert_started",
        "name_tr": "Likert Testi Başlatıldı",
        "name_en": "Likert Test Started",
        "icon": "play",
        "color": "orange",
        "sort_order": 4,
    },
    {
        "code": "likert_completed",
        "name_tr": "Likert Testi Tamamlandı",
        "name_en": "Likert Test Completed",
        "icon": "check-circle",
        "color": "green",
        "sort_order": 5,
    },
    {
        "code": "interview_sent",
        "name_tr": "Mülakat Daveti Gönderildi",
        "name_en": "Interview Invitation Sent",
        "icon": "video",
        "color": "blue",
        "sort_order": 6,
    },
    {
        "code": "interview_started",
        "name_tr": "Mülakat Başlatıldı",
        "name_en": "Interview Started",
        "icon": "play",
        "color": "blue",
        "sort_order": 7,
    },
    {
        "code": "interview_completed",
        "name_tr": "Mülakat Tamamlandı",
        "name_en": "Interview Completed",
        "icon": "check-circle",
        "color": "green",
        "sort_order": 8,
    },
    {
        "code": "rejected",
        "name_tr": "Reddedildi",
        "name_en": "Rejected",
        "icon": "x-circle",
        "color": "red",
        "sort_order": 100,
    },
    {
        "code": "hired",
        "name_tr": "İşe Alındı",
        "name_en": "Hired",
        "icon": "user-check",
        "color": "green",
        "sort_order": 101,
    },
    {
        "code": "note_added",
        "name_tr": "Not Eklendi",
        "name_en": "Note Added",
        "icon": "message-square",
        "color": "gray",
        "sort_order": 50,
    },
]

