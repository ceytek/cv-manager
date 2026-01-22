"""
GraphQL Resolvers for Talent Pool Module
"""
from typing import List, Optional
from datetime import datetime

from strawberry.types import Info

from app.api.dependencies import get_company_id_from_token, get_current_user_from_token
from app.modules.common import get_db_session, MessageType
from app.modules.talent_pool.models import TalentPoolEntry, TalentPoolTag, TalentPoolCandidateTag
from app.modules.talent_pool.types import (
    TalentPoolTagType,
    TalentPoolTagInput,
    TalentPoolTagUpdateInput,
    TalentPoolTagResponse,
    TalentPoolEntryType,
    TalentPoolEntryInput,
    TalentPoolBulkAddInput,
    TalentPoolEntryUpdateInput,
    TalentPoolEntryResponse,
    TalentPoolBulkResponse,
    TalentPoolCandidateType,
    TalentPoolSourceJobType,
    TalentPoolAddedByType,
    TalentPoolFilterInput,
    TalentPoolStatsType,
    TalentPoolAssignToJobInput,
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


def _build_entry_type(entry: TalentPoolEntry, db) -> TalentPoolEntryType:
    """Helper to build TalentPoolEntryType from model"""
    # Get candidate info
    candidate_type = None
    if entry.candidate:
        candidate_type = TalentPoolCandidateType(
            id=str(entry.candidate.id),
            name=entry.candidate.name or "",
            email=entry.candidate.email,
            phone=entry.candidate.phone,
            cv_photo_path=entry.candidate.cv_photo_path,
            location=entry.candidate.location,
            experience_months=entry.candidate.experience_months,
            cv_file_name=entry.candidate.cv_file_name,
        )
    
    # Get source job info
    source_job_type = None
    if entry.source_job:
        source_job_type = TalentPoolSourceJobType(
            id=str(entry.source_job.id),
            title=entry.source_job.title,
        )
    
    # Get added by info
    added_by_type = None
    if entry.added_by_user:
        added_by_type = TalentPoolAddedByType(
            id=entry.added_by_user.id,
            full_name=entry.added_by_user.full_name or "",
        )
    
    # Get tags
    tags = []
    for ct in entry.tags:
        if ct.tag:
            tags.append(TalentPoolTagType(
                id=str(ct.tag.id),
                name=ct.tag.name,
                color=ct.tag.color,
                is_system=ct.tag.is_system,
                is_active=ct.tag.is_active,
                usage_count=0,
            ))
    
    return TalentPoolEntryType(
        id=str(entry.id),
        notes=entry.notes,
        status=entry.status,
        added_at=entry.added_at.isoformat() if entry.added_at else None,
        updated_at=entry.updated_at.isoformat() if entry.updated_at else None,
        candidate=candidate_type,
        source_job=source_job_type,
        added_by=added_by_type,
        tags=tags,
    )


# ============ Tag Query Resolvers ============

def get_talent_pool_tags(info: Info) -> List[TalentPoolTagType]:
    """Get all talent pool tags for the current company (including system tags)"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        # Get company-specific tags and system tags
        tags = db.query(TalentPoolTag).filter(
            (TalentPoolTag.company_id == company_id) | (TalentPoolTag.is_system == True)
        ).order_by(TalentPoolTag.is_system.desc(), TalentPoolTag.name).all()
        
        result = []
        for tag in tags:
            # Count usage
            usage_count = db.query(TalentPoolCandidateTag).filter(
                TalentPoolCandidateTag.tag_id == tag.id
            ).count()
            
            result.append(TalentPoolTagType(
                id=str(tag.id),
                name=tag.name,
                color=tag.color,
                is_system=tag.is_system,
                is_active=tag.is_active,
                usage_count=usage_count,
                created_at=tag.created_at.isoformat() if tag.created_at else None,
            ))
        
        return result
    finally:
        db.close()


# ============ Tag Mutation Resolvers ============

async def create_talent_pool_tag(info: Info, input: TalentPoolTagInput) -> TalentPoolTagResponse:
    """Create a new talent pool tag"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        # Check if tag with same name exists
        existing = db.query(TalentPoolTag).filter(
            TalentPoolTag.company_id == company_id,
            TalentPoolTag.name == input.name
        ).first()
        
        if existing:
            return TalentPoolTagResponse(
                success=False,
                message="Bu isimde bir etiket zaten mevcut",
                tag=None
            )
        
        tag = TalentPoolTag(
            company_id=company_id,
            name=input.name,
            color=input.color,
            is_system=False,
            is_active=True,
        )
        db.add(tag)
        db.commit()
        db.refresh(tag)
        
        return TalentPoolTagResponse(
            success=True,
            message="Etiket başarıyla oluşturuldu",
            tag=TalentPoolTagType(
                id=str(tag.id),
                name=tag.name,
                color=tag.color,
                is_system=tag.is_system,
                is_active=tag.is_active,
                usage_count=0,
                created_at=tag.created_at.isoformat() if tag.created_at else None,
            )
        )
    except Exception as e:
        db.rollback()
        return TalentPoolTagResponse(success=False, message=str(e), tag=None)
    finally:
        db.close()


async def update_talent_pool_tag(info: Info, id: str, input: TalentPoolTagUpdateInput) -> TalentPoolTagResponse:
    """Update a talent pool tag"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        tag = db.query(TalentPoolTag).filter(
            TalentPoolTag.id == id,
            TalentPoolTag.company_id == company_id
        ).first()
        
        if not tag:
            return TalentPoolTagResponse(success=False, message="Etiket bulunamadı", tag=None)
        
        if tag.is_system:
            return TalentPoolTagResponse(success=False, message="Sistem etiketleri düzenlenemez", tag=None)
        
        if input.name is not None:
            tag.name = input.name
        if input.color is not None:
            tag.color = input.color
        if input.is_active is not None:
            tag.is_active = input.is_active
        
        db.commit()
        db.refresh(tag)
        
        usage_count = db.query(TalentPoolCandidateTag).filter(
            TalentPoolCandidateTag.tag_id == tag.id
        ).count()
        
        return TalentPoolTagResponse(
            success=True,
            message="Etiket güncellendi",
            tag=TalentPoolTagType(
                id=str(tag.id),
                name=tag.name,
                color=tag.color,
                is_system=tag.is_system,
                is_active=tag.is_active,
                usage_count=usage_count,
                created_at=tag.created_at.isoformat() if tag.created_at else None,
            )
        )
    except Exception as e:
        db.rollback()
        return TalentPoolTagResponse(success=False, message=str(e), tag=None)
    finally:
        db.close()


async def delete_talent_pool_tag(info: Info, id: str) -> MessageType:
    """Delete a talent pool tag"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        tag = db.query(TalentPoolTag).filter(
            TalentPoolTag.id == id,
            TalentPoolTag.company_id == company_id
        ).first()
        
        if not tag:
            return MessageType(success=False, message="Etiket bulunamadı")
        
        if tag.is_system:
            return MessageType(success=False, message="Sistem etiketleri silinemez")
        
        db.delete(tag)
        db.commit()
        
        return MessageType(success=True, message="Etiket silindi")
    except Exception as e:
        db.rollback()
        return MessageType(success=False, message=str(e))
    finally:
        db.close()


