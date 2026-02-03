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
from app.models.company import Company
from app.modules.job_intro.models import JobIntroTemplate
from app.modules.job_outro.models import JobOutroTemplate

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
        
        # Return public-safe data with intro/outro from templates if not set on job
        result = []
        for job in jobs:
            intro_text = job.intro_text
            outro_text = job.outro_text
            company_info = None
            
            # Get company info and default templates if available
            if job.company_id:
                company = db.query(Company).filter(Company.id == job.company_id).first()
                if company:
                    company_info = {
                        "name": company.name,
                        "logo_url": company.logo_url,
                        "about": company.about
                    }
                    
                    # If job doesn't have intro_text, get the first active intro template
                    if not intro_text:
                        intro_template = db.query(JobIntroTemplate).filter(
                            JobIntroTemplate.company_id == job.company_id,
                            JobIntroTemplate.is_active == True
                        ).first()
                        if intro_template:
                            intro_text = intro_template.content
                    
                    # If job doesn't have outro_text, get the first active outro template
                    if not outro_text:
                        outro_template = db.query(JobOutroTemplate).filter(
                            JobOutroTemplate.company_id == job.company_id,
                            JobOutroTemplate.is_active == True
                        ).first()
                        if outro_template:
                            outro_text = outro_template.content
            
            result.append({
                "id": job.id,
                "title": job.title,
                "department_id": job.department_id,
                "intro_text": intro_text,
                "outro_text": outro_text,
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
                "company": company_info
            })
        
        return result
    
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
    - Detailed job information with company info and intro/outro texts
    """
    try:
        job = JobService.get_by_id(db=db, job_id=job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Only allow access to active jobs
        if job.status != "active" or not job.is_active:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get company information and default templates
        company_info = None
        intro_text = job.intro_text
        outro_text = job.outro_text
        
        if job.company_id:
            company = db.query(Company).filter(Company.id == job.company_id).first()
            if company:
                company_info = {
                    "name": company.name,
                    "logo_url": company.logo_url,
                    "about": company.about
                }
                
                # If job doesn't have intro_text, get the first active intro template for the company
                if not intro_text:
                    intro_template = db.query(JobIntroTemplate).filter(
                        JobIntroTemplate.company_id == job.company_id,
                        JobIntroTemplate.is_active == True
                    ).first()
                    if intro_template:
                        intro_text = intro_template.content
                
                # If job doesn't have outro_text, get the first active outro template for the company
                if not outro_text:
                    outro_template = db.query(JobOutroTemplate).filter(
                        JobOutroTemplate.company_id == job.company_id,
                        JobOutroTemplate.is_active == True
                    ).first()
                    if outro_template:
                        outro_text = outro_template.content
        
        return {
            "success": True,
            "job": {
                "id": job.id,
                "title": job.title,
                "department_id": job.department_id,
                "intro_text": intro_text,  # Job introduction/preamble (or default template)
                "outro_text": outro_text,  # Job conclusion/what we offer (or default template)
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
            },
            "company": company_info
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
