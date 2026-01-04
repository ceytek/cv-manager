"""
AI Service - FastAPI Application
Handles CV parsing and job matching with OpenAI
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn

from app.config import settings
from app.services.cv_parser import cv_parser_service
from app.services.job_matcher_service import get_job_matcher_service
from app.services.compare_service import get_compare_service
from app.services.job_generator_service import get_job_generator_service
from app.services.interview_analyzer_service import get_interview_analyzer_service

# Initialize FastAPI app
app = FastAPI(
    title="AI Service",
    description="CV Parsing and Job Matching with OpenAI",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],  # Back-end URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Request/Response Models
# ============================================

class ParseCVTextRequest(BaseModel):
    """Request model for parsing CV text"""
    cv_text: str


class ParseCVResponse(BaseModel):
    """Response model for CV parsing"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class MatchCVToJobRequest(BaseModel):
    """Request model for CV to Job matching"""
    job_data: Dict[str, Any]
    candidate_data: Dict[str, Any]
    language: Optional[str] = "turkish"


class MatchCVToJobResponse(BaseModel):
    """Response model for CV to Job matching"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class CompareCVsRequest(BaseModel):
    """Request model for comparing exactly two candidates"""
    candidate_a: Dict[str, Any]
    candidate_b: Dict[str, Any]
    job_data: Optional[Dict[str, Any]] = None
    language: Optional[str] = "turkish"


class CompareCVsResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class LanguageRequirement(BaseModel):
    """Language requirement model"""
    name: str
    level: str


class GenerateJobRequest(BaseModel):
    """Request model for AI job description generation"""
    position: str
    department: Optional[str] = None
    location: str
    employment_type: str = "full-time"
    experience_level: Optional[str] = None
    required_skills: List[str] = []
    required_languages: List[LanguageRequirement] = []
    additional_notes: Optional[str] = None
    language: str = "turkish"


class GenerateJobResponse(BaseModel):
    """Response model for AI job description generation"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class QuestionAnswer(BaseModel):
    """Question-Answer pair for interview analysis"""
    question: str
    answer: str
    order: int = 0


class AnalyzeInterviewRequest(BaseModel):
    """Request model for interview analysis"""
    job_context: Dict[str, Any]
    questions_answers: List[QuestionAnswer]
    language: str = "tr"


