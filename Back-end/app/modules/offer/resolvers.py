"""
GraphQL Resolvers for Offer Module
"""

from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
from strawberry.types import Info

from app.modules.common import get_db_session
from app.api.dependencies import get_current_user_from_token, get_company_id_from_token
from .models import OfferTemplate, Offer
from .types import (
    OfferTemplateType, OfferTemplateInput, OfferTemplateResponseType,
    OfferType, OfferInput, OfferResponseType, OfferBenefitType,
    PublicOfferType, OfferResponseInput
)
from .enums import OfferStatus, Currency


def _get_auth_info(info: Info):
    """Helper to get authentication info from request"""
    request = info.context["request"]
    auth_header = request.headers.get("authorization")
    
    if not auth_header:
        raise Exception("Not authenticated")
    
    try:
        scheme, token = auth_header.split()
    except ValueError:
        raise Exception("Invalid authorization header")
    
    return token


# ============================================
# Helper Functions
# ============================================

def _benefits_to_type(benefits_json) -> Optional[List[OfferBenefitType]]:
    """Convert benefits JSON to list of OfferBenefitType"""
    if not benefits_json:
        return None
    
    result = []
    for b in benefits_json:
        result.append(OfferBenefitType(
            id=b.get("id", ""),
            name=b.get("name", ""),
            value=b.get("value"),
            value_period=b.get("valuePeriod"),
            is_variable=b.get("isVariable", False),
            category=b.get("category"),
            icon=b.get("icon")
        ))
    return result


# ============================================
# Offer Template Resolvers
# ============================================

def _template_to_type(template: OfferTemplate) -> OfferTemplateType:
    """Convert OfferTemplate model to OfferTemplateType"""
    default_benefits = None
    if template.default_benefits:
        default_benefits = _benefits_to_type(template.default_benefits)
    
    return OfferTemplateType(
        id=str(template.id),
        name=template.name,
        intro_text=template.intro_text,
        outro_text=template.outro_text,
        default_validity_days=template.default_validity_days or 7,
        default_benefits=default_benefits,
        is_active=template.is_active,
        created_at=template.created_at.isoformat() if template.created_at else None,
        updated_at=template.updated_at.isoformat() if template.updated_at else None
    )


def get_offer_templates(info: Info, is_active: Optional[bool] = None) -> List[OfferTemplateType]:
    """Get all offer templates for the company"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        query = db.query(OfferTemplate).filter(OfferTemplate.company_id == company_id)
        
        if is_active is not None:
            query = query.filter(OfferTemplate.is_active == is_active)
        
        query = query.order_by(OfferTemplate.name)
        
        templates = query.all()
        return [_template_to_type(t) for t in templates]
    finally:
        db.close()


def get_offer_template(info: Info, id: str) -> Optional[OfferTemplateType]:
    """Get a single offer template by ID"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        template = db.query(OfferTemplate).filter(
            OfferTemplate.id == id,
            OfferTemplate.company_id == company_id
        ).first()
        
        if not template:
            return None
        
        return _template_to_type(template)
    finally:
        db.close()


