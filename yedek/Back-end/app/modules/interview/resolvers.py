"""
GraphQL Resolvers for Interview Module
"""
import secrets
from datetime import datetime, timedelta
from typing import List, Optional

from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType
from app.modules.agreement.types import AgreementTemplateType
from app.modules.interview.models import (
    InterviewTemplate,
    InterviewQuestion,
    InterviewSession,
    InterviewAnswer,
)
from app.modules.interview.types import (
    InterviewTemplateType,
    InterviewTemplateInput,
    InterviewTemplateResponse,
    InterviewQuestionType,
    InterviewSessionType,
    InterviewSessionResponse,
    InterviewAnswerType,
    InterviewAnswerResponse,
    CreateInterviewSessionInput,
    SaveInterviewAnswerInput,
    InterviewJobType,
    InterviewCandidateType,
    InterviewSessionFullType,
    InterviewAnswerWithQuestionType,
    InterviewSessionWithAnswersType,
)


# ============ Query Resolvers ============

def get_interview_templates(info: Info) -> List[InterviewTemplateType]:
    """Get all interview templates for the current company"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        templates = db.query(InterviewTemplate).filter(
            InterviewTemplate.company_id == company_id
        ).order_by(InterviewTemplate.created_at.desc()).all()
        
        return [
            InterviewTemplateType(
                id=str(t.id),
                name=t.name,
                description=t.description,
                intro_text=t.intro_text,
                language=t.language or "tr",
                duration_per_question=t.duration_per_question or 120,
                use_global_timer=t.use_global_timer or False,
                total_duration=t.total_duration,
                is_active=t.is_active,
                question_count=len(t.questions),
                questions=[],
                created_at=t.created_at.isoformat(),
                updated_at=t.updated_at.isoformat() if t.updated_at else None,
            ) for t in templates
        ]
    finally:
        db.close()


def get_interview_template(info: Info, id: str) -> Optional[InterviewTemplateType]:
    """Get a single interview template with questions"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(InterviewTemplate).filter(InterviewTemplate.id == id).first()
        if not template:
            return None
        
        return InterviewTemplateType(
            id=str(template.id),
            name=template.name,
            description=template.description,
            intro_text=template.intro_text,
            language=template.language or "tr",
            duration_per_question=template.duration_per_question or 120,
            use_global_timer=template.use_global_timer or False,
            total_duration=template.total_duration,
            is_active=template.is_active,
            question_count=len(template.questions),
            questions=[
                InterviewQuestionType(
                    id=q.id,
                    template_id=str(q.template_id) if q.template_id else None,
                    question_text=q.question_text,
                    question_order=q.question_order,
                    time_limit=q.time_limit or 120,
                    is_ai_generated=q.is_ai_generated or False,
                    created_at=q.created_at.isoformat(),
                ) for q in sorted(template.questions, key=lambda x: x.question_order)
            ],
            created_at=template.created_at.isoformat(),
            updated_at=template.updated_at.isoformat() if template.updated_at else None,
        )
    finally:
        db.close()


