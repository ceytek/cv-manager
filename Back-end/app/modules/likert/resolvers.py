"""
GraphQL Resolvers for Likert Module
"""
import secrets
from datetime import datetime, timedelta
from typing import List, Optional

from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType, GenericResponse
from app.modules.likert.models import LikertTemplate, LikertQuestion, LikertSession, LikertAnswer
from app.modules.likert.types import (
    LikertTemplateType,
    LikertTemplateInput,
    LikertTemplateResponse,
    LikertQuestionType,
    LikertSessionType,
    LikertSessionResponse,
    CreateLikertSessionInput,
)


# ============ Query Resolvers ============

def get_likert_templates(info: Info) -> List[LikertTemplateType]:
    """Get all likert templates for the current company"""
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
        templates = db.query(LikertTemplate).filter(
            LikertTemplate.company_id == company_id
        ).order_by(LikertTemplate.created_at.desc()).all()
        
        return [
            LikertTemplateType(
                id=str(t.id),
                name=t.name,
                description=t.description,
                scale_type=t.scale_type or 5,
                scale_labels=t.scale_labels or [],
                language=t.language or "tr",
                is_active=t.is_active,
                is_ai_generated=t.is_ai_generated if hasattr(t, 'is_ai_generated') else False,
                time_limit=t.time_limit,
                question_count=len(t.questions),
                questions=[],
                created_at=t.created_at.isoformat() if t.created_at else None,
                updated_at=t.updated_at.isoformat() if t.updated_at else None,
            ) for t in templates
        ]
    finally:
        db.close()