# ============ Entry Query Resolvers ============

def get_talent_pool_entries(info: Info, filter: Optional[TalentPoolFilterInput] = None) -> List[TalentPoolEntryType]:
    """Get all talent pool entries with optional filtering"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        from app.models.candidate import Candidate
        from sqlalchemy.orm import joinedload, selectinload
        
        query = db.query(TalentPoolEntry).options(
            joinedload(TalentPoolEntry.candidate),
            joinedload(TalentPoolEntry.source_job),
            joinedload(TalentPoolEntry.added_by_user),
            selectinload(TalentPoolEntry.tags).joinedload(TalentPoolCandidateTag.tag),
        ).filter(
            TalentPoolEntry.company_id == company_id
        )
        
        # Apply filters
        if filter:
            if filter.status:
                query = query.filter(TalentPoolEntry.status == filter.status)
            
            if filter.search:
                query = query.join(Candidate).filter(
                    (Candidate.name.ilike(f"%{filter.search}%")) |
                    (Candidate.email.ilike(f"%{filter.search}%"))
                )
            
            if filter.tag_ids:
                # Filter by tags - entry must have at least one of the specified tags
                query = query.join(TalentPoolCandidateTag).filter(
                    TalentPoolCandidateTag.tag_id.in_(filter.tag_ids)
                ).distinct()
            
            # Sorting
            sort_order = filter.sort_order or "desc"
            if filter.sort_by == "name":
                if not filter.search:  # Only join if not already joined
                    query = query.join(Candidate)
                if sort_order == "asc":
                    query = query.order_by(Candidate.name.asc())
                else:
                    query = query.order_by(Candidate.name.desc())
            else:  # Default: added_at
                if sort_order == "asc":
                    query = query.order_by(TalentPoolEntry.added_at.asc())
                else:
                    query = query.order_by(TalentPoolEntry.added_at.desc())
        else:
            query = query.order_by(TalentPoolEntry.added_at.desc())
        
        entries = query.all()
        
        return [_build_entry_type(entry, db) for entry in entries]
    finally:
        db.close()


def get_talent_pool_entry(info: Info, id: str) -> Optional[TalentPoolEntryType]:
    """Get a single talent pool entry by ID"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        entry = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.id == id,
            TalentPoolEntry.company_id == company_id
        ).first()
        
        if not entry:
            return None
        
        return _build_entry_type(entry, db)
    finally:
        db.close()


