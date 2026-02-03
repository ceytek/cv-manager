"""
GraphQL Resolvers for Shortlist Module (Long List / Short List)

Flow:
- Tümü (Pool) → Long List'e Ekle → Long List
- Long List → Short List'e Ekle → Short List
- Long List → Long List'ten Çıkar → Tümü
- Short List → Short List'ten Çıkar → Tümü
"""

from typing import List, Optional
from datetime import datetime, timedelta
from strawberry.types import Info
import os

from app.modules.common import get_db_session
from app.api.dependencies import get_current_user_from_token, get_company_id_from_token
from .models import ShortlistShare
from .types import (
    ShortlistShareType,
    ShortlistShareInput,
    ShortlistShareResponseType,
    ShortlistToggleResponseType,
    BulkShortlistResponseType,
    ShortlistToggleInput,
    BulkShortlistInput,
    PublicShortlistType,
    PublicShortlistCandidateType,
    # Long List types
    LonglistToggleResponseType,
    BulkLonglistResponseType,
    LonglistToggleInput,
    BulkLonglistInput,
)


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


def _get_share_url(token: str) -> str:
    """Generate the public share URL"""
    base_url = os.getenv("FRONTEND_URL", "https://app.hrsmart.co")
    return f"{base_url}/shortlist/{token}"


def _share_to_type(share: ShortlistShare, db) -> ShortlistShareType:
    """Convert ShortlistShare model to GraphQL type"""
    from app.models.job import Job
    from app.models.application import Application
    
    # Get job title
    job_title = None
    job = db.query(Job).filter(Job.id == share.job_id).first()
    if job:
        job_title = job.title
    
    # Get list_type (default to 'shortlist' for backward compatibility)
    list_type = getattr(share, 'list_type', 'shortlist') or 'shortlist'
    
    # Count candidates based on list type
    if list_type == 'longlist':
        # Long List: Only candidates in longlist but NOT in shortlist
        shortlisted_count = db.query(Application).filter(
            Application.job_id == share.job_id,
            Application.is_in_longlist == True,
            Application.is_shortlisted == False  # Exclude shortlisted candidates
        ).count()
    else:
        shortlisted_count = db.query(Application).filter(
            Application.job_id == share.job_id,
            Application.is_shortlisted == True
        ).count()
    
    # Get creator name
    creator_name = None
    if share.creator:
        creator_name = share.creator.full_name
    
    return ShortlistShareType(
        id=str(share.id),
        job_id=share.job_id,
        token=share.token,
        title=share.title,
        message=share.message,
        expires_at=share.expires_at.isoformat() if share.expires_at else None,
        is_active=share.is_active,
        created_at=share.created_at.isoformat() if share.created_at else None,
        viewed_at=share.viewed_at.isoformat() if share.viewed_at else None,
        view_count=share.view_count,
        share_url=_get_share_url(share.token),
        is_expired=share.is_expired,
        list_type=list_type,
        job_title=job_title,
        shortlisted_count=shortlisted_count,
        creator_name=creator_name,
    )


# ============================================
# Long List Toggle Resolvers
# ============================================

