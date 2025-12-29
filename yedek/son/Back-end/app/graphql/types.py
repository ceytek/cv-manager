"""
GraphQL Type Definitions
"""
import strawberry
from datetime import datetime
from typing import Optional, List
from strawberry.file_uploads import Upload


@strawberry.type
class GenericResponse:
    """Generic response type for simple mutations"""
    success: bool
    message: Optional[str] = None


@strawberry.type
class StatsType:
    """Lightweight global stats for dashboard"""
    candidate_count: int = strawberry.field(name="candidateCount")
    job_count: int = strawberry.field(name="jobCount")
    application_count: int = strawberry.field(name="applicationCount")
    department_count: int = strawberry.field(name="departmentCount")

@strawberry.type
class SubscriptionUsageType:
    """Per-company subscription usage for sidebar widget"""
    plan_name: str = strawberry.field(name="planName")
    cv_limit: int = strawberry.field(name="cvLimit")
    used_cv_count: int = strawberry.field(name="usedCvCount")
    usage_percent: float = strawberry.field(name="usagePercent")
    job_limit: Optional[int] = strawberry.field(name="jobLimit", default=None)
    used_job_count: Optional[int] = strawberry.field(name="usedJobCount", default=None)
    user_limit: Optional[int] = strawberry.field(name="userLimit", default=None)
    used_user_count: Optional[int] = strawberry.field(name="usedUserCount", default=None)


@strawberry.type
class UserType:
    """GraphQL User type"""
    id: int
    email: str
    full_name: str = strawberry.field(name="fullName")
    is_active: bool = strawberry.field(name="isActive")
    is_verified: bool = strawberry.field(name="isVerified")
    role: Optional[str] = None
    company_id: Optional[str] = strawberry.field(name="companyId", default=None)
    role_id: Optional[int] = strawberry.field(name="roleId", default=None)
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
    company_code: str = strawberry.field(name="companyCode")
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
    
    # Interview settings
    interview_enabled: bool = strawberry.field(name="interviewEnabled", default=False)
    interview_template_id: Optional[str] = strawberry.field(name="interviewTemplateId", default=None)
    interview_deadline_hours: int = strawberry.field(name="interviewDeadlineHours", default=72)
    agreement_template_id: Optional[str] = strawberry.field(name="agreementTemplateId", default=None)
    
    # Likert settings
    likert_enabled: bool = strawberry.field(name="likertEnabled", default=False)
    likert_template_id: Optional[str] = strawberry.field(name="likertTemplateId", default=None)
    likert_deadline_hours: int = strawberry.field(name="likertDeadlineHours", default=72)
    
    created_at: str = strawberry.field(name="createdAt")  # ISO datetime string
    updated_at: str = strawberry.field(name="updatedAt")

    # Derived metrics
    analysis_count: Optional[int] = strawberry.field(name="analysisCount", default=None)

    # Nested
    department: Optional['DepartmentType'] = None
    interview_template: Optional['InterviewTemplateType'] = strawberry.field(name="interviewTemplate", default=None)
    agreement_template: Optional['AgreementTemplateType'] = strawberry.field(name="agreementTemplate", default=None)
    likert_template: Optional['LikertTemplateType'] = strawberry.field(name="likertTemplate", default=None)


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
    
    # Interview settings
    interview_enabled: Optional[bool] = strawberry.field(name="interviewEnabled", default=None)
    interview_template_id: Optional[str] = strawberry.field(name="interviewTemplateId", default=None)
    interview_deadline_hours: Optional[int] = strawberry.field(name="interviewDeadlineHours", default=None)
    agreement_template_id: Optional[str] = strawberry.field(name="agreementTemplateId", default=None)
    
    # Likert settings
    likert_enabled: Optional[bool] = strawberry.field(name="likertEnabled", default=None)
    likert_template_id: Optional[str] = strawberry.field(name="likertTemplateId", default=None)
    likert_deadline_hours: Optional[int] = strawberry.field(name="likertDeadlineHours", default=None)


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
    
    # Session flags
    has_interview_session: bool = strawberry.field(name="hasInterviewSession", default=False)
    has_likert_session: bool = strawberry.field(name="hasLikertSession", default=False)
    interview_session_status: Optional[str] = strawberry.field(name="interviewSessionStatus", default=None)
    likert_session_status: Optional[str] = strawberry.field(name="likertSessionStatus", default=None)
    
    # Nested data
    job: Optional['JobType'] = None
    candidate: Optional['CandidateType'] = None


