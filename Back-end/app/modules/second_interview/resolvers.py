"""
GraphQL Resolvers for Second Interview Module
2. Görüşme - İK Manual Interview Resolvers
"""
from typing import List, Optional
from datetime import datetime, date

from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType
from app.modules.second_interview.models import (
    SecondInterview,
    SecondInterviewType as InterviewTypeEnum,
    SecondInterviewPlatform,
    SecondInterviewStatus,
    SecondInterviewOutcome
)
from app.modules.second_interview.types import (
    SecondInterviewType,
    SecondInterviewInviteInput,
    SecondInterviewFeedbackInput,
    SecondInterviewResponse,
    SecondInterviewCandidateType,
    SecondInterviewJobType,
    SecondInterviewApplicationType,
    SecondInterviewFeedbackByType,
)
from app.models.application import Application, ApplicationStatus
from app.modules.history.models import ApplicationHistory, ActionType


def _get_auth_info(info: Info):
    """Helper to extract auth info from request"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    return token


def _build_second_interview_type(interview: SecondInterview) -> SecondInterviewType:
    """Helper to build SecondInterviewType from model"""
    
    # Build application info with candidate and job
    application_type = None
    if interview.application:
        app = interview.application
        
        candidate_type = None
        if app.candidate:
            candidate_type = SecondInterviewCandidateType(
                id=str(app.candidate.id),
                name=app.candidate.name or "",
                email=app.candidate.email,
                phone=app.candidate.phone,
                cv_photo_path=app.candidate.cv_photo_path,
            )
        
        job_type = None
        if app.job:
            job_type = SecondInterviewJobType(
                id=str(app.job.id),
                title=app.job.title,
            )
        
        application_type = SecondInterviewApplicationType(
            id=str(app.id),
            overall_score=app.overall_score,
            candidate=candidate_type,
            job=job_type,
        )
    
    # Build feedback by user info
    feedback_by_type = None
    if interview.feedback_user:
        feedback_by_type = SecondInterviewFeedbackByType(
            id=interview.feedback_user.id,
            full_name=interview.feedback_user.full_name or "",
        )
    
    return SecondInterviewType(
        id=str(interview.id),
        interview_type=interview.interview_type.value if interview.interview_type else "online",
        platform=interview.platform.value if interview.platform else None,
        meeting_link=interview.meeting_link,
        location_address=interview.location_address,
        scheduled_date=interview.scheduled_date.isoformat() if interview.scheduled_date else "",
        scheduled_time=interview.scheduled_time or "",
        candidate_message=interview.candidate_message,
        invitation_sent_at=interview.invitation_sent_at.isoformat() if interview.invitation_sent_at else None,
        status=interview.status.value if interview.status else "invited",
        outcome=interview.outcome.value if interview.outcome else None,
        feedback_notes=interview.feedback_notes,
        feedback_at=interview.feedback_at.isoformat() if interview.feedback_at else None,
        feedback_by=feedback_by_type,
        created_at=interview.created_at.isoformat() if interview.created_at else None,
        updated_at=interview.updated_at.isoformat() if interview.updated_at else None,
        application=application_type,
    )


# ============================================
# Query Resolvers
# ============================================

def get_second_interview(info: Info, id: str) -> Optional[SecondInterviewType]:
    """Get a single second interview by ID"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        interview = db.query(SecondInterview).filter(
            SecondInterview.id == id,
            SecondInterview.company_id == company_id
        ).first()
        
        if not interview:
            return None
        
        return _build_second_interview_type(interview)
    finally:
        db.close()


def get_second_interview_by_application(info: Info, application_id: str) -> Optional[SecondInterviewType]:
    """Get the most recent/active second interview for a specific application"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        # First try to find an active interview (invited status)
        interview = db.query(SecondInterview).filter(
            SecondInterview.application_id == application_id,
            SecondInterview.company_id == company_id,
            SecondInterview.status == SecondInterviewStatus.INVITED
        ).order_by(SecondInterview.scheduled_date.desc()).first()
        
        # If no active, get the most recent one
        if not interview:
            interview = db.query(SecondInterview).filter(
                SecondInterview.application_id == application_id,
                SecondInterview.company_id == company_id
            ).order_by(SecondInterview.created_at.desc()).first()
        
        if not interview:
            return None
        
        return _build_second_interview_type(interview)
    finally:
        db.close()


def get_all_interviews_by_application(info: Info, application_id: str) -> List[SecondInterviewType]:
    """Get all interviews for a specific application"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        interviews = db.query(SecondInterview).filter(
            SecondInterview.application_id == application_id,
            SecondInterview.company_id == company_id
        ).order_by(SecondInterview.scheduled_date.desc()).all()
        
        return [_build_second_interview_type(i) for i in interviews]
    finally:
        db.close()