class AnalyzeInterviewResponse(BaseModel):
    """Response model for interview analysis"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ============================================
# Health Check
# ============================================

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Service",
        "model": settings.MODEL_NAME
    }


# ============================================
# CV Parsing Endpoints
# ============================================

@app.post("/parse-cv-file", response_model=ParseCVResponse)
async def parse_cv_file(file: UploadFile = File(...)):
    """
    Parse CV from uploaded file (PDF or DOCX)
    
    Args:
        file: Uploaded CV file
        
    Returns:
        Structured CV data
    """
    try:
        # Read file content
        file_content = await file.read()
        
        # Validate file size (max 10MB)
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
        # Parse CV
        parsed_data = await cv_parser_service.parse_cv_file(
            file_content=file_content,
            filename=file.filename
        )
        
        return ParseCVResponse(
            success=True,
            data=parsed_data
        )
        
    except Exception as e:
        return ParseCVResponse(
            success=False,
            error=str(e)
        )


@app.post("/parse-cv-text", response_model=ParseCVResponse)
async def parse_cv_text(request: ParseCVTextRequest):
    """
    Parse CV from plain text
    
    Args:
        request: Contains CV text
        
    Returns:
        Structured CV data
    """
    try:
        # Validate text length
        if not request.cv_text or len(request.cv_text) < 50:
            raise HTTPException(status_code=400, detail="CV text too short")
        
        # Parse CV
        parsed_data = await cv_parser_service.parse_cv(request.cv_text)
        
        return ParseCVResponse(
            success=True,
            data=parsed_data
        )
        
    except Exception as e:
        return ParseCVResponse(
            success=False,
            error=str(e)
        )


# ============================================
# Job Matching Endpoints
# ============================================

@app.post("/match-cv-to-job", response_model=MatchCVToJobResponse)
async def match_cv_to_job(request: MatchCVToJobRequest):
    """
    Match a candidate's CV to a job posting using AI analysis.
    
    Args:
        request: Contains job_data and candidate_data
        
    Returns:
        Analysis results with scores, recommendations, and detailed breakdown
    """
    try:
        # Validate required fields
        if not request.job_data:
            raise HTTPException(status_code=400, detail="job_data is required")
        
        if not request.candidate_data:
            raise HTTPException(status_code=400, detail="candidate_data is required")
        
        # Get job matcher service
        matcher_service = get_job_matcher_service()
        
        # Perform matching analysis
        analysis_result = await matcher_service.match_cv_to_job(
            job_data=request.job_data,
            candidate_data=request.candidate_data,
            language=request.language or "turkish"
        )
        
        return MatchCVToJobResponse(
            success=True,
            data=analysis_result
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        return MatchCVToJobResponse(
            success=False,
            error=str(e)
        )


# ============================================
# Two-CV Comparison Endpoint
# ============================================

@app.post("/compare-cvs", response_model=CompareCVsResponse)
async def compare_cvs(request: CompareCVsRequest):
    """
    Compare exactly two candidates (ephemeral). No persistence.
    Uses parsed_data slices only; do not send raw CV text.
    """
    try:
        # Quick sanity: ensure minimal payloads
        if not request.candidate_a or not request.candidate_b:
            raise HTTPException(status_code=400, detail="candidate_a and candidate_b are required")

        # Limit list lengths to keep token usage predictable
        def _trim(c: Dict[str, Any]) -> Dict[str, Any]:
            pd = (c or {}).get("parsed_data") or {}
            for k in ("skills", "languages", "education", "experience"):
                if isinstance(pd.get(k), list) and len(pd[k]) > 30:
                    pd[k] = pd[k][:30]
            c = dict(c)
            c["parsed_data"] = pd
            # Drop cv_text if present
            c.pop("cv_text", None)
            return c

        a = _trim(request.candidate_a)
        b = _trim(request.candidate_b)
        job = request.job_data
        language = request.language or "turkish"

        service = get_compare_service()
        data = await service.compare_two_cvs(a, b, job, language)
        return CompareCVsResponse(success=True, data=data)

    except HTTPException:
        raise
    except Exception as e:
        return CompareCVsResponse(success=False, error=str(e))


# ============================================
# Job Description Generator Endpoint
# ============================================

@app.post("/generate-job-description", response_model=GenerateJobResponse)
async def generate_job_description(request: GenerateJobRequest):
    """
    Generate a professional job description using AI based on basic parameters.
    
    Args:
        request: Contains position, department, location, employment_type, 
                 experience_level, required_skills, additional_notes, language
        
    Returns:
        Generated job data matching database schema with:
        - title, description (HTML), description_plain
        - requirements (HTML), requirements_plain
        - keywords, preferred_majors, required_languages, start_date
    """
    try:
        # Validate required fields
        if not request.position or not request.position.strip():
            raise HTTPException(status_code=400, detail="position is required")
        
        if not request.location or not request.location.strip():
            raise HTTPException(status_code=400, detail="location is required")
        
        # Get job generator service
        generator_service = get_job_generator_service()
        
        # Generate job description
        job_data = await generator_service.generate_job_description(
            position=request.position,
            department=request.department,
            location=request.location,
            employment_type=request.employment_type,
            experience_level=request.experience_level,
            required_skills=request.required_skills,
            required_languages=[
                {"name": lang.name, "level": lang.level}
                for lang in request.required_languages
            ],
            additional_notes=request.additional_notes,
            language=request.language
        )
        
        return GenerateJobResponse(
            success=True,
            data=job_data
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        return GenerateJobResponse(
            success=False,
            error=str(e)
        )


# ============================================
# Interview Analysis Endpoint
# ============================================

@app.post("/analyze-interview", response_model=AnalyzeInterviewResponse)
async def analyze_interview(request: AnalyzeInterviewRequest):
    """
    Analyze interview responses using AI.
    
    Evaluates candidate's interview answers across 5 categories:
    - Content Relevance
    - Communication Skills
    - Learning & Impact
    - Problem Solving
    - Teamwork
    
    Args:
        request: Contains job_context, questions_answers, and language
        
    Returns:
        AI analysis with overall score, category scores, and detailed feedback
    """
    try:
        # Validate required fields
        if not request.job_context:
            raise HTTPException(status_code=400, detail="job_context is required")
        
        if not request.questions_answers:
            raise HTTPException(status_code=400, detail="questions_answers is required")
        
        # Get analyzer service
        analyzer_service = get_interview_analyzer_service()
        
        # Convert to dict format expected by service
        qa_list = [
            {
                "question": qa.question,
                "answer": qa.answer,
                "order": qa.order
            }
            for qa in request.questions_answers
        ]
        
        # Perform analysis
        analysis_result = await analyzer_service.analyze_interview(
            job_context=request.job_context,
            questions_answers=qa_list,
            language=request.language
        )
        
        # Check for errors in result
        if "error" in analysis_result and analysis_result.get("overall_score", 0) == 0:
            return AnalyzeInterviewResponse(
                success=False,
                error=analysis_result.get("error", "Unknown error")
            )
        
        return AnalyzeInterviewResponse(
            success=True,
            data=analysis_result
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        return AnalyzeInterviewResponse(
            success=False,
            error=str(e)
        )


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.AI_SERVICE_PORT,
        reload=True
    )