def get_interview_session(info: Info, token: str) -> Optional[InterviewSessionFullType]:
    """Get interview session by token (public - for candidates)"""
    from app.models.job import Job
    from app.models.candidate import Candidate
    from app.modules.agreement.models import AgreementTemplate
    
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
        if not session:
            return None
        
        job = db.query(Job).filter(Job.id == session.job_id).first()
        candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
        
        # Get interview template and questions from job
        questions = []
        template = None
        if job and job.interview_template_id:
            template = db.query(InterviewTemplate).filter(InterviewTemplate.id == job.interview_template_id).first()
            if template:
                db_questions = db.query(InterviewQuestion).filter(
                    InterviewQuestion.template_id == template.id
                ).order_by(InterviewQuestion.question_order).all()
                questions = [
                    InterviewQuestionType(
                        id=str(q.id),
                        question_text=q.question_text,
                        question_order=q.question_order,
                        time_limit=q.time_limit or (template.duration_per_question if template else 120),
                        is_ai_generated=q.is_ai_generated or False,
                    ) for q in db_questions
                ]
        
        # Get agreement template if exists
        agreement_template = None
        if job and job.agreement_template_id:
            agreement = db.query(AgreementTemplate).filter(AgreementTemplate.id == job.agreement_template_id).first()
            if agreement:
                agreement_template = AgreementTemplateType(
                    id=str(agreement.id),
                    name=agreement.name,
                    content=agreement.content,
                    is_active=agreement.is_active,
                    created_at=agreement.created_at.isoformat(),
                    updated_at=agreement.updated_at.isoformat() if agreement.updated_at else None,
                )
        
        job_type = None
        if job:
            # Get values from template or defaults
            duration_per_q = template.duration_per_question if template else 120
            total_questions = len(questions) if questions else 5
            intro_text = template.intro_text if template else None
            language = template.language if template else "tr"
            use_global_timer = template.use_global_timer if template else False
            total_duration = template.total_duration if template else None
            
            job_type = InterviewJobType(
                id=str(job.id),
                title=job.title,
                description=job.description,
                description_plain=job.description_plain,
                requirements=job.requirements,
                requirements_plain=job.requirements_plain,
                location=job.location,
                remote_policy=job.remote_policy,
                employment_type=job.employment_type,
                experience_level=job.experience_level,
                interview_enabled=job.interview_enabled or False,
                interview_duration_per_question=duration_per_q,
                interview_total_questions=total_questions,
                interview_deadline_hours=job.interview_deadline_hours or 72,
                interview_intro_text=intro_text,
                interview_language=language,
                use_global_timer=use_global_timer or False,
                total_duration=total_duration,
                agreement_template_id=str(job.agreement_template_id) if job.agreement_template_id else None,
                agreement_template=agreement_template,
            )
        
        candidate_type = None
        if candidate:
            candidate_type = InterviewCandidateType(
                id=str(candidate.id),
                name=candidate.name,
                cv_photo_path=candidate.cv_photo_path,
                cv_language=candidate.cv_language,
            )
        
        return InterviewSessionFullType(
            id=str(session.id),
            job_id=str(session.job_id),
            candidate_id=str(session.candidate_id),
            application_id=str(session.application_id) if session.application_id else None,
            token=session.token,
            status=session.status,
            expires_at=session.expires_at.isoformat() if session.expires_at else None,
            started_at=session.started_at.isoformat() if session.started_at else None,
            completed_at=session.completed_at.isoformat() if session.completed_at else None,
            invitation_sent_at=session.invitation_sent_at.isoformat() if session.invitation_sent_at else None,
            invitation_email=session.invitation_email,
            created_at=session.created_at.isoformat() if session.created_at else None,
            agreement_accepted_at=session.agreement_accepted_at.isoformat() if session.agreement_accepted_at else None,
            job=job_type,
            candidate=candidate_type,
            questions=questions,
        )
    finally:
        db.close()


