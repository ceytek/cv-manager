"""
Second Interview Models - HR Manual Interview System
2. Görüşme - İK ekibi tarafından manuel yapılan görüşme sistemi
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class SecondInterviewType(str, enum.Enum):
    """Interview type enum - Online veya Yüz Yüze"""
    ONLINE = "online"
    IN_PERSON = "in_person"


class SecondInterviewPlatform(str, enum.Enum):
    """Online interview platform enum"""
    ZOOM = "zoom"
    TEAMS = "teams"
    GOOGLE_MEET = "google_meet"


class SecondInterviewStatus(str, enum.Enum):
    """Second interview status enum"""
    INVITED = "invited"           # Davet gönderildi
    COMPLETED = "completed"       # Görüşme tamamlandı
    CANCELLED = "cancelled"       # İptal edildi
    NO_SHOW = "no_show"          # Aday gelmedi


class SecondInterviewOutcome(str, enum.Enum):
    """Second interview outcome enum - Görüşme sonucu"""
    PENDING = "pending"           # Henüz değerlendirilmedi
    PASSED = "passed"             # Geçti (Teklif sürecine yönlendirilecek)
    REJECTED = "rejected"         # Reddedildi
    PENDING_LIKERT = "pending_likert"  # Likert teste yönlendirildi


class SecondInterview(Base):
    """
    Second Interview model - 2. Görüşme kaydı
    İK ekibi tarafından manuel olarak planlanan ve gerçekleştirilen görüşmeler
    """
    __tablename__ = "second_interviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    application_id = Column(String(36), ForeignKey('applications.id', ondelete='CASCADE'), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Interview Type & Platform
    interview_type = Column(
        SQLEnum(SecondInterviewType, name='second_interview_type_enum', create_type=False),
        nullable=False,
        default=SecondInterviewType.ONLINE
    )
    platform = Column(
        SQLEnum(SecondInterviewPlatform, name='second_interview_platform_enum', create_type=False),
        nullable=True  # Sadece online için gerekli
    )
    
    # Meeting Details
    meeting_link = Column(String(512), nullable=True)  # Online görüşme linki
    location_address = Column(Text, nullable=True)     # Yüz yüze görüşme adresi
    
    # Schedule
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(String(10), nullable=False)  # "14:30" formatında
    
    # Invitation
    candidate_message = Column(Text, nullable=True)  # Adaya gönderilecek mesaj
    invitation_sent_at = Column(DateTime, nullable=True)
    
    # Status
    status = Column(
        SQLEnum(SecondInterviewStatus, name='second_interview_status_enum', create_type=False),
        nullable=False,
        default=SecondInterviewStatus.INVITED
    )
    
    # Feedback (Görüşme sonrası)
    feedback_notes = Column(Text, nullable=True)
    outcome = Column(
        SQLEnum(SecondInterviewOutcome, name='second_interview_outcome_enum', create_type=False),
        nullable=True,
        default=SecondInterviewOutcome.PENDING
    )
    feedback_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    feedback_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    application = relationship("Application", back_populates="second_interview")
    feedback_user = relationship("User", foreign_keys=[feedback_by])

    def __repr__(self):
        return f"<SecondInterview(id={self.id}, status={self.status}, outcome={self.outcome})>"