def toggle_longlist(info: Info, input: LonglistToggleInput) -> LonglistToggleResponseType:
    """Toggle longlist status for a single application (add to longlist from pool)"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        from app.models.application import Application
        from app.modules.history.resolvers import create_history_entry
        
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        current_user = get_current_user_from_token(token, db)
        
        # Find application
        application = db.query(Application).filter(
            Application.id == input.application_id,
            Application.company_id == company_id
        ).first()
        
        if not application:
            return LonglistToggleResponseType(
                success=False,
                message="Application not found",
                application_id=input.application_id,
                is_in_longlist=None
            )
        
        # Toggle longlist status
        was_in_longlist = application.is_in_longlist or False
        new_status = not was_in_longlist
        
        application.is_in_longlist = new_status
        
        if new_status:
            # Adding to longlist
            application.longlist_at = datetime.utcnow()
            application.longlist_by = current_user.id if current_user else None
            application.longlist_note = input.note
            action_code = "longlist_added"
            history_note = f"Long List'e eklendi. Not: {input.note}" if input.note else "Long List'e eklendi."
        else:
            # Removing from longlist (goes back to pool)
            application.longlist_at = None
            application.longlist_by = None
            application.longlist_note = None
            action_code = "longlist_removed"
            history_note = "Long List'ten çıkarıldı."
        
        db.commit()
        
        # Create history entry
        try:
            create_history_entry(
                db=db,
                company_id=str(company_id),
                application_id=str(application.id),
                candidate_id=str(application.candidate_id) if application.candidate_id else None,
                job_id=str(application.job_id) if application.job_id else None,
                action_code=action_code,
                performed_by=current_user.id if current_user else None,
                note=history_note,
                action_data={"note": input.note} if input.note else None
            )
        except Exception as history_error:
            print(f"Warning: Could not create history entry: {history_error}")
        
        return LonglistToggleResponseType(
            success=True,
            message="Long List'e eklendi" if new_status else "Long List'ten çıkarıldı",
            application_id=input.application_id,
            is_in_longlist=new_status
        )
    except Exception as e:
        db.rollback()
        return LonglistToggleResponseType(
            success=False,
            message=str(e),
            application_id=input.application_id,
            is_in_longlist=None
        )
    finally:
        db.close()


def bulk_toggle_longlist(info: Info, input: BulkLonglistInput) -> BulkLonglistResponseType:
    """Bulk add/remove applications from longlist"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        from app.models.application import Application
        from app.modules.history.resolvers import create_history_entry
        
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        current_user = get_current_user_from_token(token, db)
        
        # Find all applications
        applications = db.query(Application).filter(
            Application.id.in_(input.application_ids),
            Application.company_id == company_id
        ).all()
        
        if not applications:
            return BulkLonglistResponseType(
                success=False,
                message="No applications found",
                updated_count=0,
                application_ids=[]
            )
        
        updated_ids = []
        
        for app in applications:
            # Only update if status is different
            current_status = app.is_in_longlist or False
            if current_status != input.add_to_longlist:
                app.is_in_longlist = input.add_to_longlist
                
                if input.add_to_longlist:
                    app.longlist_at = datetime.utcnow()
                    app.longlist_by = current_user.id if current_user else None
                    app.longlist_note = input.note
                    action_code = "longlist_added"
                    history_note = f"Long List'e eklendi (toplu). Not: {input.note}" if input.note else "Long List'e eklendi (toplu)."
                else:
                    app.longlist_at = None
                    app.longlist_by = None
                    app.longlist_note = None
                    action_code = "longlist_removed"
                    history_note = "Long List'ten çıkarıldı (toplu)."
                
                updated_ids.append(app.id)
                
                # Create history entry for each
                try:
                    create_history_entry(
                        db=db,
                        company_id=str(company_id),
                        application_id=str(app.id),
                        candidate_id=str(app.candidate_id) if app.candidate_id else None,
                        job_id=str(app.job_id) if app.job_id else None,
                        action_code=action_code,
                        performed_by=current_user.id if current_user else None,
                        note=history_note,
                        action_data={"note": input.note, "bulk": True} if input.note else {"bulk": True}
                    )
                except Exception as history_error:
                    print(f"Warning: Could not create history entry: {history_error}")
        
        db.commit()
        
        action_text = "Long List'e eklendi" if input.add_to_longlist else "Long List'ten çıkarıldı"
        return BulkLonglistResponseType(
            success=True,
            message=f"{len(updated_ids)} aday {action_text}",
            updated_count=len(updated_ids),
            application_ids=updated_ids
        )
    except Exception as e:
        db.rollback()
        return BulkLonglistResponseType(
            success=False,
            message=str(e),
            updated_count=0,
            application_ids=[]
        )
    finally:
        db.close()


# ============================================
# Shortlist Toggle Resolvers
# ============================================