def create_offer_template(info: Info, input: OfferTemplateInput) -> OfferTemplateResponseType:
    """Create a new offer template"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        # Convert benefits to JSON if provided
        default_benefits_json = None
        if input.default_benefits:
            default_benefits_json = [
                {
                    "id": b.id,
                    "name": b.name,
                    "value": b.value,
                    "valuePeriod": b.value_period,
                    "isVariable": b.is_variable,
                    "category": b.category,
                    "icon": b.icon
                }
                for b in input.default_benefits
            ]
        
        template = OfferTemplate(
            company_id=company_id,
            name=input.name,
            intro_text=input.intro_text,
            outro_text=input.outro_text,
            default_validity_days=input.default_validity_days,
            default_benefits=default_benefits_json,
            is_active=input.is_active
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return OfferTemplateResponseType(
            success=True,
            message="Offer template created successfully",
            template=_template_to_type(template)
        )
    except Exception as e:
        db.rollback()
        return OfferTemplateResponseType(
            success=False,
            message=str(e),
            template=None
        )
    finally:
        db.close()


def update_offer_template(info: Info, id: str, input: OfferTemplateInput) -> OfferTemplateResponseType:
    """Update an existing offer template"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        template = db.query(OfferTemplate).filter(
            OfferTemplate.id == id,
            OfferTemplate.company_id == company_id
        ).first()
        
        if not template:
            return OfferTemplateResponseType(
                success=False,
                message="Template not found",
                template=None
            )
        
        # Convert benefits to JSON if provided
        default_benefits_json = None
        if input.default_benefits:
            default_benefits_json = [
                {
                    "id": b.id,
                    "name": b.name,
                    "value": b.value,
                    "valuePeriod": b.value_period,
                    "isVariable": b.is_variable,
                    "category": b.category,
                    "icon": b.icon
                }
                for b in input.default_benefits
            ]
        
        template.name = input.name
        template.intro_text = input.intro_text
        template.outro_text = input.outro_text
        template.default_validity_days = input.default_validity_days
        template.default_benefits = default_benefits_json
        template.is_active = input.is_active
        
        db.commit()
        db.refresh(template)
        
        return OfferTemplateResponseType(
            success=True,
            message="Offer template updated successfully",
            template=_template_to_type(template)
        )
    except Exception as e:
        db.rollback()
        return OfferTemplateResponseType(
            success=False,
            message=str(e),
            template=None
        )
    finally:
        db.close()


def delete_offer_template(info: Info, id: str) -> OfferTemplateResponseType:
    """Delete an offer template"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        template = db.query(OfferTemplate).filter(
            OfferTemplate.id == id,
            OfferTemplate.company_id == company_id
        ).first()
        
        if not template:
            return OfferTemplateResponseType(
                success=False,
                message="Template not found",
                template=None
            )
        
        db.delete(template)
        db.commit()
        
        return OfferTemplateResponseType(
            success=True,
            message="Offer template deleted successfully",
            template=None
        )
    except Exception as e:
        db.rollback()
        return OfferTemplateResponseType(
            success=False,
            message=str(e),
            template=None
        )
    finally:
        db.close()


def toggle_offer_template(info: Info, id: str) -> OfferTemplateResponseType:
    """Toggle offer template active status"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        template = db.query(OfferTemplate).filter(
            OfferTemplate.id == id,
            OfferTemplate.company_id == company_id
        ).first()
        
        if not template:
            return OfferTemplateResponseType(
                success=False,
                message="Template not found",
                template=None
            )
        
        template.is_active = not template.is_active
        db.commit()
        db.refresh(template)
        
        return OfferTemplateResponseType(
            success=True,
            message=f"Template {'activated' if template.is_active else 'deactivated'} successfully",
            template=_template_to_type(template)
        )
    except Exception as e:
        db.rollback()
        return OfferTemplateResponseType(
            success=False,
            message=str(e),
            template=None
        )
    finally:
        db.close()


# ============================================
# Offer Resolvers
# ============================================

def _offer_to_type(offer: Offer, db) -> OfferType:
    """Convert Offer model to OfferType"""
    from app.models.application import Application
    from app.models.candidate import Candidate
    from app.models.job import Job
    
    # Get related data
    candidate_name = None
    candidate_email = None
    job_title = None
    template_type = None
    
    application = db.query(Application).filter(Application.id == offer.application_id).first()
    if application:
        candidate = db.query(Candidate).filter(Candidate.id == application.candidate_id).first()
        job = db.query(Job).filter(Job.id == application.job_id).first()
        if candidate:
            candidate_name = candidate.name
            candidate_email = candidate.email
        if job:
            job_title = job.title
    
    if offer.template:
        template_type = _template_to_type(offer.template)
    
    return OfferType(
        id=str(offer.id),
        application_id=str(offer.application_id),
        template_id=str(offer.template_id) if offer.template_id else None,
        token=offer.token,
        status=offer.status.value if offer.status else "draft",
        salary_gross=float(offer.salary_gross) if offer.salary_gross else None,
        salary_net=float(offer.salary_net) if offer.salary_net else None,
        currency=offer.currency.value if offer.currency else "TRY",
        start_date=offer.start_date.isoformat() if offer.start_date else None,
        valid_until=offer.valid_until.isoformat() if offer.valid_until else None,
        intro_text=offer.intro_text,
        outro_text=offer.outro_text,
        custom_notes=offer.custom_notes,
        benefits=_benefits_to_type(offer.benefits),
        pdf_path=offer.pdf_path,
        sent_at=offer.sent_at.isoformat() if offer.sent_at else None,
        viewed_at=offer.viewed_at.isoformat() if offer.viewed_at else None,
        responded_at=offer.responded_at.isoformat() if offer.responded_at else None,
        response_note=offer.response_note,
        revision_count=offer.revision_count or 0,
        created_at=offer.created_at.isoformat() if offer.created_at else None,
        updated_at=offer.updated_at.isoformat() if offer.updated_at else None,
        template=template_type,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        job_title=job_title
    )