def get_likert_template(info: Info, id: str) -> Optional[LikertTemplateType]:
    """Get a single likert template with questions"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(LikertTemplate).filter(LikertTemplate.id == id).first()
        if not template:
            return None
        
        return LikertTemplateType(
            id=str(template.id),
            name=template.name,
            description=template.description,
            scale_type=template.scale_type or 5,
            scale_labels=template.scale_labels,
            language=template.language or "tr",
            is_active=template.is_active,
            is_ai_generated=template.is_ai_generated if hasattr(template, 'is_ai_generated') else False,
            time_limit=template.time_limit,
            question_count=len(template.questions),
            questions=[
                LikertQuestionType(
                    id=str(q.id),
                    question_text=q.question_text,
                    question_order=q.question_order,
                    is_reverse_scored=q.is_reverse_scored or False,
                ) for q in sorted(template.questions, key=lambda x: x.question_order)
            ],
            created_at=template.created_at.isoformat(),
            updated_at=template.updated_at.isoformat() if template.updated_at else None,
        )
    finally:
        db.close()


# ============ Mutation Resolvers ============

async def create_likert_template(info: Info, input: LikertTemplateInput) -> LikertTemplateResponse:
    """Create a new likert template"""
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
        current = get_current_user_from_token(token, db)
        
        # Default scale labels based on scale type
        default_labels = {
            3: ["Katılmıyorum", "Kararsızım", "Katılıyorum"],
            4: ["Kesinlikle Katılmıyorum", "Katılmıyorum", "Katılıyorum", "Kesinlikle Katılıyorum"],
            5: ["Kesinlikle Katılmıyorum", "Katılmıyorum", "Kararsızım", "Katılıyorum", "Kesinlikle Katılıyorum"],
        }
        scale_labels = input.scale_labels if input.scale_labels else default_labels.get(input.scale_type, default_labels[5])
        
        template = LikertTemplate(
            company_id=company_id,
            created_by=current.id,
            name=input.name,
            description=input.description,
            scale_type=input.scale_type,
            scale_labels=scale_labels,
            language=input.language,
            time_limit=input.time_limit,
            is_active=True,
            is_ai_generated=getattr(input, 'is_ai_generated', False),
        )
        db.add(template)
        db.flush()
        
        # Track usage if AI generated
        if getattr(input, 'is_ai_generated', False):
            from app.models.subscription import UsageTracking, ResourceType
            from datetime import date
            from calendar import monthrange
            
            # Get current period (same logic as interview templates)
            today = date.today()
            month_start = date(today.year, today.month, 1)
            last_day = monthrange(today.year, today.month)[1]
            month_end = date(today.year, today.month, last_day)
            
            # Create usage record
            usage = UsageTracking(
                company_id=company_id,
                resource_type=ResourceType.AI_QUESTION_GENERATION.value,
                count=1,
                period_start=month_start,
                period_end=month_end,
                usage_metadata={
                    "template_id": str(template.id),
                    "template_name": input.name,
                    "template_type": "likert",
                    "question_count": len(input.questions),
                    "language": input.language,
                }
            )
            db.add(usage)
        
        for i, q in enumerate(input.questions):
            question = LikertQuestion(
                template_id=template.id,
                company_id=company_id,
                question_text=q.question_text,
                question_order=i + 1,
                is_reverse_scored=q.is_reverse_scored if hasattr(q, 'is_reverse_scored') else False,
            )
            db.add(question)
        
        db.commit()
        db.refresh(template)
        
        return LikertTemplateResponse(
            success=True,
            message="Template created successfully",
            template=LikertTemplateType(
                id=str(template.id),
                name=template.name,
                description=template.description,
                scale_type=template.scale_type,
                scale_labels=template.scale_labels,
                language=template.language,
                is_active=template.is_active,
                is_ai_generated=template.is_ai_generated,
                time_limit=template.time_limit,
                question_count=len(template.questions),
                questions=[],
                created_at=template.created_at.isoformat(),
                updated_at=None,
            ),
        )
    except Exception as e:
        db.rollback()
        return LikertTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def update_likert_template(info: Info, id: str, input: LikertTemplateInput) -> LikertTemplateResponse:
    """Update a likert template"""
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
        template = db.query(LikertTemplate).filter(LikertTemplate.id == id).first()
        if not template:
            return LikertTemplateResponse(success=False, message="Template not found", template=None)
        
        template.name = input.name
        template.description = input.description
        template.scale_type = input.scale_type
        template.language = input.language
        template.time_limit = input.time_limit
        
        # Update scale labels if provided
        if input.scale_labels:
            template.scale_labels = input.scale_labels
        
        # Get existing questions
        existing_questions = db.query(LikertQuestion).filter(
            LikertQuestion.template_id == template.id
        ).all()
        existing_questions_dict = {str(eq.id): eq for eq in existing_questions}
        
        # Find questions that have answers (should not be deleted)
        questions_with_answers = set()
        for eq in existing_questions:
            answer_count = db.query(LikertAnswer).filter(
                LikertAnswer.question_id == eq.id
            ).count()
            if answer_count > 0:
                questions_with_answers.add(str(eq.id))
        
        # Collect input question IDs (if they have IDs)
        input_question_ids = set()
        for q in input.questions:
            if hasattr(q, 'id') and q.id:
                input_question_ids.add(str(q.id))
        
        # Delete questions that:
        # 1. Are NOT in the input list (by ID)
        # 2. AND do NOT have answers
        for eq in existing_questions:
            eq_id = str(eq.id)
            if eq_id not in input_question_ids and eq_id not in questions_with_answers:
                db.delete(eq)
        
        # Flush deletions before adding new questions (to avoid unique constraint violation)
        db.flush()
        
        # Update or create questions
        for i, q in enumerate(input.questions):
            q_id = getattr(q, 'id', None) if hasattr(q, 'id') else None
            
            if q_id and q_id in existing_questions_dict:
                # Update existing question
                existing_q = existing_questions_dict[q_id]
                existing_q.question_text = q.question_text
                existing_q.question_order = i + 1
                existing_q.is_reverse_scored = q.is_reverse_scored if hasattr(q, 'is_reverse_scored') else False
            else:
                # Create new question
                question = LikertQuestion(
                    template_id=template.id,
                    company_id=company_id,
                    question_text=q.question_text,
                    question_order=i + 1,
                    is_reverse_scored=q.is_reverse_scored if hasattr(q, 'is_reverse_scored') else False,
                )
                db.add(question)
        
        db.commit()
        db.refresh(template)
        
        return LikertTemplateResponse(
            success=True,
            message="Template updated successfully",
            template=LikertTemplateType(
                id=str(template.id),
                name=template.name,
                description=template.description,
                scale_type=template.scale_type,
                scale_labels=template.scale_labels,
                language=template.language,
                is_active=template.is_active,
                is_ai_generated=template.is_ai_generated if hasattr(template, 'is_ai_generated') else False,
                time_limit=template.time_limit,
                question_count=len(input.questions),
                questions=[],
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat() if template.updated_at else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return LikertTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def delete_likert_template(info: Info, id: str) -> MessageType:
    """Delete a likert template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(LikertTemplate).filter(LikertTemplate.id == id).first()
        if not template:
            return MessageType(success=False, message="Template not found")
        
        db.delete(template)
        db.commit()
        return MessageType(success=True, message="Template deleted")
    except Exception as e:
        db.rollback()
        return MessageType(success=False, message=str(e))
    finally:
        db.close()