def toggle_shortlist(info: Info, input: ShortlistToggleInput) -> ShortlistToggleResponseType:
    """Toggle shortlist status for a single application (from longlist to shortlist or remove from shortlist)"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        from app.models.application import Application
        from app.modules.history.resolvers import create_history_entry
        
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        current_user = get_current_user_from_token(token, db)
        
        # Find application
        application = db.query(Application).filter(
            Application.id == input.application_id,
            Application.company_id == company_id
        ).first()
        
        if not application:
            return ShortlistToggleResponseType(
                success=False,
                message="Application not found",
                application_id=input.application_id,
                is_shortlisted=None
            )
        
        # Toggle shortlist status
        was_shortlisted = application.is_shortlisted or False
        new_status = not was_shortlisted
        
        application.is_shortlisted = new_status
        
        if new_status:
            # Adding to shortlist (from longlist)
            application.shortlisted_at = datetime.utcnow()
            application.shortlisted_by = current_user.id if current_user else None
            application.shortlist_note = input.note
            # Keep is_in_longlist as True - candidate was in longlist before
            action_code = "shortlist_added"
            history_note = f"Short List'e eklendi. Not: {input.note}" if input.note else "Short List'e eklendi."
        else:
            # Removing from shortlist - goes back to POOL (Tümü), not longlist!
            application.shortlisted_at = None
            application.shortlisted_by = None
            application.shortlist_note = None
            # Also remove from longlist - back to pool
            application.is_in_longlist = False
            application.longlist_at = None
            application.longlist_by = None
            application.longlist_note = None
            action_code = "shortlist_removed"
            history_note = "Short List'ten çıkarıldı (Havuza döndü)."
        
        db.commit()
        
        # Create history entry
        try:
            create_history_entry(
                db=db,
                company_id=str(company_id),
                application_id=str(application.id),
                candidate_id=str(application.candidate_id) if application.candidate_id else None,
                job_id=str(application.job_id) if application.job_id else None,
                action_code=action_code,
                performed_by=current_user.id if current_user else None,
                note=history_note,
                action_data={"note": input.note} if input.note else None
            )
        except Exception as history_error:
            print(f"Warning: Could not create history entry: {history_error}")
        
        return ShortlistToggleResponseType(
            success=True,
            message="Short List'e eklendi" if new_status else "Short List'ten çıkarıldı",
            application_id=input.application_id,
            is_shortlisted=new_status
        )
    except Exception as e:
        db.rollback()
        return ShortlistToggleResponseType(
            success=False,
            message=str(e),
            application_id=input.application_id,
            is_shortlisted=None
        )
    finally:
        db.close()


def bulk_toggle_shortlist(info: Info, input: BulkShortlistInput) -> BulkShortlistResponseType:
    """Bulk add/remove applications from shortlist"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        from app.models.application import Application
        from app.modules.history.resolvers import create_history_entry
        
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        current_user = get_current_user_from_token(token, db)
        
        # Find all applications
        applications = db.query(Application).filter(
            Application.id.in_(input.application_ids),
            Application.company_id == company_id
        ).all()
        
        if not applications:
            return BulkShortlistResponseType(
                success=False,
                message="No applications found",
                updated_count=0,
                application_ids=[]
            )
        
        updated_ids = []
        
        for app in applications:
            # Only update if status is different
            current_status = app.is_shortlisted or False
            if current_status != input.add_to_shortlist:
                app.is_shortlisted = input.add_to_shortlist
                
                if input.add_to_shortlist:
                    # Adding to shortlist
                    app.shortlisted_at = datetime.utcnow()
                    app.shortlisted_by = current_user.id if current_user else None
                    app.shortlist_note = input.note
                    action_code = "shortlist_added"
                    history_note = f"Short List'e eklendi (toplu). Not: {input.note}" if input.note else "Short List'e eklendi (toplu)."
                else:
                    # Removing from shortlist - goes back to POOL (Tümü)
                    app.shortlisted_at = None
                    app.shortlisted_by = None
                    app.shortlist_note = None
                    # Also remove from longlist - back to pool
                    app.is_in_longlist = False
                    app.longlist_at = None
                    app.longlist_by = None
                    app.longlist_note = None
                    action_code = "shortlist_removed"
                    history_note = "Short List'ten çıkarıldı (toplu, Havuza döndü)."
                
                updated_ids.append(app.id)
                
                # Create history entry for each
                try:
                    create_history_entry(
                        db=db,
                        company_id=str(company_id),
                        application_id=str(app.id),
                        candidate_id=str(app.candidate_id) if app.candidate_id else None,
                        job_id=str(app.job_id) if app.job_id else None,
                        action_code=action_code,
                        performed_by=current_user.id if current_user else None,
                        note=history_note,
                        action_data={"note": input.note, "bulk": True} if input.note else {"bulk": True}
                    )
                except Exception as history_error:
                    print(f"Warning: Could not create history entry: {history_error}")
        
        db.commit()
        
        action_text = "Short List'e eklendi" if input.add_to_shortlist else "Short List'ten çıkarıldı"
        return BulkShortlistResponseType(
            success=True,
            message=f"{len(updated_ids)} aday {action_text}",
            updated_count=len(updated_ids),
            application_ids=updated_ids
        )
    except Exception as e:
        db.rollback()
        return BulkShortlistResponseType(
            success=False,
            message=str(e),
            updated_count=0,
            application_ids=[]
        )
    finally:
        db.close()


