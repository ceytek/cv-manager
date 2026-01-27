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
    InterviewTemplateMinimalType,
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
    AIAnalysisCategoryType,
    AIInterviewAnalysisType,
    AIAnalysisResponse,
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
                ai_analysis_enabled=t.ai_analysis_enabled or False,
                voice_response_enabled=t.voice_response_enabled or False,
                is_ai_generated=getattr(t, 'is_ai_generated', False) or False,
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
            ai_analysis_enabled=template.ai_analysis_enabled or False,
            voice_response_enabled=template.voice_response_enabled or False,
            is_ai_generated=getattr(template, 'is_ai_generated', False) or False,
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
        
        template_type = None
        if template:
            template_type = InterviewTemplateMinimalType(
                id=str(template.id),
                name=template.name,
                voice_response_enabled=template.voice_response_enabled or False,
                ai_analysis_enabled=template.ai_analysis_enabled or False,
            )
        
        # Get existing answers for this session
        db_answers = db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session.id).all()
        answers = [
            InterviewAnswerType(
                id=str(a.id),
                session_id=str(a.session_id),
                question_id=str(a.question_id),
                answer_text=a.answer_text,
                video_url=a.video_url,
                audio_url=a.audio_url,
                duration_seconds=a.duration_seconds,
                status=a.status,
                created_at=a.created_at.isoformat() if a.created_at else None,
                updated_at=a.updated_at.isoformat() if a.updated_at else None,
            ) for a in db_answers
        ]
        
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
            template=template_type,
            job=job_type,
            candidate=candidate_type,
            questions=questions,
            existing_answers=answers,
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
                    ai_analysis_enabled=template.ai_analysis_enabled or False,
                    voice_response_enabled=template.voice_response_enabled or False,
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
            # Use saved question_text from answer (snapshot), fallback to current question
            saved_question_text = a.question_text if a.question_text else (q.question_text if q else "")
            answers_type.append(InterviewAnswerWithQuestionType(
                id=str(a.id),
                question_id=str(a.question_id),
                question_text=saved_question_text,
                question_order=q.question_order if q else 0,
                answer_text=a.answer_text,
                video_url=a.video_url,
                duration_seconds=a.duration_seconds,
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
            ai_analysis=session.ai_analysis,
            ai_overall_score=float(session.ai_overall_score) if session.ai_overall_score else None,
            browser_stt_supported=session.browser_stt_supported,
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
            ai_analysis_enabled=input.ai_analysis_enabled,
            voice_response_enabled=input.voice_response_enabled,
            is_ai_generated=input.is_ai_generated,
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
                ai_analysis_enabled=template.ai_analysis_enabled or False,
                voice_response_enabled=template.voice_response_enabled or False,
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
        template.ai_analysis_enabled = input.ai_analysis_enabled
        template.voice_response_enabled = input.voice_response_enabled
        template.is_ai_generated = input.is_ai_generated
        
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
                ai_analysis_enabled=template.ai_analysis_enabled or False,
                voice_response_enabled=template.voice_response_enabled or False,
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
    from app.modules.history.resolvers import create_history_entry
    
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
        current_user = get_current_user_from_token(token, db)
        
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
        
        # Add history entry
        create_history_entry(
            db=db,
            company_id=str(company_id),
            application_id=input.application_id,
            candidate_id=input.candidate_id,
            job_id=input.job_id,
            action_code="interview_sent",
            performed_by=current_user.id if current_user else None,
            action_data={"session_id": str(session.id), "template_id": str(job.interview_template_id)},
        )
        
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
    from app.modules.history.resolvers import create_history_entry
    
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
        if not session:
            return InterviewSessionResponse(success=False, message="Session not found", interview_link=None, session=None)
        
        if session.status == 'completed':
            return InterviewSessionResponse(success=False, message="Session already completed", interview_link=None, session=None)
        
        if session.expires_at and session.expires_at < datetime.utcnow():
            return InterviewSessionResponse(success=False, message="Session expired", interview_link=None, session=None)
        
        # Only add history if not already started
        was_pending = session.status == 'pending'
        
        session.status = "in_progress"
        session.started_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        
        # Add history entry only for first start
        if was_pending and session.application_id:
            create_history_entry(
                db=db,
                company_id=str(session.company_id),
                application_id=str(session.application_id),
                candidate_id=str(session.candidate_id),
                job_id=str(session.job_id),
                action_code="interview_started",
                performed_by=None,  # Candidate started it
                action_data={"session_id": str(session.id)},
            )
        
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
        
        # Get the question to save its text (snapshot at answer time)
        question = db.query(InterviewQuestion).filter(InterviewQuestion.id == input.question_id).first()
        question_text_snapshot = question.question_text if question else None
        
        # Check if answer already exists
        existing = db.query(InterviewAnswer).filter(
            InterviewAnswer.session_id == session.id,
            InterviewAnswer.question_id == input.question_id
        ).first()
        
        if existing:
            existing.answer_text = input.answer_text
            existing.video_url = input.video_url
            existing.duration_seconds = input.duration_seconds
            # Keep original question_text if exists, otherwise set it
            if not existing.question_text and question_text_snapshot:
                existing.question_text = question_text_snapshot
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            answer = existing
        else:
            answer = InterviewAnswer(
                session_id=session.id,
                question_id=input.question_id,
                question_text=question_text_snapshot,  # Save question text at answer time
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
    from app.modules.history.resolvers import create_history_entry
    from app.models.subscription import UsageTracking
    from datetime import date
    from calendar import monthrange
    import secrets
    
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
        if not session:
            return InterviewSessionResponse(success=False, message="Session not found", interview_link=None, session=None)
        
        was_not_completed = session.status != 'completed'
        
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        
        # Add history entry
        if was_not_completed and session.application_id:
            create_history_entry(
                db=db,
                company_id=str(session.company_id),
                application_id=str(session.application_id),
                candidate_id=str(session.candidate_id),
                job_id=str(session.job_id),
                action_code="interview_completed",
                performed_by=None,  # Candidate completed it
                action_data={"session_id": str(session.id)},
            )
            
            # Record usage for interview_completed
            try:
                from app.models.candidate import Candidate
                today = date.today()
                month_start = date(today.year, today.month, 1)
                last_day = monthrange(today.year, today.month)[1]
                month_end = date(today.year, today.month, last_day)
                batch_number = f"##INT{secrets.token_hex(3).upper()}"
                
                # Get candidate name for metadata
                candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
                candidate_name = candidate.name if candidate else "Unknown"
                
                usage_entry = UsageTracking(
                    company_id=session.company_id,
                    resource_type="interview_completed",
                    count=1,
                    period_start=month_start,
                    period_end=month_end,
                    usage_metadata={
                        "session_id": str(session.id), 
                        "candidate_id": str(session.candidate_id),
                        "candidate_name": candidate_name,
                        "application_id": str(session.application_id) if session.application_id else None
                    },
                    batch_number=batch_number
                )
                db.add(usage_entry)
                db.commit()
                print(f"✅ Recorded interview_completed usage: {batch_number}")
            except Exception as ue:
                print(f"❌ Usage record failed for interview_completed: {ue}")
        
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


# ============ AI Analysis Resolvers ============

async def analyze_interview_with_ai(info: Info, session_id: str) -> AIAnalysisResponse:
    """Trigger AI analysis for a completed interview session"""
    import httpx
    import os
    from app.models.job import Job
    
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            return AIAnalysisResponse(success=False, message="Session not found", analysis=None)
        
        # Check if already analyzed
        if session.ai_analysis:
            # Return cached analysis
            return AIAnalysisResponse(
                success=True,
                message="Analysis already exists",
                analysis=AIInterviewAnalysisType(
                    overall_score=float(session.ai_overall_score) if session.ai_overall_score else 0,
                    categories=[
                        AIAnalysisCategoryType(
                            category=cat.get("category", ""),
                            category_en=cat.get("category_en", ""),
                            score=cat.get("score", 0),
                            feedback=cat.get("feedback", []),
                        ) for cat in session.ai_analysis.get("categories", [])
                    ],
                    summary=session.ai_analysis.get("summary"),
                    analyzed_at=session.ai_analysis.get("analyzed_at"),
                )
            )
        
        # Get job details
        job = db.query(Job).filter(Job.id == session.job_id).first()
        if not job:
            return AIAnalysisResponse(success=False, message="Job not found", analysis=None)
        
        # Get template for AI analysis check
        template = None
        if job.interview_template_id:
            template = db.query(InterviewTemplate).filter(InterviewTemplate.id == job.interview_template_id).first()
        
        # Get answers with questions
        answers = db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session.id).all()
        questions_list = []
        if template:
            questions_list = db.query(InterviewQuestion).filter(
                InterviewQuestion.template_id == template.id
            ).order_by(InterviewQuestion.question_order).all()
        
        # Build Q&A list for AI
        qa_list = []
        for a in sorted(answers, key=lambda x: x.created_at):
            q = next((q for q in questions_list if str(q.id) == str(a.question_id)), None)
            if q:
                qa_list.append({
                    "question": q.question_text,
                    "answer": a.answer_text or "",
                    "order": q.question_order,
                })
        
        # Prepare job context
        job_context = {
            "title": job.title,
            "description": job.description_plain or job.description or "",
            "requirements": job.requirements_plain or job.requirements or "",
        }
        
        # Call AI-Service
        ai_service_url = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
        interview_language = template.language if template else "tr"
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{ai_service_url}/analyze-interview",
                json={
                    "job_context": job_context,
                    "questions_answers": qa_list,
                    "language": interview_language,
                }
            )
            
            if response.status_code != 200:
                return AIAnalysisResponse(
                    success=False, 
                    message=f"AI Service error: {response.text}", 
                    analysis=None
                )
            
            ai_response = response.json()
            
            # AI-Service returns {"success": bool, "data": {...}, "error": str}
            if not ai_response.get("success"):
                return AIAnalysisResponse(
                    success=False, 
                    message=ai_response.get("error", "AI analysis failed"), 
                    analysis=None
                )
            
            ai_result = ai_response.get("data", {})
        
        # Save to database
        session.ai_analysis = ai_result
        session.ai_overall_score = ai_result.get("overall_score", 0)
        db.commit()
        db.refresh(session)
        
        # Record usage for interview_ai_analysis
        try:
            from app.models.subscription import UsageTracking
            from app.models.candidate import Candidate
            from datetime import date
            from calendar import monthrange
            import secrets
            
            today = date.today()
            month_start = date(today.year, today.month, 1)
            last_day = monthrange(today.year, today.month)[1]
            month_end = date(today.year, today.month, last_day)
            batch_number = f"##AIA{secrets.token_hex(3).upper()}"
            
            # Get candidate name for metadata
            candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
            candidate_name = candidate.name if candidate else "Unknown"
            
            usage_entry = UsageTracking(
                company_id=session.company_id,
                resource_type="interview_ai_analysis",
                count=1,
                period_start=month_start,
                period_end=month_end,
                usage_metadata={
                    "session_id": str(session.id), 
                    "candidate_id": str(session.candidate_id),
                    "candidate_name": candidate_name,
                    "application_id": str(session.application_id) if session.application_id else None
                },
                batch_number=batch_number
            )
            db.add(usage_entry)
            db.commit()
            print(f"✅ Recorded interview_ai_analysis usage: {batch_number}")
        except Exception as ue:
            print(f"❌ Usage record failed for interview_ai_analysis: {ue}")
        
        return AIAnalysisResponse(
            success=True,
            message="Analysis completed successfully",
            analysis=AIInterviewAnalysisType(
                overall_score=ai_result.get("overall_score", 0),
                categories=[
                    AIAnalysisCategoryType(
                        category=cat.get("category", ""),
                        category_en=cat.get("category_en", ""),
                        score=cat.get("score", 0),
                        feedback=cat.get("feedback", []),
                    ) for cat in ai_result.get("categories", [])
                ],
                summary=ai_result.get("summary"),
                analyzed_at=ai_result.get("analyzed_at", datetime.utcnow().isoformat()),
            )
        )
    except Exception as e:
        db.rollback()
        return AIAnalysisResponse(success=False, message=str(e), analysis=None)
    finally:
        db.close()


async def update_browser_stt_support(info: Info, token: str, supported: bool) -> InterviewSessionResponse:
    """Update browser STT support status for a session"""
    db = get_db_session()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.token == token).first()
        if not session:
            return InterviewSessionResponse(success=False, message="Session not found", interview_link=None, session=None)
        
        session.browser_stt_supported = supported
        db.commit()
        db.refresh(session)
        
        return InterviewSessionResponse(
            success=True,
            message="Browser STT support updated",
            interview_link=None,
            session=InterviewSessionType(
                id=str(session.id),
                job_id=str(session.job_id),
                candidate_id=str(session.candidate_id),
                application_id=str(session.application_id) if session.application_id else None,
                token=session.token,
                status=session.status,
                expires_at=session.expires_at.isoformat() if session.expires_at else None,
                created_at=session.created_at.isoformat() if session.created_at else None,
            )
        )
    except Exception as e:
        db.rollback()
        return InterviewSessionResponse(success=False, message=str(e), interview_link=None, session=None)
    finally:
        db.close()


