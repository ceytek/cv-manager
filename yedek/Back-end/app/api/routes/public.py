"""
Public API Routes
These endpoints are accessible without authentication for the public career page.
Includes: job listings, job details, and public application submission.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from app.core.database import get_db
from app.services.job import JobService
from app.services.application_service import ApplicationService
from app.api.dependencies import rate_limit_public

logger = logging.getLogger(__name__)

# Create router with prefix
router = APIRouter(
    prefix="/api/public",
    tags=["public"]
)


@router.get("/jobs")
async def get_public_jobs(
    location: Optional[str] = None,
    department_id: Optional[str] = None,
    employment_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of active job postings (public access).
    
    Query Parameters:
    - location: Filter by location
    - department_id: Filter by department
    - employment_type: full-time, part-time, contract, internship
    - experience_level: entry, junior, mid, senior, lead
    - search: Search in title, description, keywords
    
    Returns:
    - List of active jobs with basic information
    """
    try:
        # Only return active jobs for public
        jobs = JobService.list_all(
            db=db,
            include_inactive=False,
            status="active"
        )
        
        # Apply filters
        if location:
            jobs = [j for j in jobs if j.location.lower() == location.lower()]
        
        if department_id:
            jobs = [j for j in jobs if j.department_id == department_id]
        
        if employment_type:
            jobs = [j for j in jobs if j.employment_type == employment_type]
        
        if experience_level:
            jobs = [j for j in jobs if j.experience_level == experience_level]
        
        if search:
            search_lower = search.lower()
            jobs = [
                j for j in jobs 
                if search_lower in j.title.lower() 
                or search_lower in (j.description_plain or j.description or "").lower()
                or any(search_lower in k.lower() for k in (j.keywords or []))
            ]
        
        # Return public-safe data (no internal analysis counts, etc.)
        return [
            {
                "id": job.id,
                "title": job.title,
                "department_id": job.department_id,
                "description": job.description,
                "description_plain": job.description_plain,
                "requirements": job.requirements,
                "requirements_plain": job.requirements_plain,
                "keywords": job.keywords,
                "location": job.location,
                "remote_policy": job.remote_policy,
                "employment_type": job.employment_type,
                "experience_level": job.experience_level,
                "required_education": job.required_education,
                "preferred_majors": job.preferred_majors,
                "required_languages": job.required_languages,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "salary_currency": job.salary_currency,
                "deadline": job.deadline.isoformat() if job.deadline else None,
                "start_date": job.start_date,
                "created_at": job.created_at.isoformat(),
            }
            for job in jobs
        ]
    
    except Exception as e:
        logger.error(f"Error fetching public jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/jobs/{job_id}")
async def get_public_job_detail(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific job (public access).
    
    Path Parameters:
    - job_id: Job UUID
    
    Returns:
    - Detailed job information
    """
    try:
        job = JobService.get_by_id(db=db, job_id=job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Only allow access to active jobs
        if job.status != "active" or not job.is_active:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "success": True,
            "job": {
                "id": job.id,
                "title": job.title,
                "department_id": job.department_id,
                "description": job.description,
                "description_plain": job.description_plain,
                "requirements": job.requirements,
                "requirements_plain": job.requirements_plain,
                "keywords": job.keywords,
                "location": job.location,
                "remote_policy": job.remote_policy,
                "employment_type": job.employment_type,
                "experience_level": job.experience_level,
                "required_education": job.required_education,
                "preferred_majors": job.preferred_majors,
                "required_languages": job.required_languages,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "salary_currency": job.salary_currency,
                "deadline": job.deadline.isoformat() if job.deadline else None,
                "start_date": job.start_date,
                "created_at": job.created_at.isoformat(),
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch job details")


@router.post("/apply", dependencies=[Depends(rate_limit_public)])
async def submit_public_application(
    job_id: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    cv_file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Submit a job application (public access with rate limiting).
    
    Form Data:
    - job_id: UUID of the job
    - full_name: Applicant's full name
    - email: Applicant's email
    - phone: Applicant's phone number
    - cv_file: CV file (PDF or DOCX, max 5MB)
    
    Process:
    1. Validate job exists and is active
    2. Upload and parse CV
    3. Create/update candidate record
    4. Perform AI matching analysis
    5. Create application record with match score
    6. Send notification email to HR
    7. Send confirmation email to applicant
    
    Returns:
    - Application ID and success message
    """
    try:
        # Initialize application service
        app_service = ApplicationService(db)
        
        # Process the application (this handles all steps internally)
        result = await app_service.process_public_application(
            job_id=job_id,
            full_name=full_name,
            email=email,
            phone=phone,
            cv_file=cv_file,
            background_tasks=background_tasks
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing application: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process application. Please try again later."
        )