# ============================================
# Shortlist Share Resolvers
# ============================================

def get_shortlist_shares(info: Info, job_id: Optional[str] = None, list_type: Optional[str] = None) -> List[ShortlistShareType]:
    """Get all shortlist/longlist shares for the company"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        query = db.query(ShortlistShare).filter(
            ShortlistShare.company_id == company_id,
            ShortlistShare.is_active == True
        )
        
        if job_id:
            query = query.filter(ShortlistShare.job_id == job_id)
        
        if list_type:
            query = query.filter(ShortlistShare.list_type == list_type)
        
        shares = query.order_by(ShortlistShare.created_at.desc()).all()
        return [_share_to_type(s, db) for s in shares]
    finally:
        db.close()


def get_shortlist_share(info: Info, id: str) -> Optional[ShortlistShareType]:
    """Get a single shortlist share by ID"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        share = db.query(ShortlistShare).filter(
            ShortlistShare.id == id,
            ShortlistShare.company_id == company_id
        ).first()
        
        if not share:
            return None
        
        return _share_to_type(share, db)
    finally:
        db.close()


def create_shortlist_share(info: Info, input: ShortlistShareInput) -> ShortlistShareResponseType:
    """Create a new shortlist share link"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        from app.models.job import Job
        
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        current_user = get_current_user_from_token(token, db)
        
        # Verify job belongs to company
        job = db.query(Job).filter(
            Job.id == input.job_id,
            Job.company_id == company_id
        ).first()
        
        if not job:
            return ShortlistShareResponseType(
                success=False,
                message="Job not found",
                share=None
            )
        
        # Calculate expiration
        expires_at = None
        if input.expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=input.expires_in_days)
        
        # Create share
        list_type = getattr(input, 'list_type', 'shortlist') or 'shortlist'
        share = ShortlistShare(
            job_id=input.job_id,
            company_id=company_id,
            title=input.title,
            message=input.message,
            expires_at=expires_at,
            created_by=current_user.id if current_user else None,
            list_type=list_type
        )
        
        db.add(share)
        db.commit()
        db.refresh(share)
        
        return ShortlistShareResponseType(
            success=True,
            message="Paylaşım linki oluşturuldu",
            share=_share_to_type(share, db)
        )
    except Exception as e:
        db.rollback()
        return ShortlistShareResponseType(
            success=False,
            message=str(e),
            share=None
        )
    finally:
        db.close()


def delete_shortlist_share(info: Info, id: str) -> ShortlistShareResponseType:
    """Delete (deactivate) a shortlist share"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        if not company_id:
            raise Exception("Company context required")
        
        share = db.query(ShortlistShare).filter(
            ShortlistShare.id == id,
            ShortlistShare.company_id == company_id
        ).first()
        
        if not share:
            return ShortlistShareResponseType(
                success=False,
                message="Share not found",
                share=None
            )
        
        share.is_active = False
        db.commit()
        
        return ShortlistShareResponseType(
            success=True,
            message="Paylaşım linki silindi",
            share=None
        )
    except Exception as e:
        db.rollback()
        return ShortlistShareResponseType(
            success=False,
            message=str(e),
            share=None
        )
    finally:
        db.close()