@strawberry.input
class AnalyzeJobCandidatesInput:
    """Input for analyzing candidates for a job"""
    job_id: str = strawberry.field(name="jobId")
    candidate_ids: List[str] = strawberry.field(name="candidateIds")


@strawberry.input
class LanguageInputType:
    """Language input for job requirements"""
    name: str
    level: str


@strawberry.input
class GenerateJobWithAIInput:
    """Input for AI-powered job description generation"""
    position: str
    department: Optional[str] = None
    location: str
    employment_type: str = strawberry.field(name="employmentType", default="full-time")
    experience_level: Optional[str] = strawberry.field(name="experienceLevel", default=None)
    required_skills: List[str] = strawberry.field(name="requiredSkills", default_factory=list)
    required_languages: List[LanguageInputType] = strawberry.field(name="requiredLanguages", default_factory=list)
    additional_notes: Optional[str] = strawberry.field(name="additionalNotes", default=None)
    language: Optional[str] = "turkish"


@strawberry.type
class GenerateJobResultType:
    """Result of AI job generation"""
    success: bool
    job_data: Optional[str] = strawberry.field(name="jobData", default=None)  # JSON string
    message: Optional[str] = None


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


# ============================================
# Multi-tenancy Types (Companies & Subscriptions)
# ============================================

@strawberry.type
class CompanyType:
    """GraphQL Company type"""
    id: str
    company_code: str = strawberry.field(name="companyCode")
    name: str
    subdomain: Optional[str] = None
    custom_domain: Optional[str] = strawberry.field(name="customDomain", default=None)
    logo_url: Optional[str] = strawberry.field(name="logoUrl", default=None)
    theme_colors: Optional[strawberry.scalars.JSON] = strawberry.field(name="themeColors", default=None)
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = strawberry.field(name="isActive")
    created_at: str = strawberry.field(name="createdAt")
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.type
class SubscriptionPlanType:
    """GraphQL Subscription Plan type"""
    id: str
    slug: str
    name: str
    description: Optional[str] = None
    cv_limit: Optional[int] = strawberry.field(name="cvLimit", default=None)
    job_limit: Optional[int] = strawberry.field(name="jobLimit", default=None)
    user_limit: Optional[int] = strawberry.field(name="userLimit", default=None)
    monthly_price: float = strawberry.field(name="monthlyPrice")
    yearly_price: float = strawberry.field(name="yearlyPrice")
    features: strawberry.scalars.JSON
    is_white_label: bool = strawberry.field(name="isWhiteLabel")
    is_active: bool = strawberry.field(name="isActive")
    display_order: int = strawberry.field(name="displayOrder")


@strawberry.type
class CompanySubscriptionType:
    """GraphQL Company Subscription type"""
    id: str
    company_id: str = strawberry.field(name="companyId")
    plan_id: str = strawberry.field(name="planId")
    status: str
    trial_end_date: Optional[str] = strawberry.field(name="trialEndDate", default=None)
    start_date: str = strawberry.field(name="startDate")
    end_date: Optional[str] = strawberry.field(name="endDate", default=None)
    billing_cycle: str = strawberry.field(name="billingCycle")
    next_billing_date: Optional[str] = strawberry.field(name="nextBillingDate", default=None)
    auto_renew: bool = strawberry.field(name="autoRenew")
    
    # Nested
    plan: Optional[SubscriptionPlanType] = None


@strawberry.type
class UsageTrackingType:
    """GraphQL Usage Tracking type"""
    id: str
    company_id: str = strawberry.field(name="companyId")
    resource_type: str = strawberry.field(name="resourceType")
    count: int
    period_start: str = strawberry.field(name="periodStart")
    period_end: str = strawberry.field(name="periodEnd")
    metadata: Optional[strawberry.scalars.JSON] = None