def get_interview_session_by_application(info: Info, application_id: str) -> Optional[InterviewSessionWithAnswersType]:
    """Get interview session by application ID (for HR view with answers)"""
    from app.models.job import Job
    from app.models.candidate import Candidate
    
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.application_id == application_id).first()
        if not session:
            return None
        
        job = db.query(Job).filter(Job.id == session.job_id).first()
        candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
        answers = db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session.id).all()
        
        # Get template and questions
        template = None
        template_type = None
        questions_list = []
        if job and job.interview_template_id:
            template = db.query(InterviewTemplate).filter(InterviewTemplate.id == job.interview_template_id).first()
            if template:
                questions_list = db.query(InterviewQuestion).filter(
                    InterviewQuestion.template_id == template.id
                ).order_by(InterviewQuestion.question_order).all()
                
                template_type = InterviewTemplateType(
                    id=str(template.id),
                    name=template.name,
                    description=template.description,
                    intro_text=template.intro_text,
                    language=template.language or "tr",
                    duration_per_question=template.duration_per_question or 120,
                    use_global_timer=template.use_global_timer or False,
                    total_duration=template.total_duration,
                    is_active=template.is_active,
                    question_count=len(questions_list),
                    questions=[],
                    created_at=template.created_at.isoformat(),
                    updated_at=template.updated_at.isoformat() if template.updated_at else None,
                )
        
        job_type = None
        if job:
            duration_per_q = template.duration_per_question if template else 120
            total_questions = len(questions_list) if questions_list else 5
            intro_text = template.intro_text if template else None
            language = template.language if template else "tr"
            use_global_timer = template.use_global_timer if template else False
            total_duration = template.total_duration if template else None
            
            job_type = InterviewJobType(
                id=str(job.id),
                title=job.title,
                description=job.description,
                description_plain=job.description_plain,
                requirements=job.requirements,
                requirements_plain=job.requirements_plain,
                location=job.location,
                remote_policy=job.remote_policy,
                employment_type=job.employment_type,
                experience_level=job.experience_level,
                interview_enabled=job.interview_enabled or False,
                interview_duration_per_question=duration_per_q,
                interview_total_questions=total_questions,
                interview_deadline_hours=job.interview_deadline_hours or 72,
                interview_intro_text=intro_text,
                interview_language=language,
                use_global_timer=use_global_timer or False,
                total_duration=total_duration,
            )
        
        candidate_type = None
        if candidate:
            candidate_type = InterviewCandidateType(
                id=str(candidate.id),
                name=candidate.name,
                cv_photo_path=candidate.cv_photo_path,
                cv_language=candidate.cv_language,
            )
        
        # Build answers with question text
        answers_type = []
        for a in answers:
            q = next((q for q in questions_list if str(q.id) == str(a.question_id)), None)
            answers_type.append(InterviewAnswerWithQuestionType(
                id=str(a.id),
                question_id=str(a.question_id),
                question_text=q.question_text if q else "",
                question_order=q.question_order if q else 0,
                answer_text=a.answer_text,
                created_at=a.created_at.isoformat() if a.created_at else None,
            ))
        
        return InterviewSessionWithAnswersType(
            id=str(session.id),
            token=session.token,
            status=session.status,
            expires_at=session.expires_at.isoformat() if session.expires_at else None,
            started_at=session.started_at.isoformat() if session.started_at else None,
            completed_at=session.completed_at.isoformat() if session.completed_at else None,
            invitation_sent_at=session.invitation_sent_at.isoformat() if session.invitation_sent_at else None,
            created_at=session.created_at.isoformat() if session.created_at else None,
            template=template_type,
            job=job_type,
            candidate=candidate_type,
            answers=sorted(answers_type, key=lambda x: x.question_order),
        )
    finally:
        db.close()


# ============ Template Mutation Resolvers ============

