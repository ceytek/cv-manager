"""
GraphQL Resolvers for Rejection Module
"""
from typing import List, Optional
from datetime import datetime
from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType
from app.modules.rejection.models import RejectionTemplate
from app.modules.rejection.types import (
    RejectionTemplateType,
    RejectionTemplateInput,
    RejectionTemplateUpdateInput,
    RejectionTemplateResponse,
)


# ============ Query Resolvers ============

def get_rejection_templates(info: Info) -> List[RejectionTemplateType]:
    """Get all rejection templates for the current company"""
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
        templates = db.query(RejectionTemplate).filter(
            RejectionTemplate.company_id == company_id
        ).order_by(RejectionTemplate.created_at.desc()).all()
        
        return [
            RejectionTemplateType(
                id=str(t.id),
                name=t.name,
                subject=t.subject,
                body=t.body,
                language=t.language or "TR",
                is_active=t.is_active,
                is_default=t.is_default or False,
                created_at=t.created_at.isoformat() if t.created_at else None,
                updated_at=t.updated_at.isoformat() if t.updated_at else None,
            ) for t in templates
        ]
    finally:
        db.close()


def get_rejection_template(info: Info, id: str) -> Optional[RejectionTemplateType]:
    """Get a single rejection template by ID"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(RejectionTemplate).filter(RejectionTemplate.id == id).first()
        if not template:
            return None
        
        return RejectionTemplateType(
            id=str(template.id),
            name=template.name,
            subject=template.subject,
            body=template.body,
            language=template.language or "TR",
            is_active=template.is_active,
            is_default=template.is_default or False,
            created_at=template.created_at.isoformat() if template.created_at else None,
            updated_at=template.updated_at.isoformat() if template.updated_at else None,
        )
    finally:
        db.close()


# ============ Mutation Resolvers ============

async def create_rejection_template(info: Info, input: RejectionTemplateInput) -> RejectionTemplateResponse:
    """Create a new rejection email template"""
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
        
        template = RejectionTemplate(
            company_id=company_id,
            created_by=str(current.id),
            name=input.name,
            subject=input.subject,
            body=input.body,
            language=input.language or "TR",
            is_active=input.is_active if input.is_active is not None else True,
            is_default=input.is_default if input.is_default is not None else False,
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return RejectionTemplateResponse(
            success=True,
            message="Rejection template created",
            template=RejectionTemplateType(
                id=str(template.id),
                name=template.name,
                subject=template.subject,
                body=template.body,
                language=template.language,
                is_active=template.is_active,
                is_default=template.is_default,
                created_at=template.created_at.isoformat() if template.created_at else None,
                updated_at=None,
            ),
        )
    except Exception as e:
        db.rollback()
        return RejectionTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def update_rejection_template(info: Info, id: str, input: RejectionTemplateUpdateInput) -> RejectionTemplateResponse:
    """Update a rejection email template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(RejectionTemplate).filter(RejectionTemplate.id == id).first()
        if not template:
            return RejectionTemplateResponse(success=False, message="Template not found", template=None)
        
        # Only update fields that are provided
        if input.name is not None:
            template.name = input.name
        if input.subject is not None:
            template.subject = input.subject
        if input.body is not None:
            template.body = input.body
        if input.language is not None:
            template.language = input.language
        if input.is_active is not None:
            template.is_active = input.is_active
        if input.is_default is not None:
            template.is_default = input.is_default
        
        db.commit()
        db.refresh(template)
        
        return RejectionTemplateResponse(
            success=True,
            message="Template updated",
            template=RejectionTemplateType(
                id=str(template.id),
                name=template.name,
                subject=template.subject,
                body=template.body,
                language=template.language,
                is_active=template.is_active,
                is_default=template.is_default,
                created_at=template.created_at.isoformat() if template.created_at else None,
                updated_at=template.updated_at.isoformat() if template.updated_at else None,
            ),
        )
    except Exception as e:
        db.rollback()
        return RejectionTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def delete_rejection_template(info: Info, id: str) -> MessageType:
    """Delete a rejection template"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise Exception("Not authenticated")
    
    db = get_db_session()
    try:
        template = db.query(RejectionTemplate).filter(RejectionTemplate.id == id).first()
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


async def reject_application(
    info: Info, 
    application_id: str, 
    rejection_note: Optional[str] = None,
    template_id: Optional[str] = None
) -> MessageType:
    """Reject an application and mark it with a rejection note"""
    from app.models.application import Application, ApplicationStatus
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
        
        application = db.query(Application).filter(
            Application.id == application_id,
            Application.company_id == company_id
        ).first()
        
        if not application:
            return MessageType(success=False, message="Application not found")
        
        # Update application status and rejection data
        application.status = ApplicationStatus.REJECTED
        application.rejection_note = rejection_note
        application.rejected_at = datetime.utcnow()
        application.rejection_template_id = template_id
        
        db.commit()
        
        # Add history entry
        create_history_entry(
            db=db,
            company_id=str(company_id),
            application_id=application_id,
            candidate_id=str(application.candidate_id),
            job_id=str(application.job_id),
            action_code="rejected",
            performed_by=current_user.id if current_user else None,
            note=rejection_note,
            action_data={"template_id": template_id} if template_id else None,
        )
        
        return MessageType(success=True, message="Application rejected successfully")
    except Exception as e:
        db.rollback()
        return MessageType(success=False, message=str(e))
    finally:
        db.close()