@strawberry.type
class UsageLimitCheckType:
    """Usage limit check result"""
    limit_reached: bool = strawberry.field(name="limitReached")
    current_usage: int = strawberry.field(name="currentUsage")
    limit: Optional[int] = None
    remaining: Optional[int] = None
    is_unlimited: bool = strawberry.field(name="isUnlimited")
    percentage_used: Optional[float] = strawberry.field(name="percentageUsed", default=None)


@strawberry.type
class UsageStatsType:
    """All usage statistics for a company"""
    cv_upload: UsageLimitCheckType = strawberry.field(name="cvUpload")
    job_post: UsageLimitCheckType = strawberry.field(name="jobPost")
    ai_analysis: UsageLimitCheckType = strawberry.field(name="aiAnalysis")
    user_account: UsageLimitCheckType = strawberry.field(name="userAccount")
    api_call: UsageLimitCheckType = strawberry.field(name="apiCall")


@strawberry.type
class TransactionType:
    """GraphQL Transaction type"""
    id: str
    company_id: str = strawberry.field(name="companyId")
    subscription_id: Optional[str] = strawberry.field(name="subscriptionId", default=None)
    transaction_type: str = strawberry.field(name="transactionType")
    amount: float
    currency: str
    payment_method: Optional[str] = strawberry.field(name="paymentMethod", default=None)
    status: str
    transaction_date: str = strawberry.field(name="transactionDate")
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    invoice_number: Optional[str] = strawberry.field(name="invoiceNumber", default=None)
    payment_reference: Optional[str] = strawberry.field(name="paymentReference", default=None)
    description: Optional[str] = None
    notes: Optional[str] = None


@strawberry.type
class SubscriptionStatusType:
    """Comprehensive subscription status"""
    has_subscription: bool = strawberry.field(name="hasSubscription")
    status: Optional[str] = None
    is_active: bool = strawberry.field(name="isActive")
    is_trial: bool = strawberry.field(name="isTrial")
    is_trial_expired: bool = strawberry.field(name="isTrialExpired")
    trial_end_date: Optional[str] = strawberry.field(name="trialEndDate", default=None)
    start_date: Optional[str] = strawberry.field(name="startDate", default=None)
    next_billing_date: Optional[str] = strawberry.field(name="nextBillingDate", default=None)
    billing_cycle: Optional[str] = strawberry.field(name="billingCycle", default=None)
    auto_renew: bool = strawberry.field(name="autoRenew", default=True)
    plan: Optional[strawberry.scalars.JSON] = None
    limits: Optional[strawberry.scalars.JSON] = None
    features: Optional[strawberry.scalars.JSON] = None


# ============================================
# Multi-tenancy Input Types
# ============================================

@strawberry.input
class CreateCompanyInput:
    """Input for creating a company"""
    name: str
    subdomain: Optional[str] = None
    custom_domain: Optional[str] = strawberry.field(name="customDomain", default=None)
    theme_colors: Optional[strawberry.scalars.JSON] = strawberry.field(name="themeColors", default=None)
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company_code: Optional[str] = strawberry.field(name="companyCode", default=None)


@strawberry.input
class UpdateCompanyInput:
    """Input for updating company details"""
    name: Optional[str] = None
    subdomain: Optional[str] = None
    custom_domain: Optional[str] = strawberry.field(name="customDomain", default=None)
    logo_url: Optional[str] = strawberry.field(name="logoUrl", default=None)
    theme_colors: Optional[strawberry.scalars.JSON] = strawberry.field(name="themeColors", default=None)
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


@strawberry.input
class CreateSubscriptionInput:
    """Input for creating a subscription"""
    company_id: str = strawberry.field(name="companyId")
    plan_id: str = strawberry.field(name="planId")
    billing_cycle: str = strawberry.field(name="billingCycle", default="monthly")
    with_trial: bool = strawberry.field(name="withTrial", default=True)
    trial_days: int = strawberry.field(name="trialDays", default=14)