def get_offers(info: Info, status: Optional[str] = None) -> List[OfferType]:
    """Get all offers for the company"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        query = db.query(Offer).filter(Offer.company_id == company_id)
        
        if status:
            try:
                status_enum = OfferStatus(status)
                query = query.filter(Offer.status == status_enum)
            except ValueError:
                pass
        
        query = query.order_by(Offer.created_at.desc())
        
        offers = query.all()
        return [_offer_to_type(o, db) for o in offers]
    finally:
        db.close()


def get_offer(info: Info, id: str) -> Optional[OfferType]:
    """Get a single offer by ID"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        offer = db.query(Offer).filter(
            Offer.id == id,
            Offer.company_id == company_id
        ).first()
        
        if not offer:
            return None
        
        return _offer_to_type(offer, db)
    finally:
        db.close()


def get_offer_by_application(info: Info, application_id: str) -> Optional[OfferType]:
    """Get offer for a specific application"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        offer = db.query(Offer).filter(
            Offer.application_id == application_id,
            Offer.company_id == company_id
        ).order_by(Offer.created_at.desc()).first()
        
        if not offer:
            return None
        
        return _offer_to_type(offer, db)
    finally:
        db.close()


def create_offer(info: Info, input: OfferInput) -> OfferResponseType:
    """Create a new offer"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        from app.models.application import Application
        
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        current_user = get_current_user_from_token(token, db)
        
        # Verify application belongs to company
        application = db.query(Application).filter(
            Application.id == input.application_id,
            Application.company_id == company_id
        ).first()
        
        if not application:
            return OfferResponseType(
                success=False,
                message="Application not found",
                offer=None
            )
        
        # Get template if provided
        intro_text = input.intro_text
        outro_text = input.outro_text
        
        if input.template_id:
            template = db.query(OfferTemplate).filter(
                OfferTemplate.id == input.template_id,
                OfferTemplate.company_id == company_id
            ).first()
            if template:
                if not intro_text:
                    intro_text = template.intro_text
                if not outro_text:
                    outro_text = template.outro_text
        
        # Parse dates
        start_date = None
        valid_until = None
        if input.start_date:
            start_date = datetime.fromisoformat(input.start_date.replace('Z', '+00:00')).date()
        if input.valid_until:
            valid_until = datetime.fromisoformat(input.valid_until.replace('Z', '+00:00')).date()
        
        # Convert benefits to JSON
        benefits_json = None
        if input.benefits:
            benefits_json = [
                {
                    "id": b.id,
                    "name": b.name,
                    "value": b.value,
                    "valuePeriod": b.value_period,
                    "isVariable": b.is_variable,
                    "category": b.category,
                    "icon": b.icon
                }
                for b in input.benefits
            ]
        
        # Create offer
        offer = Offer(
            company_id=company_id,
            application_id=input.application_id,
            template_id=input.template_id,
            status=OfferStatus.DRAFT,
            salary_gross=input.salary_gross,
            salary_net=input.salary_net,
            currency=Currency(input.currency) if input.currency else Currency.TRY,
            start_date=start_date,
            valid_until=valid_until,
            intro_text=intro_text,
            outro_text=outro_text,
            custom_notes=input.custom_notes,
            benefits=benefits_json,
            created_by=current_user.id if current_user else None
        )
        
        db.add(offer)
        db.commit()
        db.refresh(offer)
        
        return OfferResponseType(
            success=True,
            message="Offer created successfully",
            offer=_offer_to_type(offer, db)
        )
    except Exception as e:
        db.rollback()
        return OfferResponseType(
            success=False,
            message=str(e),
            offer=None
        )
    finally:
        db.close()


