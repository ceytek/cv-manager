"""
Application Service
Handles public and internal job applications, including CV processing and AI matching.
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus
from app.models.candidate import Candidate
from app.models.job import Job
from app.services.file_upload import FileUploadService
from app.services.ai_service_client import ai_service_client
from app.services.email import send_application_notification_email, send_application_confirmation_email

logger = logging.getLogger(__name__)


class ApplicationService:
    """Service for managing job applications."""
    
    def __init__(self, db: Session):
        self.db = db
        self.file_service = FileUploadService()
    
    async def process_public_application(
        self,
        job_id: str,
        full_name: str,
        email: str,
        phone: str,
        cv_file: UploadFile,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Dict[str, Any]:
        """
        Process a public job application end-to-end.
        
        Steps:
        1. Validate job exists and is active
        2. Validate and upload CV file
        3. Parse CV with AI
        4. Create/update candidate record
        5. Perform AI job matching
        6. Create application record with match score
        7. Schedule notification emails
        
        Args:
            job_id: Job UUID
            full_name: Applicant's full name
            email: Applicant's email
            phone: Applicant's phone
            cv_file: Uploaded CV file
            background_tasks: FastAPI background tasks for async operations
        
        Returns:
            Dict with application_id, match_score, and success message
        
        Raises:
            HTTPException: If validation fails or processing errors occur
        """
        try:
            # Step 1: Validate job
            job = self.db.query(Job).filter(Job.id == job_id).first()
            if not job:
                raise HTTPException(status_code=404, detail="Job not found")
            
            if job.status != "active" or not job.is_active:
                raise HTTPException(
                    status_code=400,
                    detail="This job posting is no longer accepting applications"
                )
            
            # Step 2: Validate CV file
            if not cv_file.filename.lower().endswith(('.pdf', '.docx')):
                raise HTTPException(
                    status_code=400,
                    detail="CV must be in PDF or DOCX format"
                )
            
            # Check file size (max 5MB)
            cv_content = await cv_file.read()
            if len(cv_content) > 5 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail="CV file size must be less than 5MB"
                )
            await cv_file.seek(0)  # Reset file pointer
            
            # Step 3: Upload CV file
            logger.info(f"Uploading CV for {full_name} to job {job_id}")
            file_path, file_url = await self.file_service.upload_cv_to_storage(cv_file)
            
            # Step 4: Parse CV with AI
            logger.info(f"Parsing CV for {full_name}")
            parsed_cv = await ai_service_client.parse_cv_file(cv_content, cv_file.filename)
            
            if not parsed_cv or "error" in parsed_cv:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to process CV. Please ensure it's a valid document."
                )
            
            # Check if this is a valid CV
            is_valid_cv = parsed_cv.get('is_valid_cv', {})
            if isinstance(is_valid_cv, dict) and is_valid_cv.get('valid') == False:
                reason = is_valid_cv.get('reason', 'not_a_cv')
                if reason == 'not_a_cv':
                    error_msg = "The uploaded file does not appear to be a CV/Resume."
                elif reason == 'empty_content':
                    error_msg = "The file is empty or unreadable."
                elif reason == 'insufficient_info':
                    error_msg = "The file doesn't contain enough personal/professional information to be considered a CV."
                else:
                    error_msg = "The uploaded file is not a valid CV."
                raise HTTPException(status_code=400, detail=error_msg)
            
            # Extract LinkedIn and GitHub from parsed CV
            personal = parsed_cv.get('personal', {})
            linkedin_url = personal.get('linkedin')
            github_url = personal.get('github')
            
            # Step 5: Create or update candidate
            # Multi-tenancy: existing candidate must belong to same company as job
            candidate = self.db.query(Candidate).filter(
                Candidate.email == email,
                Candidate.company_id == job.company_id
            ).first()
            
            if candidate:
                # Update existing candidate
                logger.info(f"Updating existing candidate: {email}")
                candidate.name = full_name
                candidate.phone = phone
                candidate.cv_file_path = file_path
                candidate.parsed_data = parsed_cv
                candidate.linkedin = linkedin_url
                candidate.github = github_url
                candidate.department_id = job.department_id  # Update to job's department
                candidate.updated_at = datetime.utcnow()
            else:
                # Create new candidate
                logger.info(f"Creating new candidate: {email}")
                
                # Use the job's department (candidates are associated with the job they're applying to)
                candidate = Candidate(
                    id=str(uuid.uuid4()),
                    name=full_name,
                    email=email,
                    phone=phone,
                    linkedin=linkedin_url,
                    github=github_url,
                    cv_file_name=cv_file.filename,
                    cv_file_path=file_path,
                    cv_file_size=len(cv_content),
                    parsed_data=parsed_cv,
                    cv_language=parsed_cv.get("language", "unknown") if parsed_cv else "unknown",
                    department_id=job.department_id,  # Use job's department
                    company_id=job.company_id,
                    status="new"
                )
                self.db.add(candidate)
            
            self.db.flush()  # Get candidate ID
            
            # Step 6: Check if application already exists
            existing_app = self.db.query(Application).filter(
                Application.job_id == job_id,
                Application.candidate_id == candidate.id,
                Application.company_id == job.company_id
            ).first()
            
            if existing_app:
                raise HTTPException(
                    status_code=400,
                    detail="You have already applied to this position"
                )
            
            # Step 7: Perform AI matching
            logger.info(f"Performing AI matching for candidate {candidate.id} and job {job_id}")
            
            # Prepare job data for AI
            job_data = {
                "title": job.title,
                "description": job.description_plain or job.description,
                "requirements": job.requirements_plain or job.requirements,
                "keywords": job.keywords or [],
                "location": job.location,
                "employment_type": job.employment_type,
                "experience_level": job.experience_level,
                "required_education": job.required_education,
                "preferred_majors": job.preferred_majors,
                "required_languages": job.required_languages or {},
                "is_disabled_friendly": job.is_disabled_friendly or False
            }

            # Prepare candidate data for AI (IMPORTANT: wrap parsed_cv under 'parsed_data')
            candidate_payload = {
                "name": full_name,
                "email": email,
                "phone": phone,
                "cv_language": (parsed_cv.get("language") if isinstance(parsed_cv, dict) else None) or getattr(candidate, "cv_language", None) or "unknown",
                "parsed_data": parsed_cv or {}
            }
            
            # Call AI service for matching
            logger.info(
                f"Calling AI matching with job: {job.title} and candidate payload keys: {list(candidate_payload.keys())}"
            )
            matching_result = await ai_service_client.match_cv_to_job(
                job_data=job_data,
                candidate_data=candidate_payload
            )
            
            logger.info(f"AI matching result: {matching_result}")
            
            if not matching_result or "error" in matching_result:
                # Fallback: create application without match score
                logger.warning(f"AI matching failed, creating application without score")
                match_score = None
                overall_score = None
                match_details = {"error": "AI matching unavailable"}
                app_status = ApplicationStatus.PENDING
            else:
                # Extract match score - AI returns "overall_score" field (0-100)
                raw_score = matching_result.get("overall_score", 0)
                
                # Ensure score is an integer between 0-100
                if isinstance(raw_score, (int, float)):
                    match_score = max(0, min(100, int(raw_score)))
                else:
                    match_score = 0
                
                overall_score = match_score  # Set both fields
                match_details = matching_result  # Store complete AI analysis
                app_status = ApplicationStatus.ANALYZED  # Mark as analyzed since AI completed
                
                logger.info(f"AI matching completed with score: {match_score}%")
                logger.info(f"Matched skills: {matching_result.get('matched_skills', [])}")
                logger.info(f"Missing skills: {matching_result.get('missing_skills', [])}")
            
            # Step 8: Create application record
            logger.info(f"Creating application record with match score: {match_score}")
            application = Application(
                id=str(uuid.uuid4()),
                job_id=job_id,
                candidate_id=candidate.id,
                company_id=job.company_id,
                source="public_application",
                analysis_data=match_details if app_status == ApplicationStatus.ANALYZED else None,
                match_score=match_score,
                overall_score=overall_score,
                match_details=match_details,
                applicant_email=email,
                applicant_phone=phone,
                status=app_status,
                analyzed_at=datetime.utcnow() if match_score is not None else None
            )
            self.db.add(application)
            self.db.commit()
            
            logger.info(f"Application created successfully: {application.id}")
            
            # Step 9: Schedule notification emails (background)
            if background_tasks:
                background_tasks.add_task(
                    self._send_notification_emails,
                    application_id=application.id,
                    candidate_name=full_name,
                    candidate_email=email,
                    job_title=job.title,
                    match_score=match_score
                )
            
            return {
                "success": True,
                "application_id": application.id,
                "match_score": match_score,
                "message": "Application submitted successfully. You will receive a confirmation email shortly."
            }
        
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing public application: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="An error occurred while processing your application. Please try again."
            )
    
    def _send_notification_emails(
        self,
        application_id: str,
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        match_score: Optional[int]
    ):
        """
        Send notification emails (HR notification + applicant confirmation).
        
        This runs in the background after application is created.
        """
        try:
            # Send to HR
            send_application_notification_email(
                application_id=application_id,
                candidate_name=candidate_name,
                candidate_email=candidate_email,
                job_title=job_title,
                match_score=match_score
            )
            
            # Optional delay to avoid SMTP per-second limit
            from app.core.config import settings
            delay = getattr(settings, 'EMAIL_INTER_SEND_DELAY_SECONDS', 0)
            if delay and delay > 0:
                import time
                time.sleep(delay)

            # Send to applicant
            send_application_confirmation_email(
                to_email=candidate_email,
                candidate_name=candidate_name,
                job_title=job_title
            )
            
            logger.info(f"Notification emails sent for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to send notification emails: {str(e)}")
            # Don't raise - email failure shouldn't affect application
