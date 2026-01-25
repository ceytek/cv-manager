"""
GraphQL Resolvers for AI Interview Email Templates
"""
from typing import List, Optional
from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session
from app.modules.ai_interview_template.models import AIInterviewEmailTemplate, AI_INTERVIEW_TEMPLATE_VARIABLES
from app.modules.ai_interview_template.types import (
    AIInterviewEmailTemplateType,
    AIInterviewEmailTemplateInput,
    AIInterviewEmailTemplateUpdateInput,
    AIInterviewEmailTemplateResponse,
    AIInterviewEmailTemplateListResponse,
    AITemplateVariableType,
)


def model_to_type(template: AIInterviewEmailTemplate) -> AIInterviewEmailTemplateType:
    """Convert SQLAlchemy model to GraphQL type"""
    return AIInterviewEmailTemplateType(
        id=template.id,
        name=template.name,
        subject=template.subject,
        body=template.body,
        language=template.language,
        is_active=template.is_active,
        is_default=template.is_default,
        company_id=str(template.company_id),
        created_by=template.created_by,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


# Query resolver
def ai_interview_email_templates(
    info: Info,
    language: Optional[str] = None,
    active_only: bool = False,
) -> AIInterviewEmailTemplateListResponse:
    """Get all AI interview email templates for the company"""
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
        query = db.query(AIInterviewEmailTemplate).filter(
            AIInterviewEmailTemplate.company_id == company_id
        )
        
        if language:
            query = query.filter(AIInterviewEmailTemplate.language == language)
        
        if active_only:
            query = query.filter(AIInterviewEmailTemplate.is_active == True)
        
        templates = query.order_by(
            AIInterviewEmailTemplate.is_default.desc(),
            AIInterviewEmailTemplate.created_at.desc()
        ).all()
        
        # Convert variables to GraphQL type
        variables = [
            AITemplateVariableType(
                key=v['key'],
                label_tr=v['label_tr'],
                label_en=v['label_en']
            )
            for v in AI_INTERVIEW_TEMPLATE_VARIABLES
        ]
        
        return AIInterviewEmailTemplateListResponse(
            templates=[model_to_type(t) for t in templates],
            variables=variables
        )
    finally:
        db.close()


# Mutation resolvers
def create_ai_interview_email_template(
    info: Info,
    input: AIInterviewEmailTemplateInput,
) -> AIInterviewEmailTemplateResponse:
    """Create a new AI interview email template"""
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
        user = get_current_user_from_token(token, db)
        
        # If this is set as default, unset other defaults for the same language
        if input.is_default:
            db.query(AIInterviewEmailTemplate).filter(
                AIInterviewEmailTemplate.company_id == company_id,
                AIInterviewEmailTemplate.language == input.language,
                AIInterviewEmailTemplate.is_default == True
            ).update({"is_default": False})
        
        template = AIInterviewEmailTemplate(
            name=input.name,
            subject=input.subject,
            body=input.body,
            language=input.language,
            is_active=input.is_active,
            is_default=input.is_default,
            company_id=company_id,
            created_by=str(user.id) if user else None,
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return AIInterviewEmailTemplateResponse(
            success=True,
            message="Şablon başarıyla oluşturuldu" if input.language == "TR" else "Template created successfully",
            template=model_to_type(template)
        )
    except Exception as e:
        db.rollback()
        return AIInterviewEmailTemplateResponse(
            success=False,
            message=str(e),
            template=None
        )
    finally:
        db.close()


def update_ai_interview_email_template(
    info: Info,
    id: str,
    input: AIInterviewEmailTemplateUpdateInput,
) -> AIInterviewEmailTemplateResponse:
    """Update an existing AI interview email template"""
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
        
        template = db.query(AIInterviewEmailTemplate).filter(
            AIInterviewEmailTemplate.id == id,
            AIInterviewEmailTemplate.company_id == company_id
        ).first()
        
        if not template:
            return AIInterviewEmailTemplateResponse(
                success=False,
                message="Şablon bulunamadı / Template not found",
                template=None
            )
        
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
                db.query(AIInterviewEmailTemplate).filter(
                    AIInterviewEmailTemplate.company_id == company_id,
                    AIInterviewEmailTemplate.language == template.language,
                    AIInterviewEmailTemplate.id != id,
                    AIInterviewEmailTemplate.is_default == True
                ).update({"is_default": False})
            template.is_default = input.is_default
        
        db.commit()
        db.refresh(template)
        
        return AIInterviewEmailTemplateResponse(
            success=True,
            message="Şablon başarıyla güncellendi / Template updated successfully",
            template=model_to_type(template)
        )
    except Exception as e:
        db.rollback()
        return AIInterviewEmailTemplateResponse(
            success=False,
            message=str(e),
            template=None
        )
    finally:
        db.close()


def delete_ai_interview_email_template(
    info: Info,
    id: str,
) -> AIInterviewEmailTemplateResponse:
    """Delete an AI interview email template"""
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
        
        template = db.query(AIInterviewEmailTemplate).filter(
            AIInterviewEmailTemplate.id == id,
            AIInterviewEmailTemplate.company_id == company_id
        ).first()
        
        if not template:
            return AIInterviewEmailTemplateResponse(
                success=False,
                message="Şablon bulunamadı / Template not found",
                template=None
            )
        
        db.delete(template)
        db.commit()
        
        return AIInterviewEmailTemplateResponse(
            success=True,
            message="Şablon başarıyla silindi / Template deleted successfully",
            template=None
        )
    except Exception as e:
        db.rollback()
        return AIInterviewEmailTemplateResponse(
            success=False,
            message=str(e),
            template=None
        )
    finally:
        db.close()
