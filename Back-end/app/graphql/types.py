"""
GraphQL Type Definitions
"""
import strawberry
from datetime import datetime
from typing import Optional, List
from strawberry.file_uploads import Upload

@strawberry.type
class StatsType:
    """Lightweight global stats for dashboard"""
    candidate_count: int = strawberry.field(name="candidateCount")
    job_count: int = strawberry.field(name="jobCount")
    application_count: int = strawberry.field(name="applicationCount")
    department_count: int = strawberry.field(name="departmentCount")


@strawberry.type
class UserType:
    """GraphQL User type"""
    id: int
    email: str
    full_name: str = strawberry.field(name="fullName")
    is_active: bool = strawberry.field(name="isActive")
    is_verified: bool = strawberry.field(name="isVerified")
    role: Optional[str] = None
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")


@strawberry.type
class DepartmentType:
    """GraphQL Department type"""
    id: str
    name: str
    is_active: bool = strawberry.field(name="isActive")
    created_at: datetime = strawberry.field(name="createdAt")
    updated_at: datetime = strawberry.field(name="updatedAt")


@strawberry.type
class TokenType:
    """GraphQL Token type"""
    access_token: str = strawberry.field(name="accessToken")
    refresh_token: str = strawberry.field(name="refreshToken")
    token_type: str = strawberry.field(name="tokenType")


@strawberry.type
class MessageType:
    """GraphQL Message type for simple responses"""
    message: str
    success: bool


@strawberry.input
class RegisterInput:
    """Input for user registration"""
    email: str
    password: str
    full_name: str = strawberry.field(name="fullName")


@strawberry.input
class LoginInput:
    """Input for user login"""
    email: str
    password: str


@strawberry.input
class ForgotPasswordInput:
    """Input for forgot password"""
    email: str


@strawberry.input
class VerifyResetTokenInput:
    """Input for verifying reset token"""
    email: str
    token: str


@strawberry.input
class ResetPasswordInput:
    """Input for reset password"""
    email: str
    token: str
    new_password: str = strawberry.field(name="newPassword")


@strawberry.input
class ChangePasswordInput:
    """Input for change password"""
    old_password: str = strawberry.field(name="oldPassword")
    new_password: str = strawberry.field(name="newPassword")


@strawberry.input
class CreateUserInput:
    """Input for admin create user"""
    email: str
    password: str
    full_name: str = strawberry.field(name="fullName")
    role: Optional[str] = None


@strawberry.input
class DepartmentInput:
    """Input for creating a department"""
    name: str
    is_active: bool = strawberry.field(name="isActive", default=True)


@strawberry.input
class DepartmentUpdateInput:
    """Input for updating a department"""
    name: Optional[str] = None
    is_active: Optional[bool] = strawberry.field(name="isActive", default=None)


# ============ Job Types ============

@strawberry.type
class JobType:
    """GraphQL Job type"""
    id: str
    title: str
    department_id: str = strawberry.field(name="departmentId")
    description: str
    description_plain: Optional[str] = strawberry.field(name="descriptionPlain")
    requirements: str
    requirements_plain: Optional[str] = strawberry.field(name="requirementsPlain")
    keywords: list[str]
    
    location: str
    remote_policy: str = strawberry.field(name="remotePolicy")
    employment_type: str = strawberry.field(name="employmentType")
    
    experience_level: str = strawberry.field(name="experienceLevel")
    required_education: Optional[str] = strawberry.field(name="requiredEducation")
    preferred_majors: Optional[str] = strawberry.field(name="preferredMajors")
    required_languages: strawberry.scalars.JSON = strawberry.field(name="requiredLanguages")
    
    salary_min: Optional[int] = strawberry.field(name="salaryMin")
    salary_max: Optional[int] = strawberry.field(name="salaryMax")
    salary_currency: str = strawberry.field(name="salaryCurrency")
    
    deadline: Optional[str] = None  # ISO date string
    start_date: Optional[str] = strawberry.field(name="startDate")
    status: str
    is_active: bool = strawberry.field(name="isActive")
    
    created_at: str = strawberry.field(name="createdAt")  # ISO datetime string
    updated_at: str = strawberry.field(name="updatedAt")

    # Derived metrics
    analysis_count: Optional[int] = strawberry.field(name="analysisCount", default=None)

    # Nested
    department: Optional['DepartmentType'] = None


@strawberry.input
class JobInput:
    """Input for creating a job"""
    title: str
    department_id: str = strawberry.field(name="departmentId")
    description: str
    description_plain: Optional[str] = strawberry.field(name="descriptionPlain", default=None)
    requirements: str
    requirements_plain: Optional[str] = strawberry.field(name="requirementsPlain", default=None)
    keywords: list[str] = strawberry.field(default_factory=list)
    
    location: str
    remote_policy: str = strawberry.field(name="remotePolicy", default="office")
    employment_type: str = strawberry.field(name="employmentType", default="full-time")
    
    experience_level: str = strawberry.field(name="experienceLevel", default="mid")
    required_education: Optional[str] = strawberry.field(name="requiredEducation", default=None)
    preferred_majors: Optional[str] = strawberry.field(name="preferredMajors", default=None)
    required_languages: strawberry.scalars.JSON = strawberry.field(name="requiredLanguages", default_factory=dict)
    
    salary_min: Optional[int] = strawberry.field(name="salaryMin", default=None)
    salary_max: Optional[int] = strawberry.field(name="salaryMax", default=None)
    salary_currency: str = strawberry.field(name="salaryCurrency", default="TRY")
    
    deadline: Optional[str] = None  # ISO date string
    start_date: Optional[str] = strawberry.field(name="startDate", default=None)
    status: str = "draft"
    is_active: bool = strawberry.field(name="isActive", default=True)