def check_active_interview(info: Info, application_id: str) -> Optional[SecondInterviewType]:
    """Check if there's an active interview (not completed/cancelled and date not passed)"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        today = date.today()
        
        # Find interview that is:
        # 1. Status is 'invited' (not completed, cancelled, or no_show)
        # 2. Scheduled date is today or in the future
        active_interview = db.query(SecondInterview).filter(
            SecondInterview.application_id == application_id,
            SecondInterview.company_id == company_id,
            SecondInterview.status == SecondInterviewStatus.INVITED,
            SecondInterview.scheduled_date >= today
        ).first()
        
        if not active_interview:
            return None
        
        return _build_second_interview_type(active_interview)
    finally:
        db.close()


def get_second_interviews_by_job(info: Info, job_id: str) -> List[SecondInterviewType]:
    """Get all second interviews for a specific job"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        # Get applications for this job, then their second interviews
        interviews = db.query(SecondInterview).join(
            Application, SecondInterview.application_id == Application.id
        ).filter(
            Application.job_id == job_id,
            SecondInterview.company_id == company_id
        ).order_by(SecondInterview.scheduled_date.desc()).all()
        
        return [_build_second_interview_type(i) for i in interviews]
    finally:
        db.close()


# ============================================
# Mutation Resolvers
# ============================================