@strawberry.input
class ChangePlanInput:
    """Input for changing subscription plan"""
    new_plan_id: str = strawberry.field(name="newPlanId")
    billing_cycle: Optional[str] = strawberry.field(name="billingCycle", default=None)


# ============================================
# Usage History Types
# ============================================

@strawberry.type
class UsageHistoryItem:
    """Individual usage session record"""
    id: str
    batch_number: str = strawberry.field(name="batchNumber")
    resource_type: str = strawberry.field(name="resourceType")
    count: int
    created_at: str = strawberry.field(name="createdAt")
    period_start: str = strawberry.field(name="periodStart")
    period_end: str = strawberry.field(name="periodEnd")


@strawberry.type
class UsageSessionCandidate:
    """Candidate info in usage session detail"""
    id: str
    name: Optional[str]
    email: Optional[str]
    cv_file_name: str = strawberry.field(name="cvFileName")
    status: str
    location: Optional[str] = None
    uploaded_at: str = strawberry.field(name="uploadedAt")


@strawberry.type
class UsageSessionApplication:
    """Application info in usage session detail"""
    id: str
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    overall_score: Optional[int] = strawberry.field(name="overallScore")
    status: str
    analyzed_at: Optional[str] = strawberry.field(name="analyzedAt")
    
    # Nested
    job_title: Optional[str] = strawberry.field(name="jobTitle", default=None)
    candidate_name: Optional[str] = strawberry.field(name="candidateName", default=None)


@strawberry.type
class UsageSessionDetail:
    """Detailed view of a usage session"""
    batch_number: str = strawberry.field(name="batchNumber")
    resource_type: str = strawberry.field(name="resourceType")
    count: int
    created_at: str = strawberry.field(name="createdAt")
    
    # Session data
    candidates: List[UsageSessionCandidate] = strawberry.field(default_factory=list)
    applications: List[UsageSessionApplication] = strawberry.field(default_factory=list)


# ============================================
# Usage Period Summaries (Aggregated)
# ============================================

@strawberry.type
class UsagePeriodSummary:
    """Aggregated credits per month; only months with usage are included"""
    label: str
    period_start: str = strawberry.field(name="periodStart")
    period_end: str = strawberry.field(name="periodEnd")
    total_credits: int = strawberry.field(name="totalCredits")
    cv_analyses: int = strawberry.field(name="cvAnalyses")
    cv_uploads: int = strawberry.field(name="cvUploads")


# ============================================
# Interview Types
# ============================================

@strawberry.type
class InterviewQuestionType:
    """Interview question type"""
    id: str
    template_id: Optional[str] = strawberry.field(name="templateId", default=None)
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder")
    time_limit: int = strawberry.field(name="timeLimit", default=120)
    is_ai_generated: bool = strawberry.field(name="isAiGenerated", default=False)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)


@strawberry.type
class InterviewAnswerType:
    """Interview answer type"""
    id: str
    session_id: str = strawberry.field(name="sessionId")
    question_id: str = strawberry.field(name="questionId")
    answer_text: Optional[str] = strawberry.field(name="answerText", default=None)
    video_url: Optional[str] = strawberry.field(name="videoUrl", default=None)
    duration_seconds: Optional[int] = strawberry.field(name="durationSeconds", default=None)
    created_at: str = strawberry.field(name="createdAt")


@strawberry.type
class InterviewTemplateType:
    """Interview template type"""
    id: str
    name: str
    description: Optional[str] = None
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    language: str = "tr"
    duration_per_question: int = strawberry.field(name="durationPerQuestion", default=120)
    use_global_timer: bool = strawberry.field(name="useGlobalTimer", default=False)
    total_duration: Optional[int] = strawberry.field(name="totalDuration", default=None)
    is_active: bool = strawberry.field(name="isActive", default=True)
    question_count: int = strawberry.field(name="questionCount", default=0)
    questions: List[InterviewQuestionType] = strawberry.field(default_factory=list)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.type