@strawberry.input
class JobUpdateInput:
    """Input for updating a job"""
    title: Optional[str] = None
    department_id: Optional[str] = strawberry.field(name="departmentId", default=None)
    description: Optional[str] = None
    description_plain: Optional[str] = strawberry.field(name="descriptionPlain", default=None)
    requirements: Optional[str] = None
    requirements_plain: Optional[str] = strawberry.field(name="requirementsPlain", default=None)
    keywords: Optional[list[str]] = None
    
    location: Optional[str] = None
    remote_policy: Optional[str] = strawberry.field(name="remotePolicy", default=None)
    employment_type: Optional[str] = strawberry.field(name="employmentType", default=None)
    
    experience_level: Optional[str] = strawberry.field(name="experienceLevel", default=None)
    required_education: Optional[str] = strawberry.field(name="requiredEducation", default=None)
    preferred_majors: Optional[str] = strawberry.field(name="preferredMajors", default=None)
    required_languages: Optional[strawberry.scalars.JSON] = strawberry.field(name="requiredLanguages", default=None)
    
    salary_min: Optional[int] = strawberry.field(name="salaryMin", default=None)
    salary_max: Optional[int] = strawberry.field(name="salaryMax", default=None)
    salary_currency: Optional[str] = strawberry.field(name="salaryCurrency", default=None)
    
    deadline: Optional[str] = None
    start_date: Optional[str] = strawberry.field(name="startDate", default=None)
    status: Optional[str] = None
    is_active: Optional[bool] = strawberry.field(name="isActive", default=None)


# ============ CV Upload Types ============

@strawberry.type
class UploadedFileType:
    """Single uploaded file response"""
    file_name: str = strawberry.field(name="fileName")
    file_path: str = strawberry.field(name="filePath")
    file_size: int = strawberry.field(name="fileSize")


@strawberry.type
class FailedFileType:
    """Failed file upload info"""
    file_name: str = strawberry.field(name="fileName")
    reason: str


@strawberry.type
class CVUploadResponse:
    """Response for bulk CV upload"""
    successful: List[UploadedFileType]
    failed: List[FailedFileType]
    total_uploaded: int = strawberry.field(name="totalUploaded")
    total_failed: int = strawberry.field(name="totalFailed")


# ============================================
# Candidate Types (CV Management)
# ============================================

@strawberry.type
class CandidateType:
    """GraphQL type for Candidate model"""
    id: str
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    cv_file_name: str = strawberry.field(name="cvFileName")
    cv_file_path: str = strawberry.field(name="cvFilePath")
    cv_file_size: int = strawberry.field(name="cvFileSize")
    cv_text: Optional[str] = strawberry.field(name="cvText")
    cv_language: Optional[str] = strawberry.field(name="cvLanguage")
    parsed_data: Optional[strawberry.scalars.JSON] = strawberry.field(name="parsedData")
    cv_photo_path: Optional[str] = strawberry.field(name="cvPhotoPath")
    location: Optional[str] = None
    birth_year: Optional[int] = strawberry.field(name="birthYear", default=None)
    experience_months: Optional[int] = strawberry.field(name="experienceMonths", default=None)
    status: str
    department_id: str = strawberry.field(name="departmentId")
    uploaded_at: str = strawberry.field(name="uploadedAt")
    updated_at: Optional[str] = strawberry.field(name="updatedAt")
    
    # Nested department info
    department: Optional['DepartmentType'] = None


@strawberry.type
class ApplicationType:
    """GraphQL Application type - CV to Job matching results"""
    id: str
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    analysis_data: Optional[strawberry.scalars.JSON] = strawberry.field(name="analysisData")
    overall_score: Optional[int] = strawberry.field(name="overallScore")
    status: str
    analyzed_at: Optional[str] = strawberry.field(name="analyzedAt")
    reviewed_at: Optional[str] = strawberry.field(name="reviewedAt")
    reviewed_by: Optional[int] = strawberry.field(name="reviewedBy")
    notes: Optional[str] = None
    created_at: str = strawberry.field(name="createdAt")
    updated_at: str = strawberry.field(name="updatedAt")
    
    # Nested data
    job: Optional['JobType'] = None
    candidate: Optional['CandidateType'] = None


@strawberry.input
class AnalyzeJobCandidatesInput:
    """Input for analyzing candidates for a job"""
    job_id: str = strawberry.field(name="jobId")
    candidate_ids: List[str] = strawberry.field(name="candidateIds")


# ============================================
# Two-CV Comparison Types (New Structure)
# ============================================

@strawberry.type
class LanguageInfoType:
    language: str
    level: str


@strawberry.type
class EducationInfoType:
    school: str
    department: str
    years: str


@strawberry.type
class SkillsCompareType:
    common: List[str]
    unique: List[str]


@strawberry.type
class CandidateCompareType:
    name: str
    total_experience_years: str = strawberry.field(name="totalExperienceYears")
    languages: List[LanguageInfoType]
    education: List[EducationInfoType]
    skills: SkillsCompareType


@strawberry.type
class AIEvaluationType:
    strengths: List[str]
    suitable_positions: List[str] = strawberry.field(name="suitablePositions")


@strawberry.type
class AIEvaluationBothType:
    candidate_a: AIEvaluationType = strawberry.field(name="candidateA")
    candidate_b: AIEvaluationType = strawberry.field(name="candidateB")


@strawberry.type
class ComparisonResultType:
    candidate_a: CandidateCompareType = strawberry.field(name="candidateA")
    candidate_b: CandidateCompareType = strawberry.field(name="candidateB")
    ai_evaluation: AIEvaluationBothType = strawberry.field(name="aiEvaluation")