def get_talent_pool_stats(info: Info) -> TalentPoolStatsType:
    """Get talent pool statistics"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        total = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.company_id == company_id
        ).count()
        
        active = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.company_id == company_id,
            TalentPoolEntry.status == "active"
        ).count()
        
        archived = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.company_id == company_id,
            TalentPoolEntry.status == "archived"
        ).count()
        
        tags_count = db.query(TalentPoolTag).filter(
            (TalentPoolTag.company_id == company_id) | (TalentPoolTag.is_system == True)
        ).count()
        
        return TalentPoolStatsType(
            total_candidates=total,
            active_candidates=active,
            archived_candidates=archived,
            total_tags=tags_count,
        )
    finally:
        db.close()


# ============ Entry Mutation Resolvers ============

async def add_to_talent_pool(info: Info, input: TalentPoolEntryInput) -> TalentPoolEntryResponse:
    """Add a candidate to the talent pool"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        current_user = get_current_user_from_token(token, db)
        
        # Check if already in pool
        existing = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.company_id == company_id,
            TalentPoolEntry.candidate_id == input.candidate_id
        ).first()
        
        if existing:
            return TalentPoolEntryResponse(
                success=False,
                message="Bu aday zaten yetenek havuzunda",
                entry=None
            )
        
        # Create entry
        entry = TalentPoolEntry(
            candidate_id=input.candidate_id,
            company_id=company_id,
            added_by=current_user.id if current_user else None,
            source_job_id=input.source_job_id,
            notes=input.notes,
            status="active",
        )
        db.add(entry)
        db.flush()
        
        # Add tags
        for tag_id in input.tag_ids:
            candidate_tag = TalentPoolCandidateTag(
                entry_id=entry.id,
                tag_id=tag_id,
            )
            db.add(candidate_tag)
        
        db.commit()
        db.refresh(entry)
        
        return TalentPoolEntryResponse(
            success=True,
            message="Aday yetenek havuzuna eklendi",
            entry=_build_entry_type(entry, db)
        )
    except Exception as e:
        db.rollback()
        return TalentPoolEntryResponse(success=False, message=str(e), entry=None)
    finally:
        db.close()


async def bulk_add_to_talent_pool(info: Info, input: TalentPoolBulkAddInput) -> TalentPoolBulkResponse:
    """Bulk add candidates to the talent pool"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        current_user = get_current_user_from_token(token, db)
        
        added_count = 0
        skipped_count = 0
        
        for candidate_id in input.candidate_ids:
            # Check if already in pool
            existing = db.query(TalentPoolEntry).filter(
                TalentPoolEntry.company_id == company_id,
                TalentPoolEntry.candidate_id == candidate_id
            ).first()
            
            if existing:
                skipped_count += 1
                continue
            
            # Create entry
            entry = TalentPoolEntry(
                candidate_id=candidate_id,
                company_id=company_id,
                added_by=current_user.id if current_user else None,
                source_job_id=input.source_job_id,
                notes=input.notes,
                status="active",
            )
            db.add(entry)
            db.flush()
            
            # Add tags
            for tag_id in input.tag_ids:
                candidate_tag = TalentPoolCandidateTag(
                    entry_id=entry.id,
                    tag_id=tag_id,
                )
                db.add(candidate_tag)
            
            added_count += 1
        
        db.commit()
        
        return TalentPoolBulkResponse(
            success=True,
            message=f"{added_count} aday eklendi, {skipped_count} aday zaten havuzda",
            added_count=added_count,
            skipped_count=skipped_count,
        )
    except Exception as e:
        db.rollback()
        return TalentPoolBulkResponse(success=False, message=str(e), added_count=0, skipped_count=0)
    finally:
        db.close()


async def update_talent_pool_entry(info: Info, id: str, input: TalentPoolEntryUpdateInput) -> TalentPoolEntryResponse:
    """Update a talent pool entry (notes, tags)"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        entry = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.id == id,
            TalentPoolEntry.company_id == company_id
        ).first()
        
        if not entry:
            return TalentPoolEntryResponse(success=False, message="Kayıt bulunamadı", entry=None)
        
        if input.notes is not None:
            entry.notes = input.notes
        
        # Update tags if provided
        if input.tag_ids is not None:
            # Remove existing tags
            db.query(TalentPoolCandidateTag).filter(
                TalentPoolCandidateTag.entry_id == entry.id
            ).delete()
            
            # Add new tags
            for tag_id in input.tag_ids:
                candidate_tag = TalentPoolCandidateTag(
                    entry_id=entry.id,
                    tag_id=tag_id,
                )
                db.add(candidate_tag)
        
        db.commit()
        db.refresh(entry)
        
        return TalentPoolEntryResponse(
            success=True,
            message="Kayıt güncellendi",
            entry=_build_entry_type(entry, db)
        )
    except Exception as e:
        db.rollback()
        return TalentPoolEntryResponse(success=False, message=str(e), entry=None)
    finally:
        db.close()