async def create_interview_template(info: Info, input: InterviewTemplateInput) -> InterviewTemplateResponse:
    """Create a new interview template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        template = InterviewTemplate(
            company_id=company_id,
            name=input.name,
            description=input.description,
            intro_text=input.intro_text,
            language=input.language,
            duration_per_question=input.duration_per_question,
            use_global_timer=input.use_global_timer,
            total_duration=input.total_duration,
            is_active=True,
        )
        db.add(template)
        db.flush()
        
        for i, q in enumerate(input.questions):
            question = InterviewQuestion(
                template_id=template.id,
                company_id=company_id,
                question_text=q.question_text,
                question_order=i + 1,
                time_limit=q.time_limit or input.duration_per_question,
            )
            db.add(question)
        
        db.commit()
        db.refresh(template)
        
        return InterviewTemplateResponse(
            success=True,
            message="Template created successfully",
            template=InterviewTemplateType(
                id=str(template.id),
                name=template.name,
                description=template.description,
                intro_text=template.intro_text,
                language=template.language,
                duration_per_question=template.duration_per_question,
                use_global_timer=template.use_global_timer or False,
                total_duration=template.total_duration,
                is_active=template.is_active,
                question_count=len(template.questions),
                questions=[],
                created_at=template.created_at.isoformat(),
                updated_at=None,
            ),
        )
    except Exception as e:
        db.rollback()
        return InterviewTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def update_interview_template(info: Info, id: str, input: InterviewTemplateInput) -> InterviewTemplateResponse:
    """Update an interview template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(InterviewTemplate).filter(InterviewTemplate.id == id).first()
        if not template:
            return InterviewTemplateResponse(success=False, message="Template not found", template=None)
        
        template.name = input.name
        template.description = input.description
        template.intro_text = input.intro_text
        template.language = input.language
        template.duration_per_question = input.duration_per_question
        template.use_global_timer = input.use_global_timer
        template.total_duration = input.total_duration
        
        # Get existing questions
        existing_questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.template_id == template.id
        ).all()
        
        # Find questions that have answers (should not be deleted)
        questions_with_answers = set()
        for eq in existing_questions:
            answer_count = db.query(InterviewAnswer).filter(
                InterviewAnswer.question_id == eq.id
            ).count()
            if answer_count > 0:
                questions_with_answers.add(eq.id)
        
        # Only delete questions that have NO answers
        for eq in existing_questions:
            if eq.id not in questions_with_answers:
                db.delete(eq)
        
        # Update or create questions from input
        for i, q in enumerate(input.questions):
            # Try to find existing question by order or text to update
            existing_q = None
            for eq in existing_questions:
                if eq.id in questions_with_answers and eq.question_order == i + 1:
                    existing_q = eq
                    break
            
            if existing_q:
                # Update existing question (preserves question_id for answers)
                existing_q.question_text = q.question_text
                existing_q.question_order = i + 1
                existing_q.time_limit = q.time_limit or input.duration_per_question
            else:
                # Create new question
                question = InterviewQuestion(
                    template_id=template.id,
                    company_id=template.company_id,
                    question_text=q.question_text,
                    question_order=i + 1,
                    time_limit=q.time_limit or input.duration_per_question,
                )
                db.add(question)
        
        db.commit()
        db.refresh(template)
        
        return InterviewTemplateResponse(
            success=True,
            message="Template updated successfully",
            template=InterviewTemplateType(
                id=str(template.id),
                name=template.name,
                description=template.description,
                intro_text=template.intro_text,
                language=template.language,
                duration_per_question=template.duration_per_question,
                use_global_timer=template.use_global_timer or False,
                total_duration=template.total_duration,
                is_active=template.is_active,
                question_count=len(input.questions),
                questions=[],
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat() if template.updated_at else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return InterviewTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def delete_interview_template(info: Info, id: str) -> MessageType:
    """Delete an interview template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(InterviewTemplate).filter(InterviewTemplate.id == id).first()
        if not template:
            return MessageType(success=False, message="Template not found")
        
        db.delete(template)
        db.commit()
        return MessageType(success=True, message="Template deleted successfully")
    except Exception as e:
        db.rollback()
        return MessageType(success=False, message=str(e))
    finally:
        db.close()


async def toggle_interview_template(info: Info, id: str) -> InterviewTemplateResponse:
    """Toggle interview template active status"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(InterviewTemplate).filter(InterviewTemplate.id == id).first()
        if not template:
            return InterviewTemplateResponse(success=False, message="Template not found", template=None)
        
        template.is_active = not template.is_active
        db.commit()
        db.refresh(template)
        
        return InterviewTemplateResponse(
            success=True,
            message=f"Template {'activated' if template.is_active else 'deactivated'}",
            template=InterviewTemplateType(
                id=str(template.id),
                name=template.name,
                description=template.description,
                intro_text=template.intro_text,
                language=template.language,
                duration_per_question=template.duration_per_question,
                is_active=template.is_active,
                question_count=len(template.questions),
                questions=[],
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat() if template.updated_at else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return InterviewTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


# ============ Session Mutation Resolvers ============

async def create_interview_session(info: Info, input: CreateInterviewSessionInput) -> InterviewSessionResponse:
    """Create a new interview session for a candidate"""
    from app.models.job import Job
    
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    try:
        _, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        # Get job and validate interview is enabled
        job = db.query(Job).filter(Job.id == input.job_id).first()
        if not job:
            return InterviewSessionResponse(success=False, message="Job not found", interview_link=None, session=None)
        
        if not job.interview_enabled:
            return InterviewSessionResponse(success=False, message="Interview is not enabled for this job", interview_link=None, session=None)
        
        if not job.interview_template_id:
            return InterviewSessionResponse(success=False, message="No interview template configured for this job", interview_link=None, session=None)
        
        # Get template
        template = db.query(InterviewTemplate).filter(InterviewTemplate.id == job.interview_template_id).first()
        if not template:
            return InterviewSessionResponse(success=False, message="Interview template not found", interview_link=None, session=None)
        
        # Check if ANY session already exists (including completed)
        existing = db.query(InterviewSession).filter(
            InterviewSession.job_id == input.job_id,
            InterviewSession.candidate_id == input.candidate_id,
        ).first()
        
        if existing:
            base_url = request.headers.get("origin", "http://localhost:5173")
            interview_link = f"{base_url}/interview/{existing.token}"
            
            # Return appropriate message based on status
            if existing.status == 'completed':
                return InterviewSessionResponse(
                    success=True, 
                    message="Bu aday için mülakat zaten tamamlandı.", 
                    interview_link=interview_link,
                    session=InterviewSessionType(
                        id=str(existing.id),
                        job_id=str(existing.job_id),
                        candidate_id=str(existing.candidate_id),
                        application_id=str(existing.application_id) if existing.application_id else None,
                        token=existing.token,
                        status=existing.status,
                        expires_at=existing.expires_at.isoformat() if existing.expires_at else None,
                        created_at=existing.created_at.isoformat() if existing.created_at else None,
                    )
                )
            elif existing.status == 'expired':
                return InterviewSessionResponse(
                    success=True, 
                    message="Bu aday için mülakat daveti süresi dolmuş. Yeni davet oluşturulamaz.", 
                    interview_link=interview_link,
                    session=InterviewSessionType(
                        id=str(existing.id),
                        job_id=str(existing.job_id),
                        candidate_id=str(existing.candidate_id),
                        application_id=str(existing.application_id) if existing.application_id else None,
                        token=existing.token,
                        status=existing.status,
                        expires_at=existing.expires_at.isoformat() if existing.expires_at else None,
                        created_at=existing.created_at.isoformat() if existing.created_at else None,
                    )
                )
            else:
                # pending or in_progress - return existing link
                return InterviewSessionResponse(
                    success=True, 
                    message="Bu aday için mülakat daveti zaten gönderildi.", 
                    interview_link=interview_link,
                    session=InterviewSessionType(
                        id=str(existing.id),
                        job_id=str(existing.job_id),
                        candidate_id=str(existing.candidate_id),
                        application_id=str(existing.application_id) if existing.application_id else None,
                        token=existing.token,
                        status=existing.status,
                        expires_at=existing.expires_at.isoformat() if existing.expires_at else None,
                        created_at=existing.created_at.isoformat() if existing.created_at else None,
                    )
                )
        
        # Create new session
        session_token = secrets.token_urlsafe(32)
        deadline_hours = job.interview_deadline_hours or 72
        expires_at = datetime.utcnow() + timedelta(hours=deadline_hours)
        
        session = InterviewSession(
            job_id=input.job_id,
            candidate_id=input.candidate_id,
            application_id=input.application_id,
            company_id=company_id,
            token=session_token,
            status="pending",
            expires_at=expires_at,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        base_url = request.headers.get("origin", "http://localhost:5173")
        interview_link = f"{base_url}/interview/{session_token}"
        
        return InterviewSessionResponse(
            success=True,
            message="Interview invitation created successfully",
            interview_link=interview_link,
            session=InterviewSessionType(
                id=str(session.id),
                job_id=str(session.job_id),
                candidate_id=str(session.candidate_id),
                application_id=str(session.application_id) if session.application_id else None,
                token=session.token,
                status=session.status,
                expires_at=session.expires_at.isoformat(),
                created_at=session.created_at.isoformat(),
            )
        )
    except Exception as e:
        db.rollback()
        return InterviewSessionResponse(success=False, message=str(e), interview_link=None, session=None)
    finally:
        db.close()


async def start_interview_session(info: Info, token: str) -> InterviewSessionResponse:
    """Start an interview session (called when candidate begins)"""
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
        if not session:
            return InterviewSessionResponse(success=False, message="Session not found", interview_link=None, session=None)
        
        if session.status == 'completed':
            return InterviewSessionResponse(success=False, message="Session already completed", interview_link=None, session=None)
        
        if session.expires_at and session.expires_at < datetime.utcnow():
            return InterviewSessionResponse(success=False, message="Session expired", interview_link=None, session=None)
        
        session.status = "in_progress"
        session.started_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        
        return InterviewSessionResponse(
            success=True,
            message="Interview started successfully",
            interview_link=None,
            session=InterviewSessionType(
                id=str(session.id),
                job_id=str(session.job_id),
                candidate_id=str(session.candidate_id),
                application_id=str(session.application_id) if session.application_id else None,
                token=session.token,
                status=session.status,
                expires_at=session.expires_at.isoformat() if session.expires_at else None,
                started_at=session.started_at.isoformat() if session.started_at else None,
                created_at=session.created_at.isoformat() if session.created_at else None,
            )
        )
    except Exception as e:
        db.rollback()
        return InterviewSessionResponse(success=False, message=str(e), interview_link=None, session=None)
    finally:
        db.close()


async def save_interview_answer(info: Info, input: SaveInterviewAnswerInput) -> InterviewAnswerResponse:
    """Save an interview answer"""
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.token == input.session_token).first()
        if not session:
            return InterviewAnswerResponse(success=False, message="Session not found", answer=None)
        
        # Check if answer already exists
        existing = db.query(InterviewAnswer).filter(
            InterviewAnswer.session_id == session.id,
            InterviewAnswer.question_id == input.question_id
        ).first()
        
        if existing:
            existing.answer_text = input.answer_text
            existing.video_url = input.video_url
            existing.duration_seconds = input.duration_seconds
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            answer = existing
        else:
            answer = InterviewAnswer(
                session_id=session.id,
                question_id=input.question_id,
                answer_text=input.answer_text,
                video_url=input.video_url,
                duration_seconds=input.duration_seconds,
                status='submitted',
            )
            db.add(answer)
            db.commit()
            db.refresh(answer)
        
        return InterviewAnswerResponse(
            success=True,
            message="Answer saved successfully",
            answer=InterviewAnswerType(
                id=str(answer.id),
                session_id=str(answer.session_id),
                question_id=str(answer.question_id),
                answer_text=answer.answer_text,
                video_url=answer.video_url,
                duration_seconds=answer.duration_seconds,
                created_at=answer.created_at.isoformat() if answer.created_at else datetime.utcnow().isoformat(),
            )
        )
    except Exception as e:
        db.rollback()
        return InterviewAnswerResponse(success=False, message=str(e), answer=None)
    finally:
        db.close()


async def complete_interview_session(info: Info, token: str) -> InterviewSessionResponse:
    """Complete an interview session"""
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
        if not session:
            return InterviewSessionResponse(success=False, message="Session not found", interview_link=None, session=None)
        
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        
        return InterviewSessionResponse(
            success=True,
            message="Interview completed successfully",
            interview_link=None,
            session=InterviewSessionType(
                id=str(session.id),
                job_id=str(session.job_id),
                candidate_id=str(session.candidate_id),
                application_id=str(session.application_id) if session.application_id else None,
                token=session.token,
                status=session.status,
                expires_at=session.expires_at.isoformat() if session.expires_at else None,
                completed_at=session.completed_at.isoformat() if session.completed_at else None,
                created_at=session.created_at.isoformat() if session.created_at else None,
            )
        )
    except Exception as e:
        db.rollback()
        return InterviewSessionResponse(success=False, message=str(e), interview_link=None, session=None)
    finally:
        db.close()


async def accept_interview_agreement(info: Info, token: str) -> InterviewSessionResponse:
    """Accept interview agreement"""
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
        if not session:
            return InterviewSessionResponse(success=False, message="Session not found", interview_link=None, session=None)
        
        session.agreement_accepted_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        
        return InterviewSessionResponse(
            success=True,
            message="Agreement accepted successfully",
            interview_link=None,
            session=InterviewSessionType(
                id=str(session.id),
                job_id=str(session.job_id),
                candidate_id=str(session.candidate_id),
                application_id=str(session.application_id) if session.application_id else None,
                token=session.token,
                status=session.status,
                expires_at=session.expires_at.isoformat() if session.expires_at else None,
                agreement_accepted_at=session.agreement_accepted_at.isoformat() if session.agreement_accepted_at else None,
                created_at=session.created_at.isoformat() if session.created_at else None,
            )
        )
    except Exception as e:
        db.rollback()
        return InterviewSessionResponse(success=False, message=str(e), interview_link=None, session=None)
    finally:
        db.close()