class InterviewSessionType:
    """Interview session type"""
    id: str
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    application_id: Optional[str] = strawberry.field(name="applicationId", default=None)
    token: str
    status: str
    expires_at: str = strawberry.field(name="expiresAt")
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    invitation_sent_at: Optional[str] = strawberry.field(name="invitationSentAt", default=None)
    invitation_email: Optional[str] = strawberry.field(name="invitationEmail", default=None)
    agreement_accepted_at: Optional[str] = strawberry.field(name="agreementAcceptedAt", default=None)
    created_at: str = strawberry.field(name="createdAt")
    job: Optional['JobType'] = None
    candidate: Optional['CandidateType'] = None
    questions: List[InterviewQuestionType] = strawberry.field(default_factory=list)
    answers: List[InterviewAnswerType] = strawberry.field(default_factory=list)


@strawberry.input
class InterviewTemplateInput:
    """Input for creating/updating interview template"""
    name: str
    description: Optional[str] = None
    intro_text: Optional[str] = strawberry.field(name="introText", default=None)
    language: str = "tr"
    duration_per_question: int = strawberry.field(name="durationPerQuestion", default=120)
    use_global_timer: bool = strawberry.field(name="useGlobalTimer", default=False)
    total_duration: Optional[int] = strawberry.field(name="totalDuration", default=None)
    questions: List['InterviewQuestionInput'] = strawberry.field(default_factory=list)


@strawberry.input
class InterviewQuestionInput:
    """Input for interview question"""
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder", default=1)
    time_limit: int = strawberry.field(name="timeLimit", default=120)


@strawberry.input
class CreateInterviewSessionInput:
    """Input for creating interview session"""
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    application_id: str = strawberry.field(name="applicationId")
    email: Optional[str] = None


@strawberry.input
class SaveInterviewAnswerInput:
    """Input for saving interview answer"""
    session_token: str = strawberry.field(name="sessionToken")
    question_id: str = strawberry.field(name="questionId")
    answer_text: Optional[str] = strawberry.field(name="answerText", default=None)
    video_url: Optional[str] = strawberry.field(name="videoUrl", default=None)
    duration_seconds: Optional[int] = strawberry.field(name="durationSeconds", default=None)


@strawberry.type
class InterviewTemplateResponse:
    """Response for interview template mutations"""
    success: bool
    message: Optional[str] = None
    template: Optional[InterviewTemplateType] = None


@strawberry.type
class InterviewSessionResponse:
    """Response for interview session mutations"""
    success: bool
    message: Optional[str] = None
    interview_link: Optional[str] = strawberry.field(name="interviewLink", default=None)
    session: Optional[InterviewSessionType] = None


@strawberry.type
class InterviewAnswerResponse:
    """Response for interview answer mutations"""
    success: bool
    message: Optional[str] = None
    answer: Optional[InterviewAnswerType] = None


# ============================================
# Agreement Template Types
# ============================================

@strawberry.type
class AgreementTemplateType:
    """Agreement template type"""
    id: str
    name: str
    content: str
    is_active: bool = strawberry.field(name="isActive", default=True)
    creator_name: Optional[str] = strawberry.field(name="creatorName", default=None)
    created_at: str = strawberry.field(name="createdAt")
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.input
class AgreementTemplateInput:
    """Input for creating/updating agreement template"""
    name: str
    content: str
    is_active: bool = strawberry.field(name="isActive", default=True)


@strawberry.type
class AgreementTemplateResponse:
    """Response for agreement template mutations"""
    success: bool
    message: Optional[str] = None
    template: Optional[AgreementTemplateType] = None


# ============================================
# Likert Test Types
# ============================================

@strawberry.type
class LikertQuestionType:
    """Likert question type"""
    id: str
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder")
    is_reverse_scored: bool = strawberry.field(name="isReverseScored", default=False)


@strawberry.type
class LikertAnswerType:
    """Likert answer type"""
    id: str
    question_id: str = strawberry.field(name="questionId")
    score: int


