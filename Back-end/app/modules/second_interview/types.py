"""
GraphQL Types for Second Interview Module
2. Görüşme - İK Manual Interview Types
"""
import strawberry
from typing import Optional
from enum import Enum


# ============================================
# Enum Types
# ============================================

@strawberry.enum
class SecondInterviewTypeEnum(Enum):
    """Interview type - Online veya Yüz Yüze"""
    ONLINE = "online"
    IN_PERSON = "in_person"


@strawberry.enum
class SecondInterviewPlatformEnum(Enum):
    """Online interview platform"""
    ZOOM = "zoom"
    TEAMS = "teams"
    GOOGLE_MEET = "google_meet"


@strawberry.enum
class SecondInterviewStatusEnum(Enum):
    """Interview status"""
    INVITED = "invited"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


@strawberry.enum
class SecondInterviewOutcomeEnum(Enum):
    """Interview outcome"""
    PENDING = "pending"
    PASSED = "passed"
    REJECTED = "rejected"
    PENDING_LIKERT = "pending_likert"


# ============================================
# Basic Types (Output)
# ============================================

@strawberry.type
class SecondInterviewCandidateType:
    """Candidate info for second interview display"""
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    cv_photo_path: Optional[str] = strawberry.field(name="cvPhotoPath", default=None)


@strawberry.type
class SecondInterviewJobType:
    """Job info for second interview display"""
    id: str
    title: str


@strawberry.type
class SecondInterviewApplicationType:
    """Application info for second interview"""
    id: str
    overall_score: Optional[int] = strawberry.field(name="overallScore", default=None)
    candidate: Optional[SecondInterviewCandidateType] = None
    job: Optional[SecondInterviewJobType] = None


@strawberry.type
class SecondInterviewFeedbackByType:
    """User who gave feedback"""
    id: int
    full_name: str = strawberry.field(name="fullName")


@strawberry.type
class SecondInterviewType:
    """Second Interview type - Main output type"""
    id: str
    
    # Interview details
    interview_type: str = strawberry.field(name="interviewType")
    platform: Optional[str] = None
    meeting_link: Optional[str] = strawberry.field(name="meetingLink", default=None)
    location_address: Optional[str] = strawberry.field(name="locationAddress", default=None)
    
    # Schedule
    scheduled_date: str = strawberry.field(name="scheduledDate")
    scheduled_time: str = strawberry.field(name="scheduledTime")
    
    # Invitation
    candidate_message: Optional[str] = strawberry.field(name="candidateMessage", default=None)
    invitation_sent_at: Optional[str] = strawberry.field(name="invitationSentAt", default=None)
    
    # Status
    status: str
    outcome: Optional[str] = None
    
    # Feedback
    feedback_notes: Optional[str] = strawberry.field(name="feedbackNotes", default=None)
    feedback_at: Optional[str] = strawberry.field(name="feedbackAt", default=None)
    feedback_by: Optional[SecondInterviewFeedbackByType] = strawberry.field(name="feedbackBy", default=None)
    
    # Timestamps
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)
    
    # Nested - Application with Candidate and Job info
    application: Optional[SecondInterviewApplicationType] = None


# ============================================
# Input Types
# ============================================

@strawberry.input
class SecondInterviewInviteInput:
    """Input for sending second interview invitation"""
    application_id: str = strawberry.field(name="applicationId")
    interview_type: str = strawberry.field(name="interviewType")  # online | in_person
    platform: Optional[str] = None  # zoom | teams | google_meet (for online)
    meeting_link: Optional[str] = strawberry.field(name="meetingLink", default=None)
    location_address: Optional[str] = strawberry.field(name="locationAddress", default=None)
    scheduled_date: str = strawberry.field(name="scheduledDate")  # YYYY-MM-DD
    scheduled_time: str = strawberry.field(name="scheduledTime")  # HH:MM
    candidate_message: Optional[str] = strawberry.field(name="candidateMessage", default=None)


@strawberry.input
class SecondInterviewFeedbackInput:
    """Input for submitting second interview feedback"""
    id: str  # Second interview ID
    status: str  # completed | cancelled | no_show
    outcome: Optional[str] = None  # passed | rejected | pending_likert
    feedback_notes: Optional[str] = strawberry.field(name="feedbackNotes", default=None)


@strawberry.input
class SecondInterviewUpdateInput:
    """Input for updating second interview details (reschedule etc.)"""
    id: str
    interview_type: Optional[str] = strawberry.field(name="interviewType", default=None)
    platform: Optional[str] = None
    meeting_link: Optional[str] = strawberry.field(name="meetingLink", default=None)
    location_address: Optional[str] = strawberry.field(name="locationAddress", default=None)
    scheduled_date: Optional[str] = strawberry.field(name="scheduledDate", default=None)
    scheduled_time: Optional[str] = strawberry.field(name="scheduledTime", default=None)
    candidate_message: Optional[str] = strawberry.field(name="candidateMessage", default=None)


# ============================================
# Response Types
# ============================================

@strawberry.type
class SecondInterviewResponse:
    """Response for second interview mutations"""
    success: bool
    message: Optional[str] = None
    second_interview: Optional[SecondInterviewType] = strawberry.field(name="secondInterview", default=None)


# ============================================
# Export
# ============================================

__all__ = [
    # Enums
    "SecondInterviewTypeEnum",
    "SecondInterviewPlatformEnum",
    "SecondInterviewStatusEnum",
    "SecondInterviewOutcomeEnum",
    # Basic Types
    "SecondInterviewCandidateType",
    "SecondInterviewJobType",
    "SecondInterviewApplicationType",
    "SecondInterviewFeedbackByType",
    "SecondInterviewType",
    # Input Types
    "SecondInterviewInviteInput",
    "SecondInterviewFeedbackInput",
    "SecondInterviewUpdateInput",
    # Response Types
    "SecondInterviewResponse",
]