async def send_second_interview_invite(
    info: Info, 
    input: SecondInterviewInviteInput
) -> SecondInterviewResponse:
    """Send second interview invitation to a candidate"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        current_user = get_current_user_from_token(token, db)
        
        # Check if application exists and belongs to company
        application = db.query(Application).filter(
            Application.id == input.application_id,
            Application.company_id == company_id
        ).first()
        
        if not application:
            return SecondInterviewResponse(
                success=False,
                message="Application not found"
            )
        
        # Check if there's an active interview (not completed and date not passed)
        today = date.today()
        active_interview = db.query(SecondInterview).filter(
            SecondInterview.application_id == input.application_id,
            SecondInterview.status == SecondInterviewStatus.INVITED,
            SecondInterview.scheduled_date >= today
        ).first()
        
        if active_interview:
            return SecondInterviewResponse(
                success=False,
                message="Candidate has an active interview scheduled for " + str(active_interview.scheduled_date)
            )
        
        # Count existing interviews to determine interview number
        existing_interview_count = db.query(SecondInterview).filter(
            SecondInterview.application_id == input.application_id,
            SecondInterview.company_id == company_id
        ).count()
        interview_number = existing_interview_count + 1
        
        # Parse interview type
        interview_type = InterviewTypeEnum.ONLINE
        if input.interview_type == "in_person":
            interview_type = InterviewTypeEnum.IN_PERSON
        
        # Parse platform (only for online)
        platform = None
        if interview_type == InterviewTypeEnum.ONLINE and input.platform:
            platform_map = {
                "zoom": SecondInterviewPlatform.ZOOM,
                "teams": SecondInterviewPlatform.TEAMS,
                "google_meet": SecondInterviewPlatform.GOOGLE_MEET,
            }
            platform = platform_map.get(input.platform)
        
        # Parse date
        try:
            scheduled_date = date.fromisoformat(input.scheduled_date)
        except ValueError:
            return SecondInterviewResponse(
                success=False,
                message="Invalid date format. Use YYYY-MM-DD"
            )
        
        # Create second interview
        second_interview = SecondInterview(
            application_id=input.application_id,
            company_id=company_id,
            interview_type=interview_type,
            platform=platform,
            meeting_link=input.meeting_link if interview_type == InterviewTypeEnum.ONLINE else None,
            location_address=input.location_address if interview_type == InterviewTypeEnum.IN_PERSON else None,
            scheduled_date=scheduled_date,
            scheduled_time=input.scheduled_time,
            candidate_message=input.candidate_message,
            invitation_sent_at=datetime.utcnow(),
            status=SecondInterviewStatus.INVITED,
            outcome=SecondInterviewOutcome.PENDING,
        )
        
        db.add(second_interview)
        
        # Update application status
        application.status = ApplicationStatus.SECOND_INTERVIEW_INVITED
        
        # Add history entry
        action_type = db.query(ActionType).filter(ActionType.code == "second_interview_sent").first()
        if action_type:
            history_entry = ApplicationHistory(
                company_id=company_id,
                application_id=application.id,
                candidate_id=application.candidate_id,
                job_id=application.job_id,
                action_type_id=action_type.id,
                performed_by=current_user.id if current_user else None,
                action_data={
                    "interview_number": interview_number,
                    "interview_type": interview_type.value,
                    "platform": platform.value if platform else None,
                    "scheduled_date": input.scheduled_date,
                    "scheduled_time": input.scheduled_time,
                    "meeting_link": input.meeting_link if interview_type == InterviewTypeEnum.ONLINE else None,
                    "location_address": input.location_address if interview_type == InterviewTypeEnum.IN_PERSON else None,
                }
            )
            db.add(history_entry)
        
        db.commit()
        db.refresh(second_interview)
        
        # TODO: Send email/SMS notification to candidate
        # This will be implemented later
        
        return SecondInterviewResponse(
            success=True,
            message="Second interview invitation sent successfully",
            second_interview=_build_second_interview_type(second_interview)
        )
        
    except Exception as e:
        db.rollback()
        return SecondInterviewResponse(
            success=False,
            message=f"Error sending invitation: {str(e)}"
        )
    finally:
        db.close()


async def submit_second_interview_feedback(
    info: Info,
    input: SecondInterviewFeedbackInput
) -> SecondInterviewResponse:
    """Submit feedback for a completed second interview"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        current_user = get_current_user_from_token(token, db)
        
        # Get the second interview
        interview = db.query(SecondInterview).filter(
            SecondInterview.id == input.id,
            SecondInterview.company_id == company_id
        ).first()
        
        if not interview:
            return SecondInterviewResponse(
                success=False,
                message="Second interview not found"
            )
        
        # Parse status
        status_map = {
            "completed": SecondInterviewStatus.COMPLETED,
            "cancelled": SecondInterviewStatus.CANCELLED,
            "no_show": SecondInterviewStatus.NO_SHOW,
        }
        new_status = status_map.get(input.status, SecondInterviewStatus.COMPLETED)
        
        # Parse outcome (only if completed)
        new_outcome = None
        if new_status == SecondInterviewStatus.COMPLETED and input.outcome:
            outcome_map = {
                "passed": SecondInterviewOutcome.PASSED,
                "rejected": SecondInterviewOutcome.REJECTED,
                "pending_likert": SecondInterviewOutcome.PENDING_LIKERT,
            }
            new_outcome = outcome_map.get(input.outcome)
        
        # Update interview
        interview.status = new_status
        interview.outcome = new_outcome
        interview.feedback_notes = input.feedback_notes
        interview.feedback_by = current_user.id
        interview.feedback_at = datetime.utcnow()
        
        # Count interviews to determine the interview number for this interview
        interview_number = db.query(SecondInterview).filter(
            SecondInterview.application_id == interview.application_id,
            SecondInterview.company_id == company_id,
            SecondInterview.created_at <= interview.created_at
        ).count()
        
        # Update application status based on outcome
        application = interview.application
        if application:
            if new_status == SecondInterviewStatus.COMPLETED:
                application.status = ApplicationStatus.SECOND_INTERVIEW_COMPLETED
                
                # If rejected, update application status
                if new_outcome == SecondInterviewOutcome.REJECTED:
                    application.status = ApplicationStatus.REJECTED
                # If pending likert, update to likert invited
                elif new_outcome == SecondInterviewOutcome.PENDING_LIKERT:
                    application.status = ApplicationStatus.LIKERT_INVITED
            elif new_status == SecondInterviewStatus.NO_SHOW:
                # Keep as invited so they can be invited again
                application.status = ApplicationStatus.SECOND_INTERVIEW_INVITED
            
            # Add history entry based on status
            if new_status == SecondInterviewStatus.NO_SHOW:
                # No show - use separate action type
                action_type = db.query(ActionType).filter(ActionType.code == "second_interview_no_show").first()
                if action_type:
                    history_entry = ApplicationHistory(
                        company_id=company_id,
                        application_id=application.id,
                        candidate_id=application.candidate_id,
                        job_id=application.job_id,
                        action_type_id=action_type.id,
                        performed_by=current_user.id if current_user else None,
                        action_data={
                            "interview_number": interview_number,
                            "status": input.status,
                            "feedback_notes": input.feedback_notes,
                        }
                    )
                    db.add(history_entry)
            else:
                # Completed or other status
                action_type = db.query(ActionType).filter(ActionType.code == "second_interview_completed").first()
                if action_type:
                    # Build outcome text for history
                    outcome_texts = {
                        "passed": "Başarılı - Teklif Aşamasına Geçirildi",
                        "rejected": "Reddedildi",
                        "pending_likert": "Likert Teste Yönlendirildi",
                    }
                    outcome_text = outcome_texts.get(input.outcome, input.outcome) if input.outcome else None
                    
                    history_entry = ApplicationHistory(
                        company_id=company_id,
                        application_id=application.id,
                        candidate_id=application.candidate_id,
                        job_id=application.job_id,
                        action_type_id=action_type.id,
                        performed_by=current_user.id if current_user else None,
                        action_data={
                            "interview_number": interview_number,
                            "status": input.status,
                            "outcome": input.outcome,
                            "outcome_text": outcome_text,
                            "feedback_notes": input.feedback_notes,
                        }
                    )
                    db.add(history_entry)
        
        db.commit()
        db.refresh(interview)
        
        return SecondInterviewResponse(
            success=True,
            message="Feedback submitted successfully",
            second_interview=_build_second_interview_type(interview)
        )
        
    except Exception as e:
        db.rollback()
        return SecondInterviewResponse(
            success=False,
            message=f"Error submitting feedback: {str(e)}"
        )
    finally:
        db.close()


