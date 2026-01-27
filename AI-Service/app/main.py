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


class GenerateInterviewQuestionsRequest(BaseModel):
    """Request model for AI interview question generation"""
    description: str
    question_count: int = 5
    language: str = "tr"
    question_type: str = "mixed"  # behavioral, situational, technical, conceptual, mixed
    difficulty: str = "intermediate"  # entry, intermediate, advanced


class GeneratedQuestion(BaseModel):
    """Single generated question with type"""
    text: str
    type: str  # behavioral, situational, technical, conceptual


class GenerateInterviewQuestionsResponse(BaseModel):
    """Response model for AI interview question generation"""
    success: bool
    questions: Optional[List[GeneratedQuestion]] = None
    error: Optional[str] = None


class RegenerateSingleQuestionRequest(BaseModel):
    """Request model for regenerating a single question"""
    description: str
    question_type: str  # behavioral, situational, technical, conceptual
    difficulty: str = "intermediate"
    language: str = "tr"
    existing_questions: Optional[List[str]] = None


class RegenerateSingleQuestionResponse(BaseModel):
    """Response model for single question regeneration"""
    success: bool
    question: Optional[GeneratedQuestion] = None
    error: Optional[str] = None


# ============================================
# Likert Question Generation Models
# ============================================

class GenerateLikertQuestionsRequest(BaseModel):
    """Request model for AI Likert question generation"""
    description: str
    question_count: int = 10
    language: str = "tr"
    dimension: str = "mixed"  # leadership, communication, teamwork, problem_solving, stress_management, adaptability, motivation, integrity, mixed
    direction: str = "mixed"  # positive, negative, mixed
    scale_type: int = 5  # 5 or 7 point scale


class GeneratedLikertQuestion(BaseModel):
    """Single generated Likert question with dimension and direction"""
    text: str
    dimension: str  # leadership, communication, teamwork, etc.
    direction: str  # positive or negative


class GenerateLikertQuestionsResponse(BaseModel):
    """Response model for AI Likert question generation"""
    success: bool
    questions: Optional[List[GeneratedLikertQuestion]] = None
    error: Optional[str] = None


class RegenerateSingleLikertQuestionRequest(BaseModel):
    """Request model for regenerating a single Likert question"""
    description: str
    dimension: str  # leadership, communication, teamwork, etc.
    direction: str  # positive or negative
    language: str = "tr"
    existing_questions: Optional[List[str]] = None


class RegenerateSingleLikertQuestionResponse(BaseModel):
    """Response model for single Likert question regeneration"""
    success: bool
    question: Optional[GeneratedLikertQuestion] = None
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
# Interview Question Generator Endpoint
# ============================================