def update_offer(info: Info, id: str, input: OfferInput) -> OfferResponseType:
    """Update an existing offer"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        offer = db.query(Offer).filter(
            Offer.id == id,
            Offer.company_id == company_id
        ).first()
        
        if not offer:
            return OfferResponseType(
                success=False,
                message="Offer not found",
                offer=None
            )
        
        # Only allow updates if draft or revision requested
        if offer.status not in [OfferStatus.DRAFT, OfferStatus.REVISION_REQUESTED]:
            return OfferResponseType(
                success=False,
                message="Cannot update offer in current status",
                offer=None
            )
        
        # Parse dates
        if input.start_date:
            offer.start_date = datetime.fromisoformat(input.start_date.replace('Z', '+00:00')).date()
        if input.valid_until:
            offer.valid_until = datetime.fromisoformat(input.valid_until.replace('Z', '+00:00')).date()
        
        # Convert benefits to JSON
        if input.benefits:
            offer.benefits = [
                {
                    "id": b.id,
                    "name": b.name,
                    "value": b.value,
                    "valuePeriod": b.value_period,
                    "isVariable": b.is_variable,
                    "category": b.category,
                    "icon": b.icon
                }
                for b in input.benefits
            ]
        
        # Update fields
        offer.template_id = input.template_id
        offer.salary_gross = input.salary_gross
        offer.salary_net = input.salary_net
        offer.currency = Currency(input.currency) if input.currency else Currency.TRY
        offer.intro_text = input.intro_text
        offer.outro_text = input.outro_text
        offer.custom_notes = input.custom_notes
        
        # If was revision requested, mark as revised
        if offer.status == OfferStatus.REVISION_REQUESTED:
            offer.status = OfferStatus.REVISED
            offer.revision_count = (offer.revision_count or 0) + 1
        
        db.commit()
        db.refresh(offer)
        
        return OfferResponseType(
            success=True,
            message="Offer updated successfully",
            offer=_offer_to_type(offer, db)
        )
    except Exception as e:
        db.rollback()
        return OfferResponseType(
            success=False,
            message=str(e),
            offer=None
        )
    finally:
        db.close()


def delete_offer(info: Info, id: str) -> OfferResponseType:
    """Delete an offer"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        offer = db.query(Offer).filter(
            Offer.id == id,
            Offer.company_id == company_id
        ).first()
        
        if not offer:
            return OfferResponseType(
                success=False,
                message="Offer not found",
                offer=None
            )
        
        db.delete(offer)
        db.commit()
        
        return OfferResponseType(
            success=True,
            message="Offer deleted successfully",
            offer=None
        )
    except Exception as e:
        db.rollback()
        return OfferResponseType(
            success=False,
            message=str(e),
            offer=None
        )
    finally:
        db.close()


