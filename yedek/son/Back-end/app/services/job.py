"""
Job Service
Business logic for job CRUD operations
Completely separate from User/Auth services
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException
from typing import Optional, List
from datetime import date
from uuid import UUID

from app.models.job import Job
from app.models.department import Department
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    """Service for managing job postings"""

    @staticmethod
    def get_by_id(db: Session, job_id: str, company_id: Optional[UUID] = None) -> Job:
        """Get job by ID"""
        query = db.query(Job).filter(Job.id == job_id)
        if company_id:
            query = query.filter(Job.company_id == company_id)
        job = query.first()
        if not job:
            raise HTTPException(status_code=404, detail="İş ilanı bulunamadı")
        return job

    @staticmethod
    def get_by_department(db: Session, department_id: str, include_inactive: bool = False, company_id: Optional[UUID] = None) -> List[Job]:
        """Get all jobs for a specific department"""
        query = db.query(Job).filter(Job.department_id == department_id)
        if company_id:
            query = query.filter(Job.company_id == company_id)
        if not include_inactive:
            query = query.filter(Job.is_active == True)
        return query.order_by(Job.created_at.desc()).all()

    @staticmethod
    def list_all(
        db: Session,
        include_inactive: bool = False,
        status: Optional[str] = None,
        department_id: Optional[str] = None,
        search_term: Optional[str] = None,
        company_id: Optional[UUID] = None
    ) -> List[Job]:
        """
        List all jobs with optional filters
        
        Args:
            db: Database session
            include_inactive: Include soft-deleted jobs
            status: Filter by status (draft/active/closed/archived)
            department_id: Filter by department
            search_term: Search in title, description, requirements
            company_id: Filter by company (multi-tenancy)
        """
        query = db.query(Job)

        # Filter by company (multi-tenancy)
        if company_id:
            query = query.filter(Job.company_id == company_id)

        # Filter by active status
        if not include_inactive:
            query = query.filter(Job.is_active == True)

        # Filter by status
        if status:
            query = query.filter(Job.status == status)

        # Filter by department
        if department_id:
            query = query.filter(Job.department_id == department_id)

        # Search in title, description, requirements
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.filter(
                or_(
                    Job.title.ilike(search_pattern),
                    Job.description.ilike(search_pattern),
                    Job.requirements.ilike(search_pattern)
                )
            )

        return query.order_by(Job.created_at.desc()).all()

    @staticmethod
    def create(db: Session, job_data: JobCreate, company_id: Optional[UUID] = None) -> Job:
        """Create a new job"""
        # Validate department exists
        dept_query = db.query(Department).filter(Department.id == job_data.department_id)
        if company_id:
            dept_query = dept_query.filter(Department.company_id == company_id)
        department = dept_query.first()
        if not department:
            raise HTTPException(status_code=400, detail="Departman bulunamadı")

        # Check for duplicate title in same department (optional business rule)
        dup_query = db.query(Job).filter(
            and_(
                Job.title == job_data.title,
                Job.department_id == job_data.department_id,
                Job.is_active == True
            )
        )
        if company_id:
            dup_query = dup_query.filter(Job.company_id == company_id)
        existing = dup_query.first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Bu departmanda aynı başlıkta aktif bir ilan zaten mevcut"
            )

        # Create job
        job = Job(
            title=job_data.title,
            department_id=job_data.department_id,
            description=job_data.description,
            description_plain=job_data.description_plain,
            requirements=job_data.requirements,
            requirements_plain=job_data.requirements_plain,
            keywords=job_data.keywords or [],
            location=job_data.location,
            remote_policy=job_data.remote_policy,
            employment_type=job_data.employment_type,
            experience_level=job_data.experience_level,
            required_education=job_data.required_education,
            preferred_majors=job_data.preferred_majors,
            required_languages=job_data.required_languages or {},
            salary_min=job_data.salary_min,
            salary_max=job_data.salary_max,
            salary_currency=job_data.salary_currency,
            deadline=job_data.deadline,
            start_date=job_data.start_date,
            status=job_data.status,
            is_active=job_data.is_active,
            company_id=company_id
        )

        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def update(db: Session, job_id: str, job_data: JobUpdate, company_id: Optional[UUID] = None) -> Job:
        """Update an existing job"""
        job = JobService.get_by_id(db, job_id, company_id=company_id)

        # Validate department if changed
        if job_data.department_id:
            dept_query = db.query(Department).filter(Department.id == job_data.department_id)
            if company_id:
                dept_query = dept_query.filter(Department.company_id == company_id)
            department = dept_query.first()
            if not department:
                raise HTTPException(status_code=400, detail="Departman bulunamadı")

        # Check for title conflict if title or department changed
        if job_data.title or job_data.department_id:
            new_title = job_data.title if job_data.title else job.title
            new_dept = job_data.department_id if job_data.department_id else job.department_id
            
            conflict_query = db.query(Job).filter(
                and_(
                    Job.title == new_title,
                    Job.department_id == new_dept,
                    Job.id != job_id,
                    Job.is_active == True
                )
            )
            if company_id:
                conflict_query = conflict_query.filter(Job.company_id == company_id)
            existing = conflict_query.first()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Bu departmanda aynı başlıkta başka bir aktif ilan mevcut"
                )

        # Update fields
        update_data = job_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)

        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def toggle_active(db: Session, job_id: str, company_id: Optional[UUID] = None) -> Job:
        """Toggle job active status (soft delete)"""
        job = JobService.get_by_id(db, job_id, company_id=company_id)
        job.is_active = not job.is_active
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def change_status(db: Session, job_id: str, new_status: str, company_id: Optional[UUID] = None) -> Job:
        """Change job status (draft/active/closed/archived)"""
        allowed_statuses = ['draft', 'active', 'closed', 'archived']
        if new_status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Geçersiz durum. İzin verilenler: {', '.join(allowed_statuses)}"
            )

        job = JobService.get_by_id(db, job_id, company_id=company_id)
        job.status = new_status
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def get_active_count_by_department(db: Session, department_id: str, company_id: Optional[UUID] = None) -> int:
        """Get count of active jobs in a department"""
        count_query = db.query(Job).filter(
            and_(
                Job.department_id == department_id,
                Job.is_active == True,
                Job.status == 'active'
            )
        )
        if company_id:
            count_query = count_query.filter(Job.company_id == company_id)
        return count_query.count()

    @staticmethod
    def close_expired_jobs(db: Session, company_id: Optional[UUID] = None) -> int:
        """Auto-close jobs past their deadline (scheduled task)"""
        today = date.today()
        exp_query = db.query(Job).filter(
            and_(
                Job.deadline < today,
                Job.status == 'active',
                Job.is_active == True
            )
        )
        if company_id:
            exp_query = exp_query.filter(Job.company_id == company_id)
        expired_jobs = exp_query.all()

        for job in expired_jobs:
            job.status = 'closed'

        db.commit()
        return len(expired_jobs)