@app.post("/generate-interview-questions", response_model=GenerateInterviewQuestionsResponse)
async def generate_interview_questions(request: GenerateInterviewQuestionsRequest):
    """
    Generate interview questions using AI based on job description/context.
    
    Args:
        request: Contains description, question_count, language, question_type, difficulty
        
    Returns:
        List of generated interview questions with their types
    """
    try:
        # Validate required fields
        if not request.description or not request.description.strip():
            raise HTTPException(status_code=400, detail="description is required")
        
        # Validate question count
        question_count = max(1, min(15, request.question_count))
        
        # Validate language
        language = request.language.lower() if request.language else "tr"
        if language not in ["tr", "en"]:
            language = "tr"
        
        # Validate question type
        valid_types = ["behavioral", "situational", "technical", "conceptual", "mixed"]
        question_type = request.question_type.lower() if request.question_type else "mixed"
        if question_type not in valid_types:
            question_type = "mixed"
        
        # Validate difficulty
        valid_difficulties = ["entry", "intermediate", "advanced"]
        difficulty = request.difficulty.lower() if request.difficulty else "intermediate"
        if difficulty not in valid_difficulties:
            difficulty = "intermediate"
        
        # Import prompt and OpenAI
        from app.prompts.interview_question_generator_prompt import (
            get_interview_question_generator_prompt,
            get_system_message
        )
        from openai import OpenAI
        import json
        
        # Initialize OpenAI client
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Generate prompt with new parameters
        prompt = get_interview_question_generator_prompt(
            description=request.description,
            question_count=question_count,
            language=language,
            question_type=question_type,
            difficulty=difficulty
        )
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": get_system_message(language)
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        response_text = response.choices[0].message.content
        response_data = json.loads(response_text)
        
        # Check if description was validated as invalid
        if response_data.get("valid") == False:
            # Return error message based on requested language
            if language == "tr":
                error_message = "Açıklama bir iş pozisyonu, rol veya profesyonel bağlamla ilgili olmalıdır. Lütfen geçerli bir iş tanımı girin."
            else:
                error_message = "The description must be about a job position, role, or professional context. Please provide a valid job description."
            return GenerateInterviewQuestionsResponse(
                success=False,
                error=error_message
            )
        
        raw_questions = response_data.get("questions", [])
        
        # Convert to GeneratedQuestion objects
        questions = []
        for q in raw_questions[:question_count]:
            if isinstance(q, dict):
                questions.append(GeneratedQuestion(
                    text=q.get("text", ""),
                    type=q.get("type", question_type if question_type != "mixed" else "behavioral")
                ))
            elif isinstance(q, str):
                # Fallback for old format (just string)
                questions.append(GeneratedQuestion(
                    text=q,
                    type=question_type if question_type != "mixed" else "behavioral"
                ))
        
        return GenerateInterviewQuestionsResponse(
            success=True,
            questions=questions
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error generating interview questions: {e}")
        return GenerateInterviewQuestionsResponse(
            success=False,
            error=str(e)
        )


@app.post("/regenerate-single-question", response_model=RegenerateSingleQuestionResponse)
async def regenerate_single_question(request: RegenerateSingleQuestionRequest):
    """
    Regenerate a single interview question.
    
    Args:
        request: Contains description, question_type, difficulty, language, existing_questions
        
    Returns:
        A single regenerated question
    """
    try:
        # Validate required fields
        if not request.description or not request.description.strip():
            raise HTTPException(status_code=400, detail="description is required")
        
        # Validate question type
        valid_types = ["behavioral", "situational", "technical", "conceptual"]
        question_type = request.question_type.lower() if request.question_type else "behavioral"
        if question_type not in valid_types:
            question_type = "behavioral"
        
        # Validate difficulty
        valid_difficulties = ["entry", "intermediate", "advanced"]
        difficulty = request.difficulty.lower() if request.difficulty else "intermediate"
        if difficulty not in valid_difficulties:
            difficulty = "intermediate"
        
        # Validate language
        language = request.language.lower() if request.language else "tr"
        if language not in ["tr", "en"]:
            language = "tr"
        
        # Import prompt and OpenAI
        from app.prompts.interview_question_generator_prompt import (
            get_single_question_regenerate_prompt,
            get_system_message
        )
        from openai import OpenAI
        import json
        
        # Initialize OpenAI client
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Generate prompt for single question
        prompt = get_single_question_regenerate_prompt(
            description=request.description,
            question_type=question_type,
            difficulty=difficulty,
            language=language,
            existing_questions=request.existing_questions
        )
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": get_system_message(language)
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,  # Slightly higher for more variety
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        response_text = response.choices[0].message.content
        response_data = json.loads(response_text)
        
        question = GeneratedQuestion(
            text=response_data.get("text", ""),
            type=response_data.get("type", question_type)
        )
        
        return RegenerateSingleQuestionResponse(
            success=True,
            question=question
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error regenerating single question: {e}")
        return RegenerateSingleQuestionResponse(
            success=False,
            error=str(e)
        )


# ============================================
# Likert Question Generator Endpoints
# ============================================

@app.post("/generate-likert-questions", response_model=GenerateLikertQuestionsResponse)
async def generate_likert_questions(request: GenerateLikertQuestionsRequest):
    """
    Generate Likert scale questions using AI based on dimension and settings.
    
    Args:
        request: Contains description, question_count, language, dimension, direction, scale_type
        
    Returns:
        List of generated Likert questions with dimensions and directions
    """
    try:
        # Validate required fields
        if not request.description or not request.description.strip():
            raise HTTPException(status_code=400, detail="description is required")
        
        # Validate question count (1-30)
        question_count = max(1, min(30, request.question_count))
        
        # Validate language
        language = request.language.lower() if request.language else "tr"
        if language not in ["tr", "en"]:
            language = "tr"
        
        # Validate dimension
        valid_dimensions = ["leadership", "communication", "teamwork", "problem_solving", 
                          "stress_management", "adaptability", "motivation", "integrity", "mixed"]
        dimension = request.dimension.lower() if request.dimension else "mixed"
        if dimension not in valid_dimensions:
            dimension = "mixed"
        
        # Validate direction
        valid_directions = ["positive", "negative", "mixed"]
        direction = request.direction.lower() if request.direction else "mixed"
        if direction not in valid_directions:
            direction = "mixed"
        
        # Validate scale type
        scale_type = request.scale_type if request.scale_type in [5, 7] else 5
        
        # Import prompt and OpenAI
        from app.prompts.likert_question_generator_prompt import (
            get_likert_question_generator_prompt,
            get_system_message
        )
        from openai import OpenAI
        import json
        
        # Initialize OpenAI client
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Generate prompt with parameters
        prompt = get_likert_question_generator_prompt(
            description=request.description,
            question_count=question_count,
            language=language,
            dimension=dimension,
            direction=direction,
            scale_type=scale_type
        )
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": get_system_message(language)
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        response_text = response.choices[0].message.content
        response_data = json.loads(response_text)
        
        raw_questions = response_data.get("questions", [])
        
        # Convert to GeneratedLikertQuestion objects
        questions = []
        for q in raw_questions[:question_count]:
            if isinstance(q, dict):
                questions.append(GeneratedLikertQuestion(
                    text=q.get("text", ""),
                    dimension=q.get("dimension", dimension if dimension != "mixed" else "leadership"),
                    direction=q.get("direction", "positive")
                ))
            elif isinstance(q, str):
                questions.append(GeneratedLikertQuestion(
                    text=q,
                    dimension=dimension if dimension != "mixed" else "leadership",
                    direction="positive"
                ))
        
        return GenerateLikertQuestionsResponse(
            success=True,
            questions=questions
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error generating Likert questions: {e}")
        return GenerateLikertQuestionsResponse(
            success=False,
            error=str(e)
        )


@app.post("/regenerate-single-likert-question", response_model=RegenerateSingleLikertQuestionResponse)
async def regenerate_single_likert_question(request: RegenerateSingleLikertQuestionRequest):
    """
    Regenerate a single Likert question.
    
    Args:
        request: Contains description, dimension, direction, language, existing_questions
        
    Returns:
        A single regenerated Likert question
    """
    try:
        # Validate required fields
        if not request.description or not request.description.strip():
            raise HTTPException(status_code=400, detail="description is required")
        
        # Validate dimension
        valid_dimensions = ["leadership", "communication", "teamwork", "problem_solving", 
                          "stress_management", "adaptability", "motivation", "integrity"]
        dimension = request.dimension.lower() if request.dimension else "leadership"
        if dimension not in valid_dimensions:
            dimension = "leadership"
        
        # Validate direction
        valid_directions = ["positive", "negative"]
        direction = request.direction.lower() if request.direction else "positive"
        if direction not in valid_directions:
            direction = "positive"
        
        # Validate language
        language = request.language.lower() if request.language else "tr"
        if language not in ["tr", "en"]:
            language = "tr"
        
        # Import prompt and OpenAI
        from app.prompts.likert_question_generator_prompt import (
            get_single_likert_question_regenerate_prompt,
            get_system_message
        )
        from openai import OpenAI
        import json
        
        # Initialize OpenAI client
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Generate prompt for single question
        prompt = get_single_likert_question_regenerate_prompt(
            description=request.description,
            dimension=dimension,
            direction=direction,
            language=language,
            existing_questions=request.existing_questions
        )
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": get_system_message(language)
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        response_text = response.choices[0].message.content
        response_data = json.loads(response_text)
        
        question = GeneratedLikertQuestion(
            text=response_data.get("text", ""),
            dimension=response_data.get("dimension", dimension),
            direction=response_data.get("direction", direction)
        )
        
        return RegenerateSingleLikertQuestionResponse(
            success=True,
            question=question
        )
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error regenerating single Likert question: {e}")
        return RegenerateSingleLikertQuestionResponse(
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