async def toggle_likert_template(info: Info, id: str) -> LikertTemplateResponse:
    """Toggle likert template active status"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(LikertTemplate).filter(LikertTemplate.id == id).first()
        if not template:
            return LikertTemplateResponse(success=False, message="Template not found", template=None)
        
        template.is_active = not template.is_active
        db.commit()
        db.refresh(template)
        
        return LikertTemplateResponse(
            success=True,
            message=f"Template {'activated' if template.is_active else 'deactivated'}",
            template=LikertTemplateType(
                id=str(template.id),
                name=template.name,
                description=template.description,
                scale_type=template.scale_type,
                scale_labels=template.scale_labels,
                language=template.language,
                is_active=template.is_active,
                is_ai_generated=template.is_ai_generated if hasattr(template, 'is_ai_generated') else False,
                time_limit=template.time_limit,
                question_count=len(template.questions),
                questions=[],
                created_at=template.created_at.isoformat(),
                updated_at=template.updated_at.isoformat() if template.updated_at else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return LikertTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


# ============ Session Mutations ============

async def create_likert_session(info: Info, input: CreateLikertSessionInput) -> LikertSessionResponse:
    """Create a new likert test session for a candidate"""
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
        
        # Get job and validate likert is enabled
        job = db.query(Job).filter(Job.id == input.job_id).first()
        if not job:
            return LikertSessionResponse(success=False, message="Job not found", likert_link=None, session=None)
        
        if not job.likert_enabled:
            return LikertSessionResponse(success=False, message="Likert test is not enabled for this job", likert_link=None, session=None)
        
        if not job.likert_template_id:
            return LikertSessionResponse(success=False, message="No Likert template configured for this job", likert_link=None, session=None)
        
        # Get template
        template = db.query(LikertTemplate).filter(LikertTemplate.id == job.likert_template_id).first()
        if not template:
            return LikertSessionResponse(success=False, message="Likert template not found", likert_link=None, session=None)
        
        # Check if ANY session already exists (including completed)
        existing = db.query(LikertSession).filter(
            LikertSession.job_id == input.job_id,
            LikertSession.candidate_id == input.candidate_id,
        ).first()
        
        if existing:
            base_url = request.headers.get("origin", "http://localhost:5173")
            likert_link = f"{base_url}/likert/{existing.token}"
            
            # Return appropriate message based on status
            if existing.status == 'completed':
                return LikertSessionResponse(
                    success=True, 
                    message="Bu aday için Likert testi zaten tamamlandı.", 
                    likert_link=likert_link,
                    session=LikertSessionType(
                        id=str(existing.id),
                        token=existing.token,
                        status=existing.status,
                        expires_at=existing.expires_at.isoformat() if existing.expires_at else None,
                        created_at=existing.created_at.isoformat() if existing.created_at else None,
                    )
                )
            elif existing.status == 'expired':
                return LikertSessionResponse(
                    success=True, 
                    message="Bu aday için Likert testi süresi dolmuş. Yeni davet oluşturulamaz.", 
                    likert_link=likert_link,
                    session=LikertSessionType(
                        id=str(existing.id),
                        token=existing.token,
                        status=existing.status,
                        expires_at=existing.expires_at.isoformat() if existing.expires_at else None,
                        created_at=existing.created_at.isoformat() if existing.created_at else None,
                    )
                )
            else:
                # pending or in_progress - return existing link
                return LikertSessionResponse(
                    success=True, 
                    message="Bu aday için Likert testi daveti zaten gönderildi.", 
                    likert_link=likert_link,
                    session=LikertSessionType(
                        id=str(existing.id),
                        token=existing.token,
                        status=existing.status,
                        expires_at=existing.expires_at.isoformat() if existing.expires_at else None,
                        created_at=existing.created_at.isoformat() if existing.created_at else None,
                    )
                )
        
        # Create new session
        session_token = secrets.token_urlsafe(32)
        deadline_hours = job.likert_deadline_hours or 72
        expires_at = datetime.utcnow() + timedelta(hours=deadline_hours)
        
        session = LikertSession(
            template_id=job.likert_template_id,
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
            action_code="likert_sent",
            performed_by=current_user.id if current_user else None,
            action_data={"session_id": str(session.id), "template_id": str(job.likert_template_id)},
        )
        
        base_url = request.headers.get("origin", "http://localhost:5173")
        likert_link = f"{base_url}/likert/{session_token}"
        
        return LikertSessionResponse(
            success=True,
            message="Likert test invitation created successfully",
            likert_link=likert_link,
            session=LikertSessionType(
                id=str(session.id),
                token=session.token,
                status=session.status,
                expires_at=session.expires_at.isoformat(),
                created_at=session.created_at.isoformat(),
            )
        )
    except Exception as e:
        db.rollback()
        return LikertSessionResponse(success=False, message=str(e), likert_link=None, session=None)
    finally:
        db.close()


async def start_likert_session(token: str) -> GenericResponse:
    """Start a likert session (mark as in_progress)"""
    from app.modules.history.resolvers import create_history_entry
    
    db = get_db_session()
    try:
        session = db.query(LikertSession).filter(LikertSession.token == token).first()
        if not session:
            return GenericResponse(success=False, message="Session not found")
        
        if session.status == 'completed':
            return GenericResponse(success=False, message="Session already completed")
        
        if session.status == 'expired' or (session.expires_at and datetime.utcnow() > session.expires_at):
            session.status = 'expired'
            db.commit()
            return GenericResponse(success=False, message="Session expired")
        
        # Only add history if not already started
        was_pending = session.status == 'pending'
        
        session.status = 'in_progress'
        session.started_at = datetime.utcnow()
        db.commit()
        
        # Add history entry only for first start
        if was_pending and session.application_id:
            create_history_entry(
                db=db,
                company_id=str(session.company_id),
                application_id=str(session.application_id),
                candidate_id=str(session.candidate_id),
                job_id=str(session.job_id),
                action_code="likert_started",
                performed_by=None,  # Candidate started it
                action_data={"session_id": str(session.id)},
            )
        
        return GenericResponse(success=True, message="Session started")
    except Exception as e:
        db.rollback()
        return GenericResponse(success=False, message=str(e))
    finally:
        db.close()


async def save_likert_answer(session_token: str, question_id: str, score: int) -> GenericResponse:
    """Save a likert answer"""
    db = get_db_session()
    try:
        session = db.query(LikertSession).filter(LikertSession.token == session_token).first()
        if not session:
            return GenericResponse(success=False, message="Session not found")
        
        if session.status == 'completed':
            return GenericResponse(success=False, message="Session already completed")
        
        # Check if answer already exists
        existing = db.query(LikertAnswer).filter(
            LikertAnswer.session_id == session.id,
            LikertAnswer.question_id == question_id
        ).first()
        
        if existing:
            existing.selected_value = score
            existing.score = score
        else:
            answer = LikertAnswer(
                session_id=session.id,
                question_id=question_id,
                company_id=session.company_id,
                selected_value=score,
                score=score,
            )
            db.add(answer)
        
        db.commit()
        return GenericResponse(success=True, message="Answer saved")
    except Exception as e:
        db.rollback()
        print(f"[save_likert_answer] Error: {e}")
        return GenericResponse(success=False, message=str(e))
    finally:
        db.close()


async def complete_likert_session(token: str) -> GenericResponse:
    """Complete a likert session"""
    from app.modules.history.resolvers import create_history_entry
    
    db = get_db_session()
    try:
        session = db.query(LikertSession).filter(LikertSession.token == token).first()
        if not session:
            return GenericResponse(success=False, message="Session not found")
        
        if session.status == 'completed':
            return GenericResponse(success=True, message="Session already completed")
        
        # Calculate total score
        answers = db.query(LikertAnswer).filter(LikertAnswer.session_id == session.id).all()
        total_score = sum(a.score for a in answers)
        
        session.status = 'completed'
        session.completed_at = datetime.utcnow()
        session.total_score = total_score
        db.commit()
        
        # Add history entry
        if session.application_id:
            create_history_entry(
                db=db,
                company_id=str(session.company_id),
                application_id=str(session.application_id),
                candidate_id=str(session.candidate_id),
                job_id=str(session.job_id),
                action_code="likert_completed",
                performed_by=None,  # Candidate completed it
                action_data={"session_id": str(session.id), "total_score": total_score},
            )
        
        return GenericResponse(success=True, message="Session completed")
    except Exception as e:
        db.rollback()
        return GenericResponse(success=False, message=str(e))
    finally:
        db.close()