@strawberry.type
class LikertTemplateType:
    """Likert template type"""
    id: str
    name: str
    description: Optional[str] = None
    scale_type: int = strawberry.field(name="scaleType", default=5)
    scale_labels: Optional[List[str]] = strawberry.field(name="scaleLabels", default=None)
    language: str = "tr"
    is_active: bool = strawberry.field(name="isActive", default=True)
    time_limit: Optional[int] = strawberry.field(name="timeLimit", default=None)  # Total time in seconds
    question_count: int = strawberry.field(name="questionCount", default=0)
    questions: List[LikertQuestionType] = strawberry.field(default_factory=list)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    updated_at: Optional[str] = strawberry.field(name="updatedAt", default=None)


@strawberry.type
class LikertSessionType:
    """Likert session type"""
    id: str
    token: str
    status: str
    expires_at: str = strawberry.field(name="expiresAt")
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    total_score: Optional[int] = strawberry.field(name="totalScore", default=None)
    created_at: str = strawberry.field(name="createdAt")
    template: Optional[LikertTemplateType] = None
    job: Optional['JobType'] = None
    candidate: Optional['CandidateType'] = None
    answers: List[LikertAnswerType] = strawberry.field(default_factory=list)


@strawberry.input
class LikertTemplateInput:
    """Input for creating/updating likert template"""
    name: str
    description: Optional[str] = None
    scale_type: int = strawberry.field(name="scaleType", default=5)
    scale_labels: Optional[List[str]] = strawberry.field(name="scaleLabels", default=None)
    language: str = "tr"
    time_limit: Optional[int] = strawberry.field(name="timeLimit", default=None)  # Total time in seconds
    questions: List['LikertQuestionInput'] = strawberry.field(default_factory=list)


@strawberry.input
class LikertQuestionInput:
    """Input for likert question"""
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder", default=1)
    is_reverse_scored: bool = strawberry.field(name="isReverseScored", default=False)


@strawberry.input
class CreateLikertSessionInput:
    """Input for creating likert session"""
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    application_id: str = strawberry.field(name="applicationId")


@strawberry.input
class LikertAnswerInput:
    """Input for likert answer submission"""
    question_id: str = strawberry.field(name="questionId")
    value: int


@strawberry.type
class LikertTemplateResponse:
    """Response for likert template mutations"""
    success: bool
    message: Optional[str] = None
    template: Optional[LikertTemplateType] = None


@strawberry.type
class LikertSessionResponse:
    """Response for likert session mutations"""
    success: bool
    message: Optional[str] = None
    likert_link: Optional[str] = strawberry.field(name="likertLink", default=None)
    session: Optional[LikertSessionType] = None


# ============================================
# Full Session Types for Public Access (Candidates)
# ============================================

@strawberry.type
class InterviewCandidateType:
    """Simplified candidate type for interview page"""
    id: str
    name: str
    cv_photo_path: Optional[str] = strawberry.field(name="cvPhotoPath", default=None)
    cv_language: Optional[str] = strawberry.field(name="cvLanguage", default=None)


@strawberry.type
class InterviewJobType:
    """Job type with interview-specific fields"""
    id: str
    title: str
    description: Optional[str] = None
    description_plain: Optional[str] = strawberry.field(name="descriptionPlain", default=None)
    requirements: Optional[str] = None
    requirements_plain: Optional[str] = strawberry.field(name="requirementsPlain", default=None)
    location: Optional[str] = None
    remote_policy: Optional[str] = strawberry.field(name="remotePolicy", default=None)
    employment_type: Optional[str] = strawberry.field(name="employmentType", default=None)
    experience_level: Optional[str] = strawberry.field(name="experienceLevel", default=None)
    interview_enabled: bool = strawberry.field(name="interviewEnabled", default=False)
    interview_duration_per_question: int = strawberry.field(name="interviewDurationPerQuestion", default=2)
    interview_total_questions: int = strawberry.field(name="interviewTotalQuestions", default=5)
    interview_deadline_hours: int = strawberry.field(name="interviewDeadlineHours", default=72)
    interview_intro_text: Optional[str] = strawberry.field(name="interviewIntroText", default=None)
    interview_language: str = strawberry.field(name="interviewLanguage", default="tr")
    use_global_timer: bool = strawberry.field(name="useGlobalTimer", default=False)
    total_duration: Optional[int] = strawberry.field(name="totalDuration", default=None)
    agreement_template_id: Optional[str] = strawberry.field(name="agreementTemplateId", default=None)
    agreement_template: Optional[AgreementTemplateType] = strawberry.field(name="agreementTemplate", default=None)
    department: Optional['DepartmentType'] = None


