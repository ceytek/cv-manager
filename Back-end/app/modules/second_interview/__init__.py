"""
Second Interview Module - HR Manual Interview System
2. Görüşme modülü

Bu modül İK ekibi tarafından manuel olarak yapılan 2. görüşmeleri yönetir.
- Online (Zoom, Teams, Google Meet) veya yüz yüze görüşme desteği
- Davet gönderme ve takibi
- Geri bildirim sistemi
"""

from app.modules.second_interview.models import (
    SecondInterview,
    SecondInterviewType,
    SecondInterviewPlatform,
    SecondInterviewStatus,
    SecondInterviewOutcome
)

from app.modules.second_interview.types import (
    SecondInterviewType as SecondInterviewGQLType,
    SecondInterviewCandidateType,
    SecondInterviewJobType,
    SecondInterviewApplicationType,
    SecondInterviewFeedbackByType,
    SecondInterviewInviteInput,
    SecondInterviewFeedbackInput,
    SecondInterviewUpdateInput,
    SecondInterviewResponse,
)

from app.modules.second_interview.resolvers import (
    get_second_interview,
    get_second_interview_by_application,
    get_second_interviews_by_job,
    send_second_interview_invite,
    submit_second_interview_feedback,
    cancel_second_interview,
)

__all__ = [
    # Models
    'SecondInterview',
    'SecondInterviewType',
    'SecondInterviewPlatform',
    'SecondInterviewStatus',
    'SecondInterviewOutcome',
    # GQL Types
    'SecondInterviewGQLType',
    'SecondInterviewCandidateType',
    'SecondInterviewJobType',
    'SecondInterviewApplicationType',
    'SecondInterviewFeedbackByType',
    'SecondInterviewInviteInput',
    'SecondInterviewFeedbackInput',
    'SecondInterviewUpdateInput',
    'SecondInterviewResponse',
    # Resolvers
    'get_second_interview',
    'get_second_interview_by_application',
    'get_second_interviews_by_job',
    'send_second_interview_invite',
    'submit_second_interview_feedback',
    'cancel_second_interview',
]