def send_offer(info: Info, id: str) -> OfferResponseType:
    """Send an offer to the candidate"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        from app.models.application import Application
        from app.modules.history.resolvers import create_history_entry
        
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        current_user = get_current_user_from_token(token, db)
        
        offer = db.query(Offer).filter(
            Offer.id == id,
            Offer.company_id == company_id
        ).first()
        
        if not offer:
            return OfferResponseType(
                success=False,
                message="Offer not found",
                offer=None
            )
        
        # Only allow sending if draft or revised
        if offer.status not in [OfferStatus.DRAFT, OfferStatus.REVISED]:
            return OfferResponseType(
                success=False,
                message="Offer cannot be sent in current status",
                offer=None
            )
        
        # Update offer status
        offer.status = OfferStatus.SENT
        offer.sent_at = datetime.utcnow()
        
        # Update application status to OFFER_SENT
        application = db.query(Application).filter(
            Application.id == offer.application_id
        ).first()
        
        if application:
            from app.models.application import ApplicationStatus
            application.status = ApplicationStatus.OFFER_SENT
            db.commit()
            
            # Create history entry (non-blocking)
            try:
                create_history_entry(
                    db=db,
                    company_id=str(company_id),
                    application_id=str(application.id),
                    candidate_id=str(application.candidate_id) if application.candidate_id else None,
                    job_id=str(application.job_id) if application.job_id else None,
                    action_code="offer_sent",
                    performed_by=current_user.id if current_user else None,  # Integer, not string
                    note=f"Teklif gönderildi. Brüt: {offer.salary_gross} {offer.currency.value if offer.currency else 'TRY'}",
                    action_data={
                        "offer_id": str(offer.id),
                        "salary_gross": float(offer.salary_gross) if offer.salary_gross else None,
                        "salary_net": float(offer.salary_net) if offer.salary_net else None,
                        "currency": offer.currency.value if offer.currency else "TRY",
                        "start_date": offer.start_date.isoformat() if offer.start_date else None,
                        "valid_until": offer.valid_until.isoformat() if offer.valid_until else None,
                    }
                )
            except Exception as history_error:
                # Log but don't fail the offer send
                print(f"Warning: Could not create history entry: {history_error}")
        else:
            db.commit()
        
        db.refresh(offer)
        
        # TODO: Send email to candidate with offer link
        
        return OfferResponseType(
            success=True,
            message="Offer sent successfully",
            offer=_offer_to_type(offer, db)
        )
    except Exception as e:
        db.rollback()
        return OfferResponseType(
            success=False,
            message=str(e),
            offer=None
        )
    finally:
        db.close()


def withdraw_offer(info: Info, id: str) -> OfferResponseType:
    """Withdraw an offer"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        offer = db.query(Offer).filter(
            Offer.id == id,
            Offer.company_id == company_id
        ).first()
        
        if not offer:
            return OfferResponseType(
                success=False,
                message="Offer not found",
                offer=None
            )
        
        # Only allow withdrawal if sent
        if offer.status != OfferStatus.SENT:
            return OfferResponseType(
                success=False,
                message="Only sent offers can be withdrawn",
                offer=None
            )
        
        offer.status = OfferStatus.WITHDRAWN
        db.commit()
        db.refresh(offer)
        
        return OfferResponseType(
            success=True,
            message="Offer withdrawn successfully",
            offer=_offer_to_type(offer, db)
        )
    except Exception as e:
        db.rollback()
        return OfferResponseType(
            success=False,
            message=str(e),
            offer=None
        )
    finally:
        db.close()


# ============================================
# Public Resolvers (for candidate portal)
# ============================================

def get_offer_by_token(token: str) -> Optional[PublicOfferType]:
    """Get offer by token (public - for candidate)"""
    db = get_db_session()
    try:
        from app.models.application import Application
        from app.models.candidate import Candidate
        from app.models.job import Job
        from app.models.company import Company
        
        offer = db.query(Offer).filter(Offer.token == token).first()
        
        if not offer:
            return None
        
        # Mark as viewed
        if not offer.viewed_at:
            offer.viewed_at = datetime.utcnow()
            db.commit()
        
        # Get related data
        application = db.query(Application).filter(Application.id == offer.application_id).first()
        company = db.query(Company).filter(Company.id == offer.company_id).first()
        job_title = ""
        
        if application:
            job = db.query(Job).filter(Job.id == application.job_id).first()
            if job:
                job_title = job.title
        
        # Check if expired
        is_expired = False
        days_remaining = None
        if offer.valid_until:
            today = date.today()
            if offer.valid_until < today:
                is_expired = True
                # Auto-update status
                if offer.status == OfferStatus.SENT:
                    offer.status = OfferStatus.EXPIRED
                    db.commit()
            else:
                days_remaining = (offer.valid_until - today).days
        
        return PublicOfferType(
            id=str(offer.id),
            status=offer.status.value if offer.status else "draft",
            company_name=company.name if company else "",
            company_logo=company.logo_path if company else None,
            job_title=job_title,
            salary_gross=float(offer.salary_gross) if offer.salary_gross else None,
            salary_net=float(offer.salary_net) if offer.salary_net else None,
            currency=offer.currency.value if offer.currency else "TRY",
            start_date=offer.start_date.isoformat() if offer.start_date else None,
            valid_until=offer.valid_until.isoformat() if offer.valid_until else None,
            intro_text=offer.intro_text,
            outro_text=offer.outro_text,
            benefits=_benefits_to_type(offer.benefits),
            pdf_path=offer.pdf_path,
            is_expired=is_expired,
            days_remaining=days_remaining
        )
    finally:
        db.close()