@strawberry.type
class InterviewSessionFullType:
    """Full interview session type with nested objects for candidate view"""
    id: str
    job_id: str = strawberry.field(name="jobId")
    candidate_id: str = strawberry.field(name="candidateId")
    application_id: Optional[str] = strawberry.field(name="applicationId", default=None)
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    invitation_sent_at: Optional[str] = strawberry.field(name="invitationSentAt", default=None)
    invitation_email: Optional[str] = strawberry.field(name="invitationEmail", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    agreement_accepted_at: Optional[str] = strawberry.field(name="agreementAcceptedAt", default=None)
    job: Optional[InterviewJobType] = None
    candidate: Optional[InterviewCandidateType] = None
    questions: List[InterviewQuestionType] = strawberry.field(default_factory=list)


@strawberry.type
class LikertJobType:
    """Job info for Likert session"""
    id: str
    title: str
    description: Optional[str] = None
    description_plain: Optional[str] = strawberry.field(name="descriptionPlain", default=None)
    location: Optional[str] = None
    agreement_template_id: Optional[str] = strawberry.field(name="agreementTemplateId", default=None)
    agreement_template: Optional["AgreementTemplateType"] = strawberry.field(name="agreementTemplate", default=None)


@strawberry.type
class LikertCandidateType:
    """Candidate info for Likert session"""
    id: str
    name: str
    cv_photo_path: Optional[str] = strawberry.field(name="cvPhotoPath", default=None)
    email: Optional[str] = None


@strawberry.type
class LikertSessionFullType:
    """Full likert session type with nested objects for candidate view"""
    id: str
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    template: Optional[LikertTemplateType] = None
    job: Optional[LikertJobType] = None
    candidate: Optional[LikertCandidateType] = None


@strawberry.type
class LikertAnswerWithQuestionType:
    """Likert answer with question details"""
    id: str
    question_id: str = strawberry.field(name="questionId")
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder")
    score: int


@strawberry.type
class LikertSessionWithAnswersType:
    """Likert session with answers for HR view"""
    id: str
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    total_score: Optional[int] = strawberry.field(name="totalScore", default=None)
    template: Optional[LikertTemplateType] = None
    job: Optional[LikertJobType] = None
    candidate: Optional[LikertCandidateType] = None
    answers: List[LikertAnswerWithQuestionType] = strawberry.field(default_factory=list)


@strawberry.type
class InterviewAnswerWithQuestionType:
    """Interview answer with question details"""
    id: str
    question_id: str = strawberry.field(name="questionId")
    question_text: str = strawberry.field(name="questionText")
    question_order: int = strawberry.field(name="questionOrder")
    answer_text: Optional[str] = strawberry.field(name="answerText", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)


@strawberry.type
class InterviewSessionWithAnswersType:
    """Interview session with answers for HR view"""
    id: str
    token: str
    status: str
    expires_at: Optional[str] = strawberry.field(name="expiresAt", default=None)
    started_at: Optional[str] = strawberry.field(name="startedAt", default=None)
    completed_at: Optional[str] = strawberry.field(name="completedAt", default=None)
    invitation_sent_at: Optional[str] = strawberry.field(name="invitationSentAt", default=None)
    created_at: Optional[str] = strawberry.field(name="createdAt", default=None)
    template: Optional["InterviewTemplateType"] = None
    job: Optional["InterviewJobType"] = None
    candidate: Optional["InterviewCandidateType"] = None
    answers: List[InterviewAnswerWithQuestionType] = strawberry.field(default_factory=list)