# ============================================
# Public Resolvers (for hiring manager view)
# ============================================

def get_public_shortlist(token: str) -> Optional[PublicShortlistType]:
    """Get public shortlist by token (no auth required)"""
    db = get_db_session()
    try:
        from app.models.application import Application
        from app.models.candidate import Candidate
        from app.models.job import Job
        from app.models.company import Company
        
        # Find share by token
        share = db.query(ShortlistShare).filter(
            ShortlistShare.token == token,
            ShortlistShare.is_active == True
        ).first()
        
        if not share:
            return None
        
        # Check if expired
        if share.is_expired:
            return None
        
        # Update view count
        if not share.viewed_at:
            share.viewed_at = datetime.utcnow()
        share.view_count += 1
        db.commit()
        
        # Get job info
        job = db.query(Job).filter(Job.id == share.job_id).first()
        if not job:
            return None
        
        # Get company info
        company = db.query(Company).filter(Company.id == share.company_id).first()
        
        # Get department name
        department_name = None
        if job.department:
            department_name = job.department.name
        
        # Get list_type (default to 'shortlist' for backward compatibility)
        list_type = getattr(share, 'list_type', 'shortlist') or 'shortlist'
        
        # Get candidates based on list type
        if list_type == 'longlist':
            # Long List: Only candidates in longlist but NOT in shortlist
            applications = db.query(Application).filter(
                Application.job_id == share.job_id,
                Application.is_in_longlist == True,
                Application.is_shortlisted == False  # Exclude shortlisted candidates
            ).order_by(Application.longlist_at.desc()).all()
        else:
            applications = db.query(Application).filter(
                Application.job_id == share.job_id,
                Application.is_shortlisted == True
            ).order_by(Application.shortlisted_at.desc()).all()
        
        candidates = []
        for app in applications:
            candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
            if not candidate:
                continue
            
            # Extract safe info from analysis_data
            experience_summary = None
            education_summary = None
            skills = []
            
            if app.analysis_data:
                # Safely extract summaries
                if 'experience_analysis' in app.analysis_data:
                    exp_data = app.analysis_data['experience_analysis']
                    if isinstance(exp_data, dict):
                        experience_summary = exp_data.get('summary')
                
                if 'education_analysis' in app.analysis_data:
                    edu_data = app.analysis_data['education_analysis']
                    if isinstance(edu_data, dict):
                        education_summary = edu_data.get('summary')
                
                if 'skills_analysis' in app.analysis_data:
                    skills_data = app.analysis_data['skills_analysis']
                    if isinstance(skills_data, dict):
                        skills = skills_data.get('matched_skills', [])[:10]  # Limit to 10
            
            # Get note and date based on list type
            if list_type == 'longlist':
                note = app.longlist_note
                added_at = app.longlist_at.isoformat() if app.longlist_at else None
            else:
                note = app.shortlist_note
                added_at = app.shortlisted_at.isoformat() if app.shortlisted_at else None
            
            candidates.append(PublicShortlistCandidateType(
                id=app.id,
                name=candidate.name,
                email=candidate.email,
                phone=candidate.phone,
                overall_score=app.overall_score,
                shortlist_note=note,
                shortlisted_at=added_at,
                experience_summary=experience_summary,
                education_summary=education_summary,
                skills=skills,
                location=candidate.location,
                cv_url=candidate.cv_file_path  # Expose CV for hiring manager to download
            ))
        
        return PublicShortlistType(
            id=str(share.id),
            title=share.title,
            message=share.message,
            job_title=job.title,
            job_location=job.location,
            job_department=department_name,
            company_name=company.name if company else "",
            company_logo=company.logo_url if company else None,
            list_type=list_type,
            candidates=candidates,
            candidate_count=len(candidates),
            created_at=share.created_at.isoformat() if share.created_at else None,
            expires_at=share.expires_at.isoformat() if share.expires_at else None,
            is_expired=share.is_expired,
        )
    finally:
        db.close()