def update_offer_status(
    info: Info, 
    offer_id: str, 
    status: str, 
    note: Optional[str] = None
) -> OfferResponseType:
    """HR updates offer status (accept/reject on behalf of candidate or mark as accepted after verbal confirmation)"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        current_user = get_current_user_from_token(token, db)
        
        offer = db.query(Offer).filter(
            Offer.id == offer_id,
            Offer.company_id == company_id
        ).first()
        
        if not offer:
            return OfferResponseType(
                success=False,
                message="Offer not found",
                offer=None
            )
        
        # Only allow status change if offer was sent
        if offer.status != OfferStatus.SENT:
            return OfferResponseType(
                success=False,
                message="Only sent offers can be accepted/rejected",
                offer=None
            )
        
        # Validate status
        status_lower = status.lower()
        if status_lower == "accepted":
            offer.status = OfferStatus.ACCEPTED
            new_app_status = "OFFER_ACCEPTED"
            history_action = "offer_accepted"
            history_note = "Teklif kabul edildi."
        elif status_lower == "rejected":
            offer.status = OfferStatus.REJECTED
            new_app_status = "OFFER_REJECTED"
            history_action = "offer_rejected"
            history_note = "Teklif reddedildi."
        else:
            return OfferResponseType(
                success=False,
                message="Invalid status. Use 'accepted' or 'rejected'",
                offer=None
            )
        
        offer.responded_at = datetime.utcnow()
        if note:
            offer.response_note = note
            history_note = f"{history_note} Not: {note}"
        
        # Update application status
        from app.models.application import Application, ApplicationStatus
        application = db.query(Application).filter(
            Application.id == offer.application_id
        ).first()
        
        if application:
            application.status = ApplicationStatus[new_app_status]
            db.commit()
            
            # Create history entry
            try:
                from app.modules.history.resolvers import create_history_entry
                create_history_entry(
                    db=db,
                    company_id=str(company_id),
                    application_id=str(application.id),
                    candidate_id=str(application.candidate_id) if application.candidate_id else None,
                    job_id=str(application.job_id) if application.job_id else None,
                    action_code=history_action,
                    performed_by=current_user.id if current_user else None,
                    note=history_note,
                    action_data={
                        "offer_id": str(offer.id),
                        "note": note
                    } if note else {"offer_id": str(offer.id)}
                )
            except Exception as history_error:
                print(f"Warning: Could not create history entry: {history_error}")
        else:
            db.commit()
        
        db.refresh(offer)
        
        return OfferResponseType(
            success=True,
            message=f"Offer marked as {status_lower}",
            offer=_offer_to_type(offer, db)
        )
    except Exception as e:
        db.rollback()
        return OfferResponseType(
            success=False,
            message=str(e),
            offer=None
        )
    finally:
        db.close()


def respond_to_offer(input: OfferResponseInput) -> OfferResponseType:
    """Candidate response to an offer (public)"""
    db = get_db_session()
    try:
        offer = db.query(Offer).filter(Offer.token == input.token).first()
        
        if not offer:
            return OfferResponseType(
                success=False,
                message="Offer not found",
                offer=None
            )
        
        # Only allow response if sent
        if offer.status != OfferStatus.SENT:
            return OfferResponseType(
                success=False,
                message="This offer cannot be responded to",
                offer=None
            )
        
        # Check if expired
        if offer.valid_until and offer.valid_until < date.today():
            offer.status = OfferStatus.EXPIRED
            db.commit()
            return OfferResponseType(
                success=False,
                message="This offer has expired",
                offer=None
            )
        
        # Update based on response
        if input.response == "accepted":
            offer.status = OfferStatus.ACCEPTED
        elif input.response == "rejected":
            offer.status = OfferStatus.REJECTED
        elif input.response == "revision_requested":
            offer.status = OfferStatus.REVISION_REQUESTED
        else:
            return OfferResponseType(
                success=False,
                message="Invalid response",
                offer=None
            )
        
        offer.responded_at = datetime.utcnow()
        offer.response_note = input.note
        
        db.commit()
        db.refresh(offer)
        
        # TODO: Send notification to HR
        
        return OfferResponseType(
            success=True,
            message="Response recorded successfully",
            offer=_offer_to_type(offer, db)
        )
    except Exception as e:
        db.rollback()
        return OfferResponseType(
            success=False,
            message=str(e),
            offer=None
        )
    finally:
        db.close()