async def archive_talent_pool_entry(info: Info, id: str) -> TalentPoolEntryResponse:
    """Archive a talent pool entry"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        entry = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.id == id,
            TalentPoolEntry.company_id == company_id
        ).first()
        
        if not entry:
            return TalentPoolEntryResponse(success=False, message="Kayıt bulunamadı", entry=None)
        
        entry.status = "archived"
        db.commit()
        db.refresh(entry)
        
        return TalentPoolEntryResponse(
            success=True,
            message="Aday arşivlendi",
            entry=_build_entry_type(entry, db)
        )
    except Exception as e:
        db.rollback()
        return TalentPoolEntryResponse(success=False, message=str(e), entry=None)
    finally:
        db.close()


async def restore_talent_pool_entry(info: Info, id: str) -> TalentPoolEntryResponse:
    """Restore an archived talent pool entry"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        entry = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.id == id,
            TalentPoolEntry.company_id == company_id
        ).first()
        
        if not entry:
            return TalentPoolEntryResponse(success=False, message="Kayıt bulunamadı", entry=None)
        
        entry.status = "active"
        db.commit()
        db.refresh(entry)
        
        return TalentPoolEntryResponse(
            success=True,
            message="Aday yeniden aktifleştirildi",
            entry=_build_entry_type(entry, db)
        )
    except Exception as e:
        db.rollback()
        return TalentPoolEntryResponse(success=False, message=str(e), entry=None)
    finally:
        db.close()


async def remove_from_talent_pool(info: Info, id: str) -> MessageType:
    """Permanently remove a candidate from the talent pool"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        entry = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.id == id,
            TalentPoolEntry.company_id == company_id
        ).first()
        
        if not entry:
            return MessageType(success=False, message="Kayıt bulunamadı")
        
        db.delete(entry)
        db.commit()
        
        return MessageType(success=True, message="Aday havuzdan çıkarıldı")
    except Exception as e:
        db.rollback()
        return MessageType(success=False, message=str(e))
    finally:
        db.close()


async def assign_to_job_from_pool(info: Info, input: TalentPoolAssignToJobInput) -> TalentPoolEntryResponse:
    """Assign a candidate from talent pool to a job/department"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        from app.models.candidate import Candidate
        
        entry = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.id == input.entry_id,
            TalentPoolEntry.company_id == company_id
        ).first()
        
        if not entry:
            return TalentPoolEntryResponse(success=False, message="Kayıt bulunamadı", entry=None)
        
        # Update candidate's department
        candidate = db.query(Candidate).filter(Candidate.id == entry.candidate_id).first()
        if candidate:
            candidate.department_id = input.department_id
        
        # Optionally remove from pool
        if input.remove_from_pool:
            db.delete(entry)
            db.commit()
            return TalentPoolEntryResponse(
                success=True,
                message="Aday ilana atandı ve havuzdan çıkarıldı",
                entry=None
            )
        else:
            db.commit()
            db.refresh(entry)
            return TalentPoolEntryResponse(
                success=True,
                message="Aday ilana atandı",
                entry=_build_entry_type(entry, db)
            )
    except Exception as e:
        db.rollback()
        return TalentPoolEntryResponse(success=False, message=str(e), entry=None)
    finally:
        db.close()


# Check if candidate is in talent pool (helper for UI)
def is_candidate_in_talent_pool(info: Info, candidate_id: str) -> bool:
    """Check if a candidate is already in the talent pool"""
    token = _get_auth_info(info)
    
    db = get_db_session()
    try:
        company_id = get_company_id_from_token(token)
        
        exists = db.query(TalentPoolEntry).filter(
            TalentPoolEntry.company_id == company_id,
            TalentPoolEntry.candidate_id == candidate_id
        ).first() is not None
        
        return exists
    finally:
        db.close()
