"""
GraphQL Types for Interview Module
"""
import strawberry
from typing import Optional, List

from app.modules.agreement.types import AgreementTemplateType


# ============================================
# Basic Types
# ============================================

@strawberry.type
class InterviewQuestionType:
    """Interview question type"""
    id: str
    template_id: Optional[str] = strawberry.field(name="templateId", default=None)
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder")
    time_limit: int = strawberry.field(name="timeLimit", default=120)
    is_ai_generated: bool = strawberry.field(name="isAiGenerated", default=False)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)


@strawberry.type
class InterviewAnswerType:
    """Interview answer type"""
    id: str
    session_id: str = strawberry.field(name="sessionId")
    question_id: str = strawberry.field(name="questionId")
    answer_text: Optional[str] = strawberry.field(name="answerText", default=None)
    video_url: Optional[str] = strawberry.field(name="videoUrl", default=None)
    duration_seconds: Optional[int] = strawberry.field(name="durationSeconds", default=None)
    created_at: str = strawberry.field(name="createdAt")


@strawberry.type
class InterviewTemplateType:
    """Interview template type"""
    id: str
    name: str
    description: Optional[str] = None
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    language: str = "tr"
    duration_per_question: int = strawberry.field(name="durationPerQuestion", default=120)
    use_global_timer: bool = strawberry.field(name="useGlobalTimer", default=False)
    total_duration: Optional[int] = strawberry.field(name="totalDuration", default=None)
    is_active: bool = strawberry.field(name="isActive", default=True)
    question_count: int = strawberry.field(name="questionCount", default=0)
    questions: List[InterviewQuestionType] = strawberry.field(default_factory=list)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.type
