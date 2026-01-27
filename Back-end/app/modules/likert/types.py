"""
GraphQL Types for Likert Module
"""
import strawberry
from typing import Optional, List

from app.modules.agreement.types import AgreementTemplateType


# ============================================
# Basic Types
# ============================================

@strawberry.type
class LikertQuestionType:
    """Likert question type"""
    id: str
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder")
    is_reverse_scored: bool = strawberry.field(name="isReverseScored", default=False)


@strawberry.type
class LikertAnswerType:
    """Likert answer type"""
    id: str
    question_id: str = strawberry.field(name="questionId")
    score: int


@strawberry.type
class LikertTemplateType:
    """Likert template type"""
    id: str
    name: str
    description: Optional[str] = None
    scale_type: int = strawberry.field(name="scaleType", default=5)
    scale_labels: Optional[List[str]] = strawberry.field(name="scaleLabels", default=None)
    language: str = "tr"
    is_active: bool = strawberry.field(name="isActive", default=True)
    is_ai_generated: bool = strawberry.field(name="isAiGenerated", default=False)
    time_limit: Optional[int] = strawberry.field(name="timeLimit", default=None)  # Total time in seconds
    question_count: int = strawberry.field(name="questionCount", default=0)
    questions: List[LikertQuestionType] = strawberry.field(default_factory=list)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.type
class LikertSessionType:
    """Likert session type"""
    id: str
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    total_score: Optional[int] = strawberry.field(name="totalScore", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    template: Optional[LikertTemplateType] = None
    # Note: job and candidate are not included here to avoid circular imports
    # Use LikertSessionFullType for detailed session info with nested objects
    answers: List[LikertAnswerType] = strawberry.field(default_factory=list)


# ============================================
# Input Types
# ============================================

@strawberry.input
class LikertTemplateInput:
    """Input for creating/updating likert template"""
    name: str
    description: Optional[str] = None
    scale_type: int = strawberry.field(name="scaleType", default=5)
    scale_labels: Optional[List[str]] = strawberry.field(name="scaleLabels", default=None)
    language: str = "tr"
    time_limit: Optional[int] = strawberry.field(name="timeLimit", default=None)  # Total time in seconds
    is_ai_generated: bool = strawberry.field(name="isAiGenerated", default=False)
    questions: List['LikertQuestionInput'] = strawberry.field(default_factory=list)


@strawberry.input
class LikertQuestionInput:
    """Input for likert question"""
    id: Optional[str] = None  # Optional - only for updates
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder", default=1)
    is_reverse_scored: bool = strawberry.field(name="isReverseScored", default=False)


@strawberry.input
class CreateLikertSessionInput:
    """Input for creating likert session"""
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    application_id: str = strawberry.field(name="applicationId")


@strawberry.input
class LikertAnswerInput:
    """Input for likert answer submission"""
    question_id: str = strawberry.field(name="questionId")
    value: int


# ============================================
# Response Types
# ============================================

@strawberry.type
class LikertTemplateResponse:
    """Response for likert template mutations"""
    success: bool
    message: Optional[str] = None
    template: Optional[LikertTemplateType] = None


@strawberry.type
class LikertSessionResponse:
    """Response for likert session mutations"""
    success: bool
    message: Optional[str] = None
    likert_link: Optional[str] = strawberry.field(name="likertLink", default=None)
    session: Optional[LikertSessionType] = None


# ============================================
# Full Session Types for Public Access (Candidates)
# ============================================

@strawberry.type
class LikertJobType:
    """Job info for Likert session"""
    id: str
    title: str
    description: Optional[str] = None
    description_plain: Optional[str] = strawberry.field(name="descriptionPlain", default=None)
    location: Optional[str] = None
    agreement_template_id: Optional[str] = strawberry.field(name="agreementTemplateId", default=None)
    agreement_template: Optional[AgreementTemplateType] = strawberry.field(name="agreementTemplate", default=None)


@strawberry.type
class LikertCandidateType:
    """Candidate info for Likert session"""
    id: str
    name: str
    cv_photo_path: Optional[str] = strawberry.field(name="cvPhotoPath", default=None)
    email: Optional[str] = None


@strawberry.type
class LikertSessionFullType:
    """Full likert session type with nested objects for candidate view"""
    id: str
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    template: Optional[LikertTemplateType] = None
    job: Optional[LikertJobType] = None
    candidate: Optional[LikertCandidateType] = None


@strawberry.type
class LikertAnswerWithQuestionType:
    """Likert answer with question details"""
    id: str
    question_id: str = strawberry.field(name="questionId")
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder")
    score: int


@strawberry.type
class LikertSessionWithAnswersType:
    """Likert session with answers for HR view"""
    id: str
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    total_score: Optional[int] = strawberry.field(name="totalScore", default=None)
    template: Optional[LikertTemplateType] = None
    job: Optional[LikertJobType] = None
    candidate: Optional[LikertCandidateType] = None
    answers: List[LikertAnswerWithQuestionType] = strawberry.field(default_factory=list)


__all__ = [
    # Basic Types
    "LikertQuestionType",
    "LikertAnswerType",
    "LikertTemplateType",
    "LikertSessionType",
    # Input Types
    "LikertTemplateInput",
    "LikertQuestionInput",
    "CreateLikertSessionInput",
    "LikertAnswerInput",
    # Response Types
    "LikertTemplateResponse",
    "LikertSessionResponse",
    # Full Session Types
    "LikertJobType",
    "LikertCandidateType",
    "LikertSessionFullType",
    "LikertAnswerWithQuestionType",
    "LikertSessionWithAnswersType",
]

