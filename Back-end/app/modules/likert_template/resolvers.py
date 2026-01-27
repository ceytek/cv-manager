"""
GraphQL Resolvers for Likert Test Template Module
"""
from typing import List, Optional
from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType
from app.modules.likert_template.models import (
    LikertEmailTemplate,
    LIKERT_TEMPLATE_VARIABLES,
)
from app.modules.likert_template.types import (
    LikertEmailTemplateType,
    LikertEmailTemplateInput,
    LikertEmailTemplateUpdateInput,
    LikertEmailTemplateResponse,
    LikertEmailTemplateVariablesResponse,
    LikertEmailTemplateVariableType,
)


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


# ============ Query Resolvers ============

def get_likert_templates(info: Info) -> List[LikertEmailTemplateType]:
    """Get all Likert test templates for the current company"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        templates = db.query(LikertEmailTemplate).filter(
            LikertEmailTemplate.company_id == company_id
        ).order_by(LikertEmailTemplate.created_at.desc()).all()
        
        return [
            LikertEmailTemplateType(
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


def get_likert_template(info: Info, id: str) -> Optional[LikertEmailTemplateType]:
    """Get a single Likert test template by ID"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        template = db.query(LikertEmailTemplate).filter(
            LikertEmailTemplate.id == id,
            LikertEmailTemplate.company_id == company_id
        ).first()
        
        if not template:
            return None
        
        return LikertEmailTemplateType(
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


def get_likert_template_variables(info: Info) -> LikertEmailTemplateVariablesResponse:
    """Get available template variables for Likert test templates"""
    return LikertEmailTemplateVariablesResponse(
        variables=[
            LikertEmailTemplateVariableType(
                key=v['key'],
                label_tr=v['label_tr'],
                label_en=v['label_en']
            ) for v in LIKERT_TEMPLATE_VARIABLES
        ]
    )


# ============ Mutation Resolvers ============

async def create_likert_template(
    info: Info, 
    input: LikertEmailTemplateInput
) -> LikertEmailTemplateResponse:
    """Create a new Likert test email template"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        current = get_current_user_from_token(token, db)
        
        # If setting as default, unset other defaults
        if input.is_default:
            db.query(LikertEmailTemplate).filter(
                LikertEmailTemplate.company_id == company_id,
                LikertEmailTemplate.is_default == True
            ).update({"is_default": False})
        
        template = LikertEmailTemplate(
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
        
        return LikertEmailTemplateResponse(
            success=True,
            message="Likert test template created",
            template=LikertEmailTemplateType(
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
        return LikertEmailTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def update_likert_template(
    info: Info, 
    id: str, 
    input: LikertEmailTemplateUpdateInput
) -> LikertEmailTemplateResponse:
    """Update a Likert test email template"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        template = db.query(LikertEmailTemplate).filter(
            LikertEmailTemplate.id == id,
            LikertEmailTemplate.company_id == company_id
        ).first()
        
        if not template:
            return LikertEmailTemplateResponse(success=False, message="Template not found", template=None)
        
        # Update fields if provided
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
            # If setting as default, unset other defaults
            if input.is_default:
                db.query(LikertEmailTemplate).filter(
                    LikertEmailTemplate.company_id == company_id,
                    LikertEmailTemplate.is_default == True,
                    LikertEmailTemplate.id != id
                ).update({"is_default": False})
            template.is_default = input.is_default
        
        db.commit()
        db.refresh(template)
        
        return LikertEmailTemplateResponse(
            success=True,
            message="Template updated",
            template=LikertEmailTemplateType(
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
        return LikertEmailTemplateResponse(success=False, message=str(e), template=None)
    finally:
        db.close()


async def delete_likert_template(info: Info, id: str) -> MessageType:
    """Delete a Likert test template"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        template = db.query(LikertEmailTemplate).filter(
            LikertEmailTemplate.id == id,
            LikertEmailTemplate.company_id == company_id
        ).first()
        
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