class InterviewSessionType:
    """Interview session type"""
    id: str
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    application_id: Optional[str] = strawberry.field(name="applicationId", default=None)
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    invitation_sent_at: Optional[str] = strawberry.field(name="invitationSentAt", default=None)
    invitation_email: Optional[str] = strawberry.field(name="invitationEmail", default=None)
    agreement_accepted_at: Optional[str] = strawberry.field(name="agreementAcceptedAt", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    # Note: job and candidate are not included here to avoid circular imports
    # Use InterviewSessionFullType for detailed session info with nested objects
    questions: List[InterviewQuestionType] = strawberry.field(default_factory=list)
    answers: List[InterviewAnswerType] = strawberry.field(default_factory=list)


# ============================================
# Input Types
# ============================================

@strawberry.input
class InterviewTemplateInput:
    """Input for creating/updating interview template"""
    name: str
    description: Optional[str] = None
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    language: str = "tr"
    duration_per_question: int = strawberry.field(name="durationPerQuestion", default=120)
    use_global_timer: bool = strawberry.field(name="useGlobalTimer", default=False)
    total_duration: Optional[int] = strawberry.field(name="totalDuration", default=None)
    questions: List['InterviewQuestionInput'] = strawberry.field(default_factory=list)


@strawberry.input
class InterviewQuestionInput:
    """Input for interview question"""
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder", default=1)
    time_limit: int = strawberry.field(name="timeLimit", default=120)


@strawberry.input
class CreateInterviewSessionInput:
    """Input for creating interview session"""
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    application_id: str = strawberry.field(name="applicationId")
    email: Optional[str] = None


@strawberry.input
class SaveInterviewAnswerInput:
    """Input for saving interview answer"""
    session_token: str = strawberry.field(name="sessionToken")
    question_id: str = strawberry.field(name="questionId")
    answer_text: Optional[str] = strawberry.field(name="answerText", default=None)
    video_url: Optional[str] = strawberry.field(name="videoUrl", default=None)
    duration_seconds: Optional[int] = strawberry.field(name="durationSeconds", default=None)


# ============================================
# Response Types
# ============================================

@strawberry.type
class InterviewTemplateResponse:
    """Response for interview template mutations"""
    success: bool
    message: Optional[str] = None
    template: Optional[InterviewTemplateType] = None


@strawberry.type
class InterviewSessionResponse:
    """Response for interview session mutations"""
    success: bool
    message: Optional[str] = None
    interview_link: Optional[str] = strawberry.field(name="interviewLink", default=None)
    session: Optional[InterviewSessionType] = None


@strawberry.type
class InterviewAnswerResponse:
    """Response for interview answer mutations"""
    success: bool
    message: Optional[str] = None
    answer: Optional[InterviewAnswerType] = None


# ============================================
# Full Session Types for Public Access (Candidates)
# ============================================

@strawberry.type
class InterviewCandidateType:
    """Simplified candidate type for interview page"""
    id: str
    name: str
    cv_photo_path: Optional[str] = strawberry.field(name="cvPhotoPath", default=None)
    cv_language: Optional[str] = strawberry.field(name="cvLanguage", default=None)


@strawberry.type
class InterviewJobType:
    """Job type with interview-specific fields"""
    id: str
    title: str
    description: Optional[str] = None
    description_plain: Optional[str] = strawberry.field(name="descriptionPlain", default=None)
    requirements: Optional[str] = None
    requirements_plain: Optional[str] = strawberry.field(name="requirementsPlain", default=None)
    location: Optional[str] = None
    remote_policy: Optional[str] = strawberry.field(name="remotePolicy", default=None)
    employment_type: Optional[str] = strawberry.field(name="employmentType", default=None)
    experience_level: Optional[str] = strawberry.field(name="experienceLevel", default=None)
    interview_enabled: bool = strawberry.field(name="interviewEnabled", default=False)
    interview_duration_per_question: int = strawberry.field(name="interviewDurationPerQuestion", default=2)
    interview_total_questions: int = strawberry.field(name="interviewTotalQuestions", default=5)
    interview_deadline_hours: int = strawberry.field(name="interviewDeadlineHours", default=72)
    interview_intro_text: Optional[str] = strawberry.field(name="interviewIntroText", default=None)
    interview_language: str = strawberry.field(name="interviewLanguage", default="tr")
    use_global_timer: bool = strawberry.field(name="useGlobalTimer", default=False)
    total_duration: Optional[int] = strawberry.field(name="totalDuration", default=None)
    agreement_template_id: Optional[str] = strawberry.field(name="agreementTemplateId", default=None)
    agreement_template: Optional[AgreementTemplateType] = strawberry.field(name="agreementTemplate", default=None)
    # Note: department is not included to avoid circular import


@strawberry.type
class InterviewSessionFullType:
    """Full interview session type with nested objects for candidate view"""
    id: str
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    application_id: Optional[str] = strawberry.field(name="applicationId", default=None)
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    invitation_sent_at: Optional[str] = strawberry.field(name="invitationSentAt", default=None)
    invitation_email: Optional[str] = strawberry.field(name="invitationEmail", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    agreement_accepted_at: Optional[str] = strawberry.field(name="agreementAcceptedAt", default=None)
    job: Optional[InterviewJobType] = None
    candidate: Optional[InterviewCandidateType] = None
    questions: List[InterviewQuestionType] = strawberry.field(default_factory=list)


@strawberry.type
class InterviewAnswerWithQuestionType:
    """Interview answer with question details"""
    id: str
    question_id: str = strawberry.field(name="questionId")
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder")
    answer_text: Optional[str] = strawberry.field(name="answerText", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)


@strawberry.type
class InterviewSessionWithAnswersType:
    """Interview session with answers for HR view"""
    id: str
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    invitation_sent_at: Optional[str] = strawberry.field(name="invitationSentAt", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    template: Optional[InterviewTemplateType] = None
    job: Optional[InterviewJobType] = None
    candidate: Optional[InterviewCandidateType] = None
    answers: List[InterviewAnswerWithQuestionType] = strawberry.field(default_factory=list)


__all__ = [
    # Basic Types
    "InterviewQuestionType",
    "InterviewAnswerType",
    "InterviewTemplateType",
    "InterviewSessionType",
    # Input Types
    "InterviewTemplateInput",
    "InterviewQuestionInput",
    "CreateInterviewSessionInput",
    "SaveInterviewAnswerInput",
    # Response Types
    "InterviewTemplateResponse",
    "InterviewSessionResponse",
    "InterviewAnswerResponse",
    # Full Session Types
    "InterviewCandidateType",
    "InterviewJobType",
    "InterviewSessionFullType",
    "InterviewAnswerWithQuestionType",
    "InterviewSessionWithAnswersType",
]