async def cancel_second_interview(info: Info, id: str) -> SecondInterviewResponse:
    """Cancel a second interview"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        interview = db.query(SecondInterview).filter(
            SecondInterview.id == id,
            SecondInterview.company_id == company_id
        ).first()
        
        if not interview:
            return SecondInterviewResponse(
                success=False,
                message="Second interview not found"
            )
        
        if interview.status == SecondInterviewStatus.COMPLETED:
            return SecondInterviewResponse(
                success=False,
                message="Cannot cancel a completed interview"
            )
        
        interview.status = SecondInterviewStatus.CANCELLED
        
        # Reset application status back to interview completed
        if interview.application:
            interview.application.status = ApplicationStatus.INTERVIEW_COMPLETED
        
        # Count interviews to determine the interview number
        interview_number = db.query(SecondInterview).filter(
            SecondInterview.application_id == interview.application_id,
            SecondInterview.company_id == company_id,
            SecondInterview.created_at <= interview.created_at
        ).count()
        
        # Add history entry for cancellation
        action_type = db.query(ActionType).filter(ActionType.code == "second_interview_cancelled").first()
        if action_type and interview.application:
            current_user = get_current_user_from_token(token, db)
            history_entry = ApplicationHistory(
                company_id=company_id,
                application_id=interview.application_id,
                candidate_id=interview.application.candidate_id,
                job_id=interview.application.job_id,
                action_type_id=action_type.id,
                performed_by=current_user.id if current_user else None,
                action_data={
                    "interview_number": interview_number,
                    "interview_type": interview.interview_type.value if interview.interview_type else None,
                    "scheduled_date": str(interview.scheduled_date) if interview.scheduled_date else None,
                    "scheduled_time": interview.scheduled_time,
                }
            )
            db.add(history_entry)
        
        db.commit()
        db.refresh(interview)
        
        return SecondInterviewResponse(
            success=True,
            message="Second interview cancelled",
            second_interview=_build_second_interview_type(interview)
        )
        
    except Exception as e:
        db.rollback()
        return SecondInterviewResponse(
            success=False,
            message=f"Error cancelling interview: {str(e)}"
        )
    finally:
        db.close()


# ============================================
# Export
# ============================================

__all__ = [
    # Queries
    "get_second_interview",
    "get_second_interview_by_application",
    "get_all_interviews_by_application",
    "check_active_interview",
    "get_second_interviews_by_job",
    # Mutations
    "send_second_interview_invite",
    "submit_second_interview_feedback",
    "cancel_second_interview",
]
