"""
GraphQL Resolvers
"""
import strawberry
from strawberry.types import Info
import logging
from typing import Optional, List, AsyncGenerator
from datetime import datetime, timedelta
from app.graphql.multi_tenancy_resolvers import CompanyMutation
from sqlalchemy.orm import Session
from strawberry.file_uploads import Upload

logger = logging.getLogger(__name__)

from app.graphql.types import (
    UserType,
    TokenType,
    MessageType,
    RegisterInput,
    LoginInput,
    ForgotPasswordInput,
    VerifyResetTokenInput,
    ResetPasswordInput,
    ChangePasswordInput,
    CreateUserInput,
    DepartmentType,
    DepartmentInput,
    DepartmentUpdateInput,
    JobType,
    JobInput,
    JobUpdateInput,
    CVUploadResponse,
    UploadedFileType,
    FailedFileType,
    CandidateType,
    ApplicationType,
    AnalyzeJobCandidatesInput,
    GenerateJobWithAIInput,
    GenerateJobResultType,
    StatsType,
    DailyActivityStatsType,
    ComparisonResultType,
    SubscriptionUsageType,
    UsageHistoryItem,
    UsageSessionDetail,
    UsageSessionCandidate,
    UsageSessionApplication,
    UsagePeriodSummary,
    # Interview types
    InterviewTemplateType,
    InterviewTemplateInput,
    InterviewTemplateResponse,
    InterviewQuestionType,
    InterviewSessionType,
    InterviewSessionResponse,
    InterviewAnswerType,
    InterviewAnswerResponse,
    CreateInterviewSessionInput,
    SaveInterviewAnswerInput,
    # Agreement types
    AgreementTemplateType,
    AgreementTemplateInput,
    AgreementTemplateResponse,
    # Job Intro types
    JobIntroTemplateType,
    JobIntroTemplateInput,
    JobIntroTemplateResponse,
    # Job Outro types
    JobOutroTemplateType,
    JobOutroTemplateInput,
    JobOutroTemplateResponse,
    # Likert types
    LikertTemplateType,
    LikertTemplateInput,
    LikertTemplateResponse,
    LikertQuestionType,
    LikertSessionType,
    LikertSessionResponse,
    LikertAnswerType,
    CreateLikertSessionInput,
    LikertAnswerInput,
    # Full session types for public access
    InterviewSessionFullType,
    LikertSessionFullType,
    InterviewJobType,
    InterviewCandidateType,
    LikertJobType,
    LikertCandidateType,
    # Session types with answers for HR view
    LikertAnswerWithQuestionType,
    LikertSessionWithAnswersType,
    InterviewAnswerWithQuestionType,
    InterviewSessionWithAnswersType,
    # AI Analysis types
    AIAnalysisCategoryType,
    AIInterviewAnalysisType,
    AIAnalysisResponse,
    # Rejection template types
    RejectionTemplateType,
    RejectionTemplateInput,
    RejectionTemplateResponse,
    # Generic response
    GenericResponse,
    # History types
    ActionTypeType,
    ApplicationHistoryType,
    LastStatusType,
    CreateHistoryEntryInput,
    HistoryResponse,
    HistoryListResponse,
    RecentActivityType,
    RecentActivitiesResponse,
    # Talent Pool types
    TalentPoolTagType,
    TalentPoolEntryType,
    TalentPoolTagInput,
    TalentPoolTagUpdateInput,
    TalentPoolEntryInput,
    TalentPoolBulkAddInput,
    TalentPoolEntryUpdateInput,
    TalentPoolAssignToJobInput,
    TalentPoolTagResponse,
    TalentPoolEntryResponse,
    TalentPoolBulkResponse,
    TalentPoolStatsType,
    TalentPoolFilterInput,
    # Second Interview types
    SecondInterviewGQLType,
    SecondInterviewInviteInput,
    SecondInterviewFeedbackInput,
    SecondInterviewResponse,
    # Company Address types
    CompanyAddressGQLType,
    CompanyAddressInput,
    CompanyAddressUpdateInput,
    CompanyAddressResponse,
    # Second Interview Template types
    SecondInterviewTemplateGQLType,
    SecondInterviewTemplateTypeEnum,
    SecondInterviewTemplateInput as SecondInterviewTemplateInputType,
    SecondInterviewTemplateUpdateInput,
    SecondInterviewTemplateResponse,
    TemplateVariablesResponse,
    # AI Interview Email Template types
    AIInterviewEmailTemplateType,
    AIInterviewEmailTemplateInput,
    AIInterviewEmailTemplateUpdateInput,
    AIInterviewEmailTemplateResponse,
    AIInterviewEmailTemplateListResponse,
    # Likert Test Template types
    LikertTemplateGQLType,
    LikertTemplateInput,
    LikertTemplateUpdateInput,
    LikertTemplateResponse,
    LikertTemplateVariablesResponse,
)
from app.services.auth import AuthService
from app.services.department import DepartmentService
from app.services.job import JobService
from app.services.file_upload import FileUploadService
from app.services.ai_service_client import ai_service_client
from app.core.database import get_db
from app.api.dependencies import get_current_user_from_token, get_company_id_from_token
from app.models.user import User
from app.models.role import Role
from app.models.company import Company
from app.api.authorization import ensure_admin
from app.graphql.pubsub import pubsub


def get_db_session() -> Session:
    """Get database session for GraphQL (caller is responsible for closing)."""
    return next(get_db())


@strawberry.type
class Query:
    """GraphQL Query root"""

    @strawberry.field
    def me(self, info: Info) -> Optional[UserType]:
        """Get current logged-in user"""
        # Get authorization header
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        
        if not auth_header:
            raise Exception("Not authenticated")
        
        # Extract token
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")
        
        # Get user from token
        db = get_db_session()
        try:
            user = get_current_user_from_token(token, db)
            # Resolve role name if present
            role_name = None
            try:
                if user.role_id:
                    db_role = db.query(Role).filter(Role.id == user.role_id).first()
                    role_name = db_role.name if db_role else None
            except Exception:
                role_name = None

            # Get company name and logo if user has company_id
            company_name = None
            company_logo = None
            try:
                if user.company_id:
                    company = db.query(Company).filter(Company.id == user.company_id).first()
                    if company:
                        company_name = company.name
                        company_logo = company.logo_url
            except Exception:
                company_name = None
                company_logo = None

            return UserType(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                role=role_name,
                company_name=company_name,
                company_logo=company_logo,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")
        finally:
            db.close()

    @strawberry.field
    def users(self, info: Info) -> list[UserType]:
        """List all users (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            # Multi-tenancy: restrict to same company
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")
            rows = db.query(User).filter(User.company_id == company_id).all()
            out = []
            for u in rows:
                role_name = None
                if u.role_id:
                    r = db.query(Role).filter(Role.id == u.role_id).first()
                    role_name = r.name if r else None
                out.append(UserType(
                    id=u.id,
                    email=u.email,
                    full_name=u.full_name,
                    is_active=u.is_active,
                    is_verified=u.is_verified,
                    role=role_name,
                    created_at=u.created_at,
                    updated_at=u.updated_at,
                ))
            return out
        finally:
            db.close()

    @strawberry.field
    def stats(self, info: Info) -> StatsType:
        """Return per-company counts for dashboard cards (multi-tenancy)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            # Validate user (auth required)
            current = get_current_user_from_token(token, db)
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                # If user has no company (system user), return zeros to avoid leaking global data
                return StatsType(candidate_count=0, job_count=0, application_count=0, department_count=0)

            from app.models.candidate import Candidate
            from app.models.job import Job
            from app.models.application import Application
            from app.models.department import Department

            cand_count = db.query(Candidate).filter(Candidate.company_id == company_id).count()
            job_count = db.query(Job).filter(Job.company_id == company_id).count()
            app_count = db.query(Application).filter(Application.company_id == company_id).count()
            dep_count = db.query(Department).filter(Department.company_id == company_id, Department.is_active == True).count()

            return StatsType(
                candidate_count=cand_count,
                job_count=job_count,
                application_count=app_count,
                department_count=dep_count,
            )
        finally:
            db.close()

    @strawberry.field(name="dailyActivityStats")
    def daily_activity_stats(self, info: Info, date: Optional[str] = None) -> DailyActivityStatsType:
        """
        Get daily activity statistics for a specific date.
        If no date is provided, returns today's stats.
        CV uploads are counted from usage_tracking (all uploads).
        Other metrics come from application_history (job-specific events).
        """
        from datetime import datetime, date as date_type
        from app.modules.history.models import ApplicationHistory, ActionType
        from app.models.subscription import UsageTracking
        from sqlalchemy import func, and_, cast, Date
        
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                return DailyActivityStatsType(
                    date=date or date_type.today().isoformat(),
                    cv_uploads=0,
                    cv_analyses=0,
                    interview_invitations=0,
                    rejections=0,
                    likert_invitations=0
                )

            # Parse target date
            if date:
                try:
                    target_date = datetime.fromisoformat(date).date()
                except ValueError:
                    target_date = date_type.today()
            else:
                target_date = date_type.today()

            # Get action types for the codes we need
            action_type_map = {}
            action_types = db.query(ActionType).filter(
                ActionType.code.in_(['cv_uploaded', 'cv_analyzed', 'interview_sent', 'rejected', 'likert_sent'])
            ).all()
            for at in action_types:
                action_type_map[at.code] = at.id

            # Count actions for each type on the target date (from application_history)
            def count_actions(action_code):
                action_type_id = action_type_map.get(action_code)
                if not action_type_id:
                    return 0
                count = db.query(func.count(ApplicationHistory.id)).filter(
                    and_(
                        ApplicationHistory.company_id == company_id,
                        ApplicationHistory.action_type_id == action_type_id,
                        cast(ApplicationHistory.created_at, Date) == target_date
                    )
                ).scalar() or 0
                return count

            # CV uploads: count from usage_tracking (includes all bulk uploads)
            cv_uploads = db.query(func.coalesce(func.sum(UsageTracking.count), 0)).filter(
                and_(
                    UsageTracking.company_id == company_id,
                    UsageTracking.resource_type == "cv_upload",
                    cast(UsageTracking.created_at, Date) == target_date
                )
            ).scalar() or 0
            
            # CV analyses: count from usage_tracking (ai_analysis resource type)
            cv_analyses = db.query(func.coalesce(func.sum(UsageTracking.count), 0)).filter(
                and_(
                    UsageTracking.company_id == company_id,
                    UsageTracking.resource_type == "ai_analysis",
                    cast(UsageTracking.created_at, Date) == target_date
                )
            ).scalar() or 0
            
            # Other metrics from application_history
            interview_invitations = count_actions('interview_sent')
            rejections = count_actions('rejected')
            likert_invitations = count_actions('likert_sent')

            return DailyActivityStatsType(
                date=target_date.isoformat(),
                cv_uploads=int(cv_uploads),
                cv_analyses=int(cv_analyses),
                interview_invitations=interview_invitations,
                rejections=rejections,
                likert_invitations=likert_invitations
            )
        finally:
            db.close()

    @strawberry.field(name="subscriptionUsage")
    def subscriptionUsage(self, info: Info) -> SubscriptionUsageType:
        """Return current company's subscription usage from usage_tracking table."""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")

            from app.models.subscription import SubscriptionPlan, CompanySubscription, UsageTracking, ResourceType
            from sqlalchemy import func
            from datetime import date

            # 1. Get active subscription (trial or active status)
            sub = db.query(CompanySubscription).filter(
                CompanySubscription.company_id == company_id,
                CompanySubscription.status.in_(["trial", "active"])
            ).order_by(CompanySubscription.created_at.desc()).first()

            if not sub:
                return SubscriptionUsageType(
                    plan_name="Paket Yok",
                    cv_limit=0,
                    used_cv_count=0,
                    usage_percent=0.0,
                    job_limit=0,
                    used_job_count=0,
                    user_limit=0,
                    used_user_count=0
                )

            # 2. Get plan details (name, cv_limit, job_limit, user_limit)
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
            if not plan:
                return SubscriptionUsageType(
                    plan_name="Plan Bulunamadı",
                    cv_limit=0,
                    used_cv_count=0,
                    usage_percent=0.0,
                    job_limit=0,
                    used_job_count=0,
                    user_limit=0,
                    used_user_count=0
                )

            # 3. Get usage from usage_tracking table (sum current month sessions)
            today = date.today()
            month_start = date(today.year, today.month, 1)
            from sqlalchemy import func
            
            # CV-related usage (sum of uploads and AI analyses)
            used_cv_upload = db.query(func.coalesce(func.sum(UsageTracking.count), 0)).filter(
                UsageTracking.company_id == company_id,
                UsageTracking.resource_type == "cv_upload",
                UsageTracking.period_start >= month_start
            ).scalar() or 0
            used_ai_analysis = db.query(func.coalesce(func.sum(UsageTracking.count), 0)).filter(
                UsageTracking.company_id == company_id,
                UsageTracking.resource_type == "ai_analysis",
                UsageTracking.period_start >= month_start
            ).scalar() or 0
            used_cv = (used_cv_upload or 0) + (used_ai_analysis or 0)

            # Job Post usage (sum)
            used_job = db.query(func.coalesce(func.sum(UsageTracking.count), 0)).filter(
                UsageTracking.company_id == company_id,
                UsageTracking.resource_type == "job_post",
                UsageTracking.period_start >= month_start
            ).scalar() or 0

            # User Account usage (sum)
            used_user = db.query(func.coalesce(func.sum(UsageTracking.count), 0)).filter(
                UsageTracking.company_id == company_id,
                UsageTracking.resource_type == "user_account",
                UsageTracking.period_start >= month_start
            ).scalar() or 0

            # 4. Get limits from plan
            cv_limit = plan.cv_limit or 0
            job_limit = plan.job_limit or 0
            user_limit = plan.user_limit or 0

            # 5. Calculate usage percentage
            usage_percent = 0.0
            if cv_limit and cv_limit > 0:
                usage_percent = round((used_cv / cv_limit) * 100, 2)

            return SubscriptionUsageType(
                plan_name=plan.name,
                cv_limit=cv_limit,
                used_cv_count=used_cv,
                usage_percent=usage_percent,
                job_limit=job_limit,
                used_job_count=used_job,
                user_limit=user_limit,
                used_user_count=used_user
            )
        finally:
            db.close()

    @strawberry.field
    def departments(self, info: Info, include_inactive: bool = False) -> list[DepartmentType]:
        """List all departments (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            
            # Extract company_id from token for multi-tenancy filtering
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")
            
            departments = DepartmentService.list_all(db, include_inactive=include_inactive, company_id=company_id)
            
            # Get job counts per department
            from app.models.job import Job
            from sqlalchemy import func
            job_counts = dict(
                db.query(Job.department_id, func.count(Job.id))
                .filter(Job.company_id == company_id)
                .group_by(Job.department_id)
                .all()
            )
            
            return [
                DepartmentType(
                    id=d.id,
                    name=d.name,
                    is_active=d.is_active,
                    color=d.color,
                    created_at=d.created_at,
                    updated_at=d.updated_at,
                    job_count=job_counts.get(d.id, 0),
                )
                for d in departments
            ]
        finally:
            db.close()

    @strawberry.field
    def department_has_related_records(self, info: Info, id: str) -> bool:
        """Check if department has related candidates or jobs"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            return DepartmentService.has_related_records(db, id)
        finally:
            db.close()

    @strawberry.field
    def candidate_has_analysis(self, info: Info, candidateId: str) -> bool:
        """Check if candidate has been analyzed (has applications, interviews, or likert sessions)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            
            from app.models.application import Application
            from app.modules.interview.models import InterviewSession
            from app.modules.likert.models import LikertSession
            
            # Check if candidate has any applications
            app_count = db.query(Application).filter(
                Application.candidate_id == candidateId,
                Application.company_id == company_id
            ).count()
            
            # Check if candidate has any interview sessions
            interview_count = db.query(InterviewSession).filter(
                InterviewSession.candidate_id == candidateId,
                InterviewSession.company_id == company_id
            ).count()
            
            # Check if candidate has any likert sessions
            likert_count = db.query(LikertSession).filter(
                LikertSession.candidate_id == candidateId,
                LikertSession.company_id == company_id
            ).count()
            
            return (app_count + interview_count + likert_count) > 0
        finally:
            db.close()

    @strawberry.field
    def job(self, info: Info, id: str) -> Optional[JobType]:
        """Get a single job by ID (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)

            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")

            from app.models.job import Job
            job = db.query(Job).filter(Job.id == id, Job.company_id == company_id).first()
            if not job:
                return None

            # Get department
            from app.models.department import Department
            dept = db.query(Department).filter(Department.id == job.department_id).first()
            dept_type = None
            if dept:
                dept_type = DepartmentType(
                    id=dept.id,
                    name=dept.name,
                    is_active=dept.is_active,
                            color=dept.color,
                    created_at=dept.created_at.isoformat() if dept.created_at else None,
                    updated_at=dept.updated_at.isoformat() if dept.updated_at else None,
                )

            # Get analysis count
            from app.models.application import Application, ApplicationStatus
            from sqlalchemy import func
            analysis_count = db.query(func.count(Application.id)).filter(
                Application.job_id == job.id,
                Application.status != ApplicationStatus.PENDING
            ).scalar() or 0

            # Get interview template
            interview_template = None
            if job.interview_template_id:
                from app.models.interview import InterviewTemplate
                it = db.query(InterviewTemplate).filter(InterviewTemplate.id == job.interview_template_id).first()
                if it:
                    interview_template = InterviewTemplateType(
                        id=str(it.id),
                        name=it.name,
                        description=it.description,
                        language=it.language,
                        duration_per_question=it.duration_per_question,
                        intro_text=it.intro_text,
                        is_active=it.is_active,
                        question_count=len(it.questions) if it.questions else 0,
                        questions=[],
                        created_at=it.created_at.isoformat(),
                        updated_at=it.updated_at.isoformat() if it.updated_at else None,
                    )
            
            # Get likert template
            likert_template = None
            if job.likert_template_id:
                from app.modules.likert.models import LikertTemplate
                lt = db.query(LikertTemplate).filter(LikertTemplate.id == job.likert_template_id).first()
                if lt:
                    likert_template = LikertTemplateType(
                        id=str(lt.id),
                        name=lt.name,
                        description=lt.description,
                        scale_type=lt.scale_type,
                        scale_labels=lt.scale_labels or [],
                        language=lt.language,
                        is_active=lt.is_active,
                        time_limit=lt.time_limit,
                        question_count=len(lt.questions) if lt.questions else 0,
                        questions=[],
                        created_at=lt.created_at.isoformat(),
                        updated_at=lt.updated_at.isoformat() if lt.updated_at else None,
                    )
            
            return JobType(
                id=job.id,
                title=job.title,
                department_id=job.department_id,
                intro_text=job.intro_text,
                outro_text=job.outro_text,
                description=job.description or "",
                description_plain=job.description_plain,
                requirements=job.requirements or "",
                requirements_plain=job.requirements_plain,
                keywords=job.keywords or [],
                location=job.location or "",
                remote_policy=job.remote_policy or "office",
                employment_type=job.employment_type or "full-time",
                experience_level=job.experience_level or "mid",
                required_education=job.required_education,
                preferred_majors=job.preferred_majors,
                required_languages=job.required_languages or {},
                salary_min=job.salary_min,
                salary_max=job.salary_max,
                salary_currency=job.salary_currency or "TRY",
                deadline=job.deadline.isoformat() if job.deadline else None,
                start_date=job.start_date,
                status=job.status or "draft",
                is_active=job.is_active,
                is_disabled_friendly=job.is_disabled_friendly or False,
                interview_enabled=job.interview_enabled or False,
                interview_template_id=str(job.interview_template_id) if job.interview_template_id else None,
                interview_deadline_hours=job.interview_deadline_hours or 72,
                agreement_template_id=str(job.agreement_template_id) if job.agreement_template_id else None,
                likert_enabled=job.likert_enabled or False,
                likert_template_id=str(job.likert_template_id) if job.likert_template_id else None,
                likert_deadline_hours=job.likert_deadline_hours or 72,
                created_at=job.created_at.isoformat(),
                updated_at=job.updated_at.isoformat(),
                analysis_count=analysis_count,
                department=dept_type,
                interview_template=interview_template,
                likert_template=likert_template,
            )
        finally:
            db.close()

    @strawberry.field
    def jobs(
        self,
        info: Info,
        include_inactive: bool = False,
        status: Optional[str] = None,
        department_id: Optional[str] = None,
        search_term: Optional[str] = None
    ) -> list[JobType]:
        """List all jobs with optional filters (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)

            # Extract company_id from token for multi-tenancy filtering
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")

            jobs = JobService.list_all(
                db,
                include_inactive=include_inactive,
                status=status,
                department_id=department_id,
                search_term=search_term,
                company_id=company_id
            )

            # Prefetch application counts per job
            from app.models.application import Application, ApplicationStatus
            from app.models.candidate import Candidate
            from sqlalchemy import func
            counts = (
                db.query(Application.job_id, func.count(Application.id))
                .filter(Application.status != ApplicationStatus.PENDING)
                .filter(Application.company_id == company_id)
                .group_by(Application.job_id)
                .all()
            )
            count_map = {jid: cnt for jid, cnt in counts}
            
            # Prefetch recent applicants (first 2) for each job
            from sqlalchemy.orm import aliased
            recent_applicants_map = {}
            for j in jobs:
                recent_apps = (
                    db.query(Application, Candidate)
                    .join(Candidate, Application.candidate_id == Candidate.id)
                    .filter(Application.job_id == j.id)
                    .filter(Application.company_id == company_id)
                    .filter(Application.status != ApplicationStatus.PENDING)
                    .order_by(Application.created_at.desc())
                    .limit(2)
                    .all()
                )
                initials = []
                # Titles to remove before extracting initials
                titles_to_remove = [
                    # Academic/Professional titles
                    'Dr.', 'DR.', 'dr.', 'Dr', 'DR',
                    'Prof.', 'PROF.', 'prof.', 'Prof', 'PROF',
                    'Doç.', 'DOÇ.', 'doç.', 'Doç', 'DOÇ',
                    'Yrd.', 'YRD.', 'yrd.', 'Yrd', 'YRD',
                    'PhD', 'PHD', 'phd', 'Ph.D.', 'Ph.D',
                    'Av.', 'AV.', 'av.',
                    'Uzm.', 'UZM.', 'uzm.',
                    # Software/IT job levels - English
                    'Senior', 'SENIOR', 'senior', 'Sr.', 'SR.', 'sr.', 'Sr', 'SR',
                    'Junior', 'JUNIOR', 'junior', 'Jr.', 'JR.', 'jr.', 'Jr', 'JR',
                    'Mid', 'MID', 'mid', 'Mid-Level', 'Mid-level', 'MID-LEVEL',
                    'Lead', 'LEAD', 'lead',
                    'Principal', 'PRINCIPAL', 'principal',
                    'Staff', 'STAFF', 'staff',
                    'Chief', 'CHIEF', 'chief',
                    'Head', 'HEAD', 'head',
                    'Associate', 'ASSOCIATE', 'associate',
                    'Intern', 'INTERN', 'intern',
                    'Trainee', 'TRAINEE', 'trainee',
                    # Software/IT job levels - Turkish
                    'Kıdemli', 'KIDEMLI', 'kıdemli',
                    'Uzman', 'UZMAN', 'uzman',
                    'Stajyer', 'STAJYER', 'stajyer',
                    'Baş', 'BAŞ', 'baş',
                    'Yardımcı', 'YARDIMCI', 'yardımcı',
                ]
                for app, candidate in recent_apps:
                    if candidate and candidate.name:
                        # Remove titles from name before getting initials
                        clean_name = candidate.name.strip()
                        for title in titles_to_remove:
                            if clean_name.startswith(title + ' '):
                                clean_name = clean_name[len(title):].strip()
                            elif clean_name.startswith(title):
                                clean_name = clean_name[len(title):].strip()
                        
                        # Get initials from cleaned name (e.g., "Furkan Avcıoğlu" -> "FA")
                        parts = clean_name.split()
                        if len(parts) >= 2:
                            initials.append(f"{parts[0][0].upper()}{parts[-1][0].upper()}")
                        elif len(parts) == 1 and len(parts[0]) > 0:
                            initials.append(f"{parts[0][0].upper()}{parts[0][1].upper() if len(parts[0]) > 1 else parts[0][0].upper()}")
                recent_applicants_map[j.id] = initials

            # Preload departments map
            from app.models.department import Department
            deps = db.query(Department).filter(Department.company_id == company_id).all()
            dep_map = {d.id: d for d in deps}

            return [
                JobType(
                    id=j.id,
                    title=j.title,
                    department_id=j.department_id,
                    intro_text=j.intro_text,
                    outro_text=j.outro_text,
                    description=j.description,
                    description_plain=j.description_plain,
                    requirements=j.requirements,
                    requirements_plain=j.requirements_plain,
                    keywords=j.keywords or [],
                    location=j.location,
                    remote_policy=j.remote_policy,
                    employment_type=j.employment_type,
                    experience_level=j.experience_level,
                    required_education=j.required_education,
                    preferred_majors=j.preferred_majors,
                    required_languages=j.required_languages or {},
                    salary_min=j.salary_min,
                    salary_max=j.salary_max,
                    salary_currency=j.salary_currency,
                    deadline=j.deadline.isoformat() if j.deadline else None,
                    start_date=j.start_date,
                    status=j.status,
                    is_active=j.is_active,
                    is_disabled_friendly=j.is_disabled_friendly or False,
                    # Interview settings
                    interview_enabled=j.interview_enabled or False,
                    interview_template_id=str(j.interview_template_id) if j.interview_template_id else None,
                    interview_deadline_hours=j.interview_deadline_hours or 72,
                    agreement_template_id=str(j.agreement_template_id) if j.agreement_template_id else None,
                    # Likert settings
                    likert_enabled=j.likert_enabled or False,
                    likert_template_id=str(j.likert_template_id) if j.likert_template_id else None,
                    likert_deadline_hours=j.likert_deadline_hours or 72,
                    created_at=j.created_at.isoformat(),
                    updated_at=j.updated_at.isoformat(),
                    analysis_count=count_map.get(j.id, 0),
                    recent_applicants=recent_applicants_map.get(j.id, []),
                    department=(
                        DepartmentType(
                            id=dep_map[j.department_id].id,
                            name=dep_map[j.department_id].name,
                            is_active=dep_map[j.department_id].is_active,
                            color=dep_map[j.department_id].color,
                            created_at=dep_map[j.department_id].created_at.isoformat(),
                            updated_at=dep_map[j.department_id].updated_at.isoformat() if dep_map[j.department_id].updated_at else None,
                        ) if j.department_id in dep_map else None
                    ),
                )
                for j in jobs
            ]
        finally:
            db.close()

    @strawberry.field
    def candidates(
        self,
        info: Info,
        department_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> list[CandidateType]:
        """List all candidates (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            from app.models import Candidate, Department
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)

            # Extract company_id from token for multi-tenancy filtering
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")

            # Build query with company_id filter
            query = db.query(Candidate).filter(Candidate.company_id == company_id)

            # Apply filters
            if department_id:
                query = query.filter(Candidate.department_id == department_id)
            if status:
                query = query.filter(Candidate.status == status)

            # Order by uploaded date (newest first)
            query = query.order_by(Candidate.uploaded_at.desc())

            candidates = query.all()

            # Convert to GraphQL types
            result = []
            
            # Get talent pool entries for all candidates in one query
            from app.modules.talent_pool.models import TalentPoolEntry
            candidate_ids = [c.id for c in candidates]
            talent_pool_entries = db.query(TalentPoolEntry).filter(
                TalentPoolEntry.candidate_id.in_(candidate_ids),
                TalentPoolEntry.company_id == company_id,
                TalentPoolEntry.status != 'archived'
            ).all()
            # Create a lookup dict
            talent_pool_map = {entry.candidate_id: entry.id for entry in talent_pool_entries}
            
            for c in candidates:
                # Get department name
                dept = db.query(Department).filter(Department.id == c.department_id, Department.company_id == company_id).first()
                dept_type = None
                if dept:
                    dept_type = DepartmentType(
                        id=dept.id,
                        name=dept.name,
                        is_active=dept.is_active,
                        color=dept.color,
                        created_at=dept.created_at.isoformat(),
                        updated_at=dept.updated_at.isoformat() if dept.updated_at else None
                    )
                
                # Check talent pool status
                in_talent_pool = c.id in talent_pool_map
                talent_pool_entry_id = talent_pool_map.get(c.id)

                result.append(CandidateType(
                    id=c.id,
                    name=c.name,
                    email=c.email,
                    phone=c.phone,
                    linkedin=c.linkedin,
                    github=c.github,
                    location=c.location,
                    birth_year=c.birth_year,
                    experience_months=c.experience_months,
                    cv_file_name=c.cv_file_name,
                    cv_file_path=c.cv_file_path,
                    cv_file_size=c.cv_file_size,
                    cv_text=c.cv_text,
                    cv_language=c.cv_language,
                    parsed_data=c.parsed_data,
                    cv_photo_path=c.cv_photo_path,
                    status=c.status.value,
                    department_id=c.department_id,
                    uploaded_at=c.uploaded_at.isoformat(),
                    updated_at=c.updated_at.isoformat() if c.updated_at else None,
                    department=dept_type,
                    in_talent_pool=in_talent_pool,
                    talent_pool_entry_id=talent_pool_entry_id
                ))

            return result

        finally:
            db.close()

    @strawberry.field
    def applications(
        self,
        info: Info,
        job_id: Optional[str] = None,
        candidate_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[ApplicationType]:
        """Get applications (CV analysis results)"""
        from app.models.application import Application
        from app.models.job import Job
        from app.models.candidate import Candidate
        from app.models.department import Department

        # Get authorization header
        request = info.context["request"]
        auth_header = request.headers.get("authorization")

        if not auth_header:
            raise Exception("Not authenticated")

        # Extract token
        try:
            scheme, token = auth_header.split()
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            # Verify user is authenticated
            current = get_current_user_from_token(token, db)

            # Extract company_id from token for multi-tenancy filtering
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")

            # Build query with company_id filter
            query = db.query(Application).filter(Application.company_id == company_id)

            if job_id:
                query = query.filter(Application.job_id == job_id)

            if candidate_id:
                query = query.filter(Application.candidate_id == candidate_id)

            if status:
                from app.models.application import ApplicationStatus
                try:
                    status_enum = ApplicationStatus(status)
                    query = query.filter(Application.status == status_enum)
                except ValueError:
                    pass  # Invalid status, ignore filter

            # Order by score descending
            query = query.order_by(Application.overall_score.desc())

            applications = query.all()

            result = []
            for app in applications:
                # Get job info
                job = db.query(Job).filter(Job.id == app.job_id, Job.company_id == company_id).first()
                job_type = None
                if job:
                    dept = db.query(Department).filter(Department.id == job.department_id, Department.company_id == company_id).first()
                    dept_type_for_job = None
                    if dept:
                        dept_type_for_job = DepartmentType(
                            id=dept.id,
                            name=dept.name,
                            is_active=dept.is_active,
                            color=dept.color,
                            created_at=dept.created_at.isoformat(),
                            updated_at=dept.updated_at.isoformat() if dept.updated_at else None
                        )
                    job_type = JobType(
                        id=job.id,
                        title=job.title,
                        department_id=job.department_id,
                        intro_text=job.intro_text,
                        outro_text=job.outro_text,
                        description=job.description,
                        requirements=job.requirements,
                        description_plain=job.description_plain,
                        requirements_plain=job.requirements_plain,
                        keywords=job.keywords or [],
                        location=job.location,
                        remote_policy=job.remote_policy,
                        employment_type=job.employment_type,
                        experience_level=job.experience_level,
                        required_education=job.required_education,
                        preferred_majors=job.preferred_majors,
                        required_languages=job.required_languages or {},
                        salary_min=job.salary_min,
                        salary_max=job.salary_max,
                        salary_currency=job.salary_currency,
                        deadline=job.deadline.isoformat() if job.deadline else None,
                        start_date=job.start_date,
                        status=job.status,
                        is_active=job.is_active,
                        created_at=job.created_at.isoformat(),
                        updated_at=job.updated_at.isoformat() if job.updated_at else None,
                        department=dept_type_for_job,
                    )

                # Get candidate info
                candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id, Candidate.company_id == company_id).first()
                candidate_type = None
                if candidate:
                    dept = db.query(Department).filter(Department.id == candidate.department_id, Department.company_id == company_id).first()
                    dept_type = None
                    if dept:
                        dept_type = DepartmentType(
                            id=dept.id,
                            name=dept.name,
                            is_active=dept.is_active,
                            color=dept.color,
                            created_at=dept.created_at.isoformat(),
                            updated_at=dept.updated_at.isoformat() if dept.updated_at else None
                        )

                    # Check talent pool status for this candidate
                    from app.modules.talent_pool.models import TalentPoolEntry
                    talent_pool_entry = db.query(TalentPoolEntry).filter(
                        TalentPoolEntry.candidate_id == candidate.id,
                        TalentPoolEntry.company_id == company_id
                    ).first()
                    
                    candidate_type = CandidateType(
                        id=candidate.id,
                        name=candidate.name,
                        email=candidate.email,
                        phone=candidate.phone,
                        location=candidate.location,
                        birth_year=candidate.birth_year,
                        experience_months=candidate.experience_months,
                        cv_file_name=candidate.cv_file_name,
                        cv_file_path=candidate.cv_file_path,
                        cv_file_size=candidate.cv_file_size,
                        cv_text=candidate.cv_text,
                        cv_language=candidate.cv_language,
                        parsed_data=candidate.parsed_data,
                        cv_photo_path=candidate.cv_photo_path,
                        status=candidate.status.value,
                        department_id=candidate.department_id,
                        uploaded_at=candidate.uploaded_at.isoformat(),
                        updated_at=candidate.updated_at.isoformat() if candidate.updated_at else None,
                        department=dept_type,
                        in_talent_pool=talent_pool_entry is not None,
                        talent_pool_entry_id=str(talent_pool_entry.id) if talent_pool_entry else None
                    )

                # Check for interview and likert sessions
                from app.models.interview import InterviewSession
                from app.modules.likert.models import LikertSession
                from app.modules.second_interview.models import SecondInterview
                
                interview_session = db.query(InterviewSession).filter(
                    InterviewSession.application_id == app.id
                ).first()
                likert_session = db.query(LikertSession).filter(
                    LikertSession.application_id == app.id
                ).first()
                # Get the most recent active (invited) interview, or the latest one if none active
                from app.modules.second_interview.models import SecondInterviewStatus
                second_interview = db.query(SecondInterview).filter(
                    SecondInterview.application_id == app.id,
                    SecondInterview.status == SecondInterviewStatus.INVITED
                ).order_by(SecondInterview.created_at.desc()).first()
                
                if not second_interview:
                    second_interview = db.query(SecondInterview).filter(
                        SecondInterview.application_id == app.id
                    ).order_by(SecondInterview.created_at.desc()).first()
                
                # Build second interview type if exists
                second_interview_type = None
                if second_interview:
                    second_interview_type = SecondInterviewGQLType(
                        id=str(second_interview.id),
                        interview_type=second_interview.interview_type.value if second_interview.interview_type else "online",
                        platform=second_interview.platform.value if second_interview.platform else None,
                        meeting_link=second_interview.meeting_link,
                        location_address=second_interview.location_address,
                        scheduled_date=second_interview.scheduled_date.isoformat() if second_interview.scheduled_date else "",
                        scheduled_time=second_interview.scheduled_time or "",
                        candidate_message=second_interview.candidate_message,
                        invitation_sent_at=second_interview.invitation_sent_at.isoformat() if second_interview.invitation_sent_at else None,
                        status=second_interview.status.value if second_interview.status else "invited",
                        outcome=second_interview.outcome.value if second_interview.outcome else None,
                        feedback_notes=second_interview.feedback_notes,
                        feedback_at=second_interview.feedback_at.isoformat() if second_interview.feedback_at else None,
                        created_at=second_interview.created_at.isoformat() if second_interview.created_at else None,
                        updated_at=second_interview.updated_at.isoformat() if second_interview.updated_at else None,
                    )
                
                result.append(ApplicationType(
                    id=app.id,
                    job_id=app.job_id,
                    candidate_id=app.candidate_id,
                    analysis_data=app.analysis_data,
                    overall_score=app.overall_score,
                    status=app.status.value,
                    analyzed_at=app.analyzed_at.isoformat() if app.analyzed_at else None,
                    reviewed_at=app.reviewed_at.isoformat() if app.reviewed_at else None,
                    reviewed_by=app.reviewed_by,
                    notes=app.notes,
                    created_at=app.created_at.isoformat(),
                    updated_at=app.updated_at.isoformat() if app.updated_at else None,
                    has_interview_session=interview_session is not None,
                    has_likert_session=likert_session is not None,
                    interview_session_status=interview_session.status if interview_session else None,
                    likert_session_status=likert_session.status if likert_session else None,
                    has_second_interview=second_interview is not None,
                    second_interview_status=second_interview.status.value if second_interview else None,
                    second_interview_outcome=second_interview.outcome.value if second_interview and second_interview.outcome else None,
                    second_interview=second_interview_type,
                    rejection_note=app.rejection_note,
                    rejected_at=app.rejected_at.isoformat() if app.rejected_at else None,
                    rejection_template_id=app.rejection_template_id,
                    job=job_type,
                    candidate=candidate_type
                ))

            return result

        finally:
            db.close()

    @strawberry.field
    def compare_candidates(
        self,
        info: Info,
        candidateId1: str,
        candidateId2: str,
        jobId: Optional[str] = None,
        language: Optional[str] = None,
    ) -> ComparisonResultType:
        """Compare two candidates (ephemeral, no persistence)."""
        import httpx
        from app.models.candidate import Candidate
        from app.models.job import Job
        from app.core.config import settings

        # Auth
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            _ = scheme
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            # Load candidates
            a = db.query(Candidate).filter(Candidate.id == candidateId1).first()
            b = db.query(Candidate).filter(Candidate.id == candidateId2).first()
            if not a or not b:
                raise Exception("Candidates not found")

            job_payload = None
            if jobId:
                job = db.query(Job).filter(Job.id == jobId).first()
                if job:
                    job_payload = {
                        "title": job.title,
                        "department": job.department.name if job.department else None,
                        "requirements_plain": job.requirements_plain,
                        "description_plain": job.description_plain,
                        "required_languages": job.required_languages or {},
                        "location": job.location,
                    }

            # Prepare trimmed candidate payloads for AI (only for evaluation)
            def _cand(c):
                return {
                    "name": c.name,
                    "parsed_data": c.parsed_data or {},
                }

            payload = {
                "candidate_a": _cand(a),
                "candidate_b": _cand(b),
                "job_data": job_payload,
                "language": language or "turkish",
            }

            # Call AI-Service synchronously to avoid event-loop issues
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(f"{settings.AI_SERVICE_URL}/compare-cvs", json=payload)

            if resp.status_code != 200:
                raise Exception(f"AI-Service compare failed: {resp.text}")
            body = resp.json()
            if not body.get("success"):
                raise Exception(body.get("error", "compare failed"))
            raw = body.get("data") or {}

            # Import new types
            from app.graphql.types import (
                LanguageInfoType,
                EducationInfoType,
                SkillsCompareType,
                CandidateCompareType,
                AIEvaluationType,
                AIEvaluationBothType,
                ComparisonResultType,
            )

            # Extract data directly from database instead of asking AI
            def _extract_from_db(candidate):
                parsed = candidate.parsed_data or {}
                personal = parsed.get("personal_info") or parsed.get("personal") or {}

                # Languages - check multiple locations, including skills.languages
                langs: List[LanguageInfoType] = []
                seen_langs = set()

                def _add_lang(lang_name: str, level: str = "Bilinmiyor"):
                    key = (lang_name or "").strip().lower()
                    if not key:
                        return
                    if key in seen_langs:
                        return
                    seen_langs.add(key)
                    langs.append(LanguageInfoType(language=lang_name, level=level or "Bilinmiyor"))

                # Source 1: personal.languages or parsed.languages
                languages_raw_1 = personal.get("languages") or parsed.get("languages") or []
                if not isinstance(languages_raw_1, list):
                    languages_raw_1 = []
                for lang_item in languages_raw_1:
                    if isinstance(lang_item, dict):
                        _add_lang(
                            lang_item.get("language") or lang_item.get("name") or "",
                            lang_item.get("level") or lang_item.get("proficiency") or "Bilinmiyor",
                        )
                    elif isinstance(lang_item, str):
                        _add_lang(lang_item, "Bilinmiyor")

                # Source 2: parsed.skills.languages (array of {language, level})
                skills_obj = parsed.get("skills") or {}
                if isinstance(skills_obj, dict):
                    skills_langs = skills_obj.get("languages") or []
                    if not isinstance(skills_langs, list):
                        skills_langs = []
                    for li in skills_langs:
                        if isinstance(li, dict):
                            _add_lang(
                                li.get("language") or li.get("name") or "",
                                li.get("level") or li.get("proficiency") or "Bilinmiyor",
                            )
                        elif isinstance(li, str):
                            _add_lang(li, "Bilinmiyor")
                
                # Education
                edu_list = []
                education_raw = parsed.get("education") or []
                if not isinstance(education_raw, list):
                    education_raw = []
                for edu in education_raw:
                    if isinstance(edu, dict):
                        school = edu.get("school") or edu.get("institution") or edu.get("university") or "Bilinmiyor"
                        department = edu.get("department") or edu.get("field") or edu.get("degree") or "Bilinmiyor"
                        start = edu.get("start_date") or edu.get("start") or ""
                        end = edu.get("end_date") or edu.get("end") or ""
                        years = f"{start} - {end}" if start or end else "Bilinmiyor"
                        edu_list.append(EducationInfoType(school=school, department=department, years=years))
                
                # Skills - flatten from parsed.skills dict categories or list
                skills: List[str] = []
                skills_field = parsed.get("skills")
                if isinstance(skills_field, dict):
                    for key, value in skills_field.items():
                        if key and key.lower() == "languages":
                            # skip languages; handled separately
                            continue
                        if isinstance(value, list):
                            for s in value:
                                if isinstance(s, str) and s.strip():
                                    skills.append(s.strip())
                                elif isinstance(s, dict):
                                    nm = s.get("name") or s.get("skill") or s.get("tool") or str(s)
                                    if nm and str(nm).strip():
                                        skills.append(str(nm).strip())
                elif isinstance(skills_field, list):
                    for s in skills_field:
                        if isinstance(s, str) and s.strip():
                            skills.append(s.strip())
                        elif isinstance(s, dict):
                            nm = s.get("name") or s.get("skill") or s.get("tool") or str(s)
                            if nm and str(nm).strip():
                                skills.append(str(nm).strip())
                else:
                    skills = []

                # Deduplicate skills, preserve order
                seen = set()
                deduped_skills: List[str] = []
                for s in skills:
                    k = s.lower()
                    if k in seen:
                        continue
                    seen.add(k)
                    deduped_skills.append(s)
                
                # Experience years from database
                exp_months = candidate.experience_months or 0
                exp_years = round(exp_months / 12.0, 1)
                total_exp = f"{exp_years} Yıl" if exp_years > 0 else "Belirtilmemiş"
                
                return {
                    "name": candidate.name or "İsimsiz",
                    "total_experience_years": total_exp,
                    "languages": langs,
                    "education": edu_list,
                    "skills": deduped_skills,
                }
            
            data_a = _extract_from_db(a)
            data_b = _extract_from_db(b)
            
            # Debug logging
            logger.info(f"🔍 Candidate A parsed_data keys: {list((a.parsed_data or {}).keys())}")
            logger.info(f"🔍 Candidate A languages: {data_a['languages']}")
            logger.info(f"🔍 Candidate A skills count: {len(data_a['skills'])}")
            logger.info(f"🔍 Candidate B parsed_data keys: {list((b.parsed_data or {}).keys())}")
            logger.info(f"🔍 Candidate B languages: {data_b['languages']}")
            logger.info(f"🔍 Candidate B skills count: {len(data_b['skills'])}")
            
            # Calculate common and unique skills
            skills_a_set = set(data_a["skills"])
            skills_b_set = set(data_b["skills"])
            common_skills = sorted(skills_a_set & skills_b_set)
            unique_a = sorted(skills_a_set - skills_b_set)
            unique_b = sorted(skills_b_set - skills_a_set)
            
            # Build candidate objects
            candidate_a_obj = CandidateCompareType(
                name=data_a["name"],
                total_experience_years=data_a["total_experience_years"],
                languages=data_a["languages"],
                education=data_a["education"],
                skills=SkillsCompareType(common=common_skills, unique=unique_a)
            )
            
            candidate_b_obj = CandidateCompareType(
                name=data_b["name"],
                total_experience_years=data_b["total_experience_years"],
                languages=data_b["languages"],
                education=data_b["education"],
                skills=SkillsCompareType(common=common_skills, unique=unique_b)
            )

            # Parse aiEvaluation (only thing we get from AI now)
            ai_eval_raw = raw.get("aiEvaluation") or {}
            ai_a = ai_eval_raw.get("candidateA") or {}
            ai_b = ai_eval_raw.get("candidateB") or {}
            ai_eval_obj = AIEvaluationBothType(
                candidate_a=AIEvaluationType(
                    strengths=ai_a.get("strengths") or [],
                    suitable_positions=ai_a.get("suitablePositions") or []
                ),
                candidate_b=AIEvaluationType(
                    strengths=ai_b.get("strengths") or [],
                    suitable_positions=ai_b.get("suitablePositions") or []
                )
            )

            return ComparisonResultType(
                candidate_a=candidate_a_obj,
                candidate_b=candidate_b_obj,
                ai_evaluation=ai_eval_obj
            )
        finally:
            db.close()

    @strawberry.field
    def get_usage_history(
        self,
        info: Info,
        resource_type: str,
        period_start: Optional[str] = None,
        period_end: Optional[str] = None
    ) -> List[UsageHistoryItem]:
        """
        Get usage history for a company by resource type and optional period.
        Uses idx_usage_tracking_company_resource index for performance.
        
        Args:
            resource_type: "cv_upload" or "ai_analysis"
            period_start: ISO date string for period start (optional)
            period_end: ISO date string for period end (optional)
        """
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        
        if not auth_header:
            raise Exception("Not authenticated")
        
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")
        
        db = get_db_session()
        try:
            # Authenticate user and get company_id
            current = get_current_user_from_token(token, db)
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")
            
            from app.models.subscription import UsageTracking
            from datetime import datetime
            from sqlalchemy import and_
            
            # Build query with company_id and resource_type (uses idx_usage_tracking_company_resource)
            query = db.query(UsageTracking).filter(
                and_(
                    UsageTracking.company_id == company_id,
                    UsageTracking.resource_type == resource_type
                )
            )
            
            # Add period filters if provided
            if period_start:
                start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00')).date()
                query = query.filter(UsageTracking.period_start >= start_date)
            
            if period_end:
                end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00')).date()
                query = query.filter(UsageTracking.period_end <= end_date)
            
            # Order by created_at desc (most recent first)
            usage_records = query.order_by(UsageTracking.created_at.desc()).all()
            
            # Convert to GraphQL types
            result = []
            for record in usage_records:
                result.append(UsageHistoryItem(
                    id=str(record.id),
                    batch_number=record.batch_number or "",
                    resource_type=record.resource_type,
                    count=record.count,
                    created_at=record.created_at.isoformat(),
                    period_start=record.period_start.isoformat(),
                    period_end=record.period_end.isoformat(),
                    metadata=record.usage_metadata  # Contains candidate_name, session_id, etc.
                ))
            
            return result
            
        except Exception as e:
            logger.error(f"Error in get_usage_history: {str(e)}")
            raise Exception(f"Failed to fetch usage history: {str(e)}")
        finally:
            db.close()

    @strawberry.field
    def get_usage_session_detail(
        self,
        info: Info,
        batch_number: str
    ) -> Optional[UsageSessionDetail]:
        """
        Get detailed view of a specific usage session by batch_number.
        Uses idx_candidates_batch_company and idx_applications_batch_company indexes.
        
        Args:
            batch_number: The batch number to fetch details for
        """
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        
        if not auth_header:
            raise Exception("Not authenticated")
        
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")
        
        db = get_db_session()
        try:
            # Authenticate user and get company_id
            current = get_current_user_from_token(token, db)
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")
            
            from app.models.subscription import UsageTracking
            from app.models.candidate import Candidate
            from app.models.application import Application
            from app.models.job import Job
            from sqlalchemy import and_
            
            # Get usage tracking record for metadata
            usage_record = db.query(UsageTracking).filter(
                and_(
                    UsageTracking.company_id == company_id,
                    UsageTracking.batch_number == batch_number
                )
            ).first()
            
            if not usage_record:
                raise Exception(f"Usage session not found: {batch_number}")
            
            resource_type = usage_record.resource_type
            candidates = []
            applications = []
            
            # Fetch candidates if CV upload session (uses idx_candidates_batch_company)
            if resource_type == "cv_upload":
                candidate_records = db.query(Candidate).filter(
                    and_(
                        Candidate.company_id == company_id,
                        Candidate.batch_number == batch_number
                    )
                ).all()
                
                for cand in candidate_records:
                    candidates.append(UsageSessionCandidate(
                        id=str(cand.id),
                        name=cand.name,
                        email=cand.email,
                        cv_file_name=cand.cv_file_name,
                        status=cand.status,
                        location=cand.location,
                        uploaded_at=cand.uploaded_at.isoformat()
                    ))
            
            # Fetch applications if AI analysis session (uses idx_applications_batch_company)
            elif resource_type == "ai_analysis":
                application_records = db.query(Application).filter(
                    and_(
                        Application.company_id == company_id,
                        Application.batch_number == batch_number
                    )
                ).all()
                
                for app in application_records:
                    # Get job title and candidate name
                    job_title = None
                    candidate_name = None
                    
                    if app.job_id:
                        job = db.query(Job).filter(Job.id == app.job_id).first()
                        if job:
                            job_title = job.title
                    
                    if app.candidate_id:
                        cand = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
                        if cand:
                            candidate_name = cand.name
                    
                    applications.append(UsageSessionApplication(
                        id=str(app.id),
                        job_id=str(app.job_id),
                        candidate_id=str(app.candidate_id),
                        overall_score=app.overall_score,
                        status=app.status,
                        analyzed_at=app.analyzed_at.isoformat() if app.analyzed_at else None,
                        job_title=job_title,
                        candidate_name=candidate_name
                    ))
            
            return UsageSessionDetail(
                batch_number=batch_number,
                resource_type=resource_type,
                count=usage_record.count,
                created_at=usage_record.created_at.isoformat(),
                candidates=candidates,
                applications=applications
            )
            
        except Exception as e:
            logger.error(f"Error in get_usage_session_detail: {str(e)}")
            raise Exception(f"Failed to fetch session detail: {str(e)}")
        finally:
            db.close()

    @strawberry.field
    def get_usage_periods(
        self,
        info: Info,
        months_limit: Optional[int] = None
    ) -> List[UsagePeriodSummary]:
        """
        Return only periods (months) that have usage for CV uploads or AI analyses,
        aggregated by month. Newest first. Limits to last N months if provided.
        """
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            _ = scheme
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            # Auth and company
            _ = get_current_user_from_token(token, db)
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")

            from sqlalchemy import func, case, and_
            from app.models.subscription import UsageTracking
            from datetime import date

            # Aggregate by month (period_start/period_end already normalized per our writes)
            q = (
                db.query(
                    UsageTracking.period_start.label("ps"),
                    UsageTracking.period_end.label("pe"),
                    func.sum(UsageTracking.count).label("total"),
                    func.sum(case((UsageTracking.resource_type == "cv_upload", UsageTracking.count), else_=0)).label("cv_uploads"),
                    func.sum(case((UsageTracking.resource_type == "ai_analysis", UsageTracking.count), else_=0)).label("ai_analyses"),
                    func.sum(case((UsageTracking.resource_type == "interview_completed", UsageTracking.count), else_=0)).label("interview_completed"),
                    func.sum(case((UsageTracking.resource_type == "interview_ai_analysis", UsageTracking.count), else_=0)).label("interview_ai_analysis"),
                )
                .filter(UsageTracking.company_id == company_id)
                .filter(UsageTracking.resource_type.in_(["cv_upload", "ai_analysis", "interview_completed", "interview_ai_analysis"]))
                .group_by(UsageTracking.period_start, UsageTracking.period_end)
                .order_by(UsageTracking.period_start.desc())
            )

            if months_limit and months_limit > 0:
                q = q.limit(months_limit)

            rows = q.all()
            result: List[UsagePeriodSummary] = []
            for ps, pe, total, cvu, aia, int_comp, int_ai in rows:
                # Build localized label like "Kasım 2025"
                try:
                    import locale
                    locale.setlocale(locale.LC_TIME, "tr_TR.UTF-8")
                    label = ps.strftime("%B %Y")
                    # Capitalize first letter (locale-aware)
                    label = label[:1].upper() + label[1:]
                except Exception:
                    label = f"{ps.strftime('%B')} {ps.year}"
                result.append(UsagePeriodSummary(
                    label=label,
                    period_start=ps.isoformat(),
                    period_end=pe.isoformat(),
                    total_credits=int(total or 0),
                    cv_analyses=int(aia or 0),
                    cv_uploads=int(cvu or 0),
                    interview_completed=int(int_comp or 0),
                    interview_ai_analysis=int(int_ai or 0),
                ))

            return result
        except Exception as e:
            logger.error(f"Error in get_usage_periods: {e}")
            raise Exception("Failed to fetch usage periods")
        finally:
            db.close()

    # ============ Interview Template Queries ============
    @strawberry.field
    def interview_templates(self, info: Info) -> List[InterviewTemplateType]:
        """Get all interview templates for the current company"""
        from app.modules.interview.resolvers import get_interview_templates
        return get_interview_templates(info)

    @strawberry.field
    def interview_template(self, info: Info, id: str) -> Optional[InterviewTemplateType]:
        """Get a single interview template with questions"""
        from app.modules.interview.resolvers import get_interview_template
        return get_interview_template(info, id)

    # ============ Agreement Template Queries ============
    @strawberry.field
    def agreement_templates(self, info: Info) -> List[AgreementTemplateType]:
        """Get all agreement templates for the current company"""
        from app.modules.agreement.resolvers import get_agreement_templates
        return get_agreement_templates(info)

    # ============ Likert Template Queries ============
    @strawberry.field
    def likert_templates(self, info: Info) -> List[LikertTemplateType]:
        """Get all likert templates for the current company"""
        from app.modules.likert.resolvers import get_likert_templates
        return get_likert_templates(info)

    @strawberry.field
    def likert_template(self, info: Info, id: str) -> Optional[LikertTemplateType]:
        """Get a single likert template with questions"""
        from app.modules.likert.resolvers import get_likert_template
        return get_likert_template(info, id)

    # ============ Rejection Template Queries ============
    @strawberry.field
    def rejection_templates(self, info: Info) -> List["RejectionTemplateType"]:
        """Get all rejection templates for the current company"""
        from app.modules.rejection.resolvers import get_rejection_templates
        return get_rejection_templates(info)

    @strawberry.field
    def rejection_template(self, info: Info, id: str) -> Optional["RejectionTemplateType"]:
        """Get a single rejection template by ID"""
        from app.modules.rejection.resolvers import get_rejection_template
        return get_rejection_template(info, id)

    # ============ Job Intro Template Queries ============
    @strawberry.field
    def job_intro_templates(self, info: Info, active_only: bool = False) -> List["JobIntroTemplateType"]:
        """Get all job intro templates for the current company"""
        from app.modules.job_intro.resolvers import get_job_intro_templates
        return get_job_intro_templates(info, active_only)

    # ============ Job Outro Template Queries ============
    @strawberry.field
    def job_outro_templates(self, info: Info, active_only: bool = False) -> List["JobOutroTemplateType"]:
        """Get all job outro templates for the current company"""
        from app.modules.job_outro.resolvers import get_job_outro_templates
        return get_job_outro_templates(info, active_only)

    @strawberry.field
    def interview_session(self, info: Info, token: str) -> Optional["InterviewSessionFullType"]:
        """Get interview session by token (public - for candidates)"""
        from app.modules.interview.resolvers import get_interview_session
        return get_interview_session(info, token)

    @strawberry.field
    def likert_session(self, info: Info, token: str) -> Optional["LikertSessionFullType"]:
        """Get likert session by token (public - for candidates)"""
        from app.modules.likert.models import LikertSession, LikertTemplate, LikertQuestion
        from app.models.job import Job
        from app.models.candidate import Candidate
        from app.modules.agreement.models import AgreementTemplate
        
        db = get_db_session()
        try:
            session = db.query(LikertSession).filter(LikertSession.token == token).first()
            if not session:
                return None
            
            template = db.query(LikertTemplate).filter(LikertTemplate.id == session.template_id).first()
            job = db.query(Job).filter(Job.id == session.job_id).first()
            candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
            
            template_type = None
            if template:
                questions = db.query(LikertQuestion).filter(
                    LikertQuestion.template_id == template.id
                ).order_by(LikertQuestion.question_order).all()
                
                template_type = LikertTemplateType(
                    id=str(template.id),
                    name=template.name,
                    description=template.description,
                    scale_type=template.scale_type or 5,
                    scale_labels=template.scale_labels or ["Kesinlikle Katılmıyorum", "Katılmıyorum", "Kararsızım", "Katılıyorum", "Kesinlikle Katılıyorum"],
                    language=template.language or "tr",
                    is_active=template.is_active,
                    time_limit=template.time_limit,
                    question_count=len(questions),
                    questions=[
                        LikertQuestionType(
                            id=str(q.id),
                            question_text=q.question_text,
                            question_order=q.question_order,
                            is_reverse_scored=q.is_reverse_scored or False,
                        ) for q in questions
                    ],
                    created_at=template.created_at.isoformat(),
                    updated_at=template.updated_at.isoformat() if template.updated_at else None,
                )
            
            # Build job type with agreement template
            job_type = None
            if job:
                agreement_template = None
                if job.agreement_template_id:
                    agreement = db.query(AgreementTemplate).filter(AgreementTemplate.id == job.agreement_template_id).first()
                    if agreement:
                        agreement_template = AgreementTemplateType(
                            id=str(agreement.id),
                            name=agreement.name,
                            content=agreement.content,
                            is_active=agreement.is_active,
                            created_at=agreement.created_at.isoformat(),
                            updated_at=agreement.updated_at.isoformat() if agreement.updated_at else None,
                        )
                
                job_type = LikertJobType(
                    id=str(job.id),
                    title=job.title,
                    description=job.description,
                    description_plain=job.description_plain,
                    location=job.location,
                    agreement_template_id=str(job.agreement_template_id) if job.agreement_template_id else None,
                    agreement_template=agreement_template,
                )
            
            # Build candidate type
            candidate_type = None
            if candidate:
                candidate_type = LikertCandidateType(
                    id=str(candidate.id),
                    name=candidate.name,
                    cv_photo_path=candidate.cv_photo_path,
                    email=candidate.email,
                )
            
            return LikertSessionFullType(
                id=str(session.id),
                token=session.token,
                status=session.status,
                expires_at=session.expires_at.isoformat() if session.expires_at else None,
                started_at=session.started_at.isoformat() if session.started_at else None,
                completed_at=session.completed_at.isoformat() if session.completed_at else None,
                created_at=session.created_at.isoformat() if session.created_at else None,
                template=template_type,
                job=job_type,
                candidate=candidate_type,
            )
        finally:
            db.close()

    @strawberry.field
    def likert_session_by_application(self, info: Info, application_id: str) -> Optional["LikertSessionWithAnswersType"]:
        """Get likert session by application ID (for HR view with answers)"""
        from app.modules.likert.models import LikertSession, LikertTemplate, LikertQuestion, LikertAnswer
        from app.models.job import Job
        from app.models.candidate import Candidate
        
        db = get_db_session()
        try:
            session = db.query(LikertSession).filter(LikertSession.application_id == application_id).first()
            if not session:
                return None
            
            template = db.query(LikertTemplate).filter(LikertTemplate.id == session.template_id).first()
            job = db.query(Job).filter(Job.id == session.job_id).first()
            candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
            answers = db.query(LikertAnswer).filter(LikertAnswer.session_id == session.id).all()
            
            template_type = None
            questions_list = []
            if template:
                questions = db.query(LikertQuestion).filter(
                    LikertQuestion.template_id == template.id
                ).order_by(LikertQuestion.question_order).all()
                questions_list = questions
                
                template_type = LikertTemplateType(
                    id=str(template.id),
                    name=template.name,
                    description=template.description,
                    scale_type=template.scale_type or 5,
                    scale_labels=template.scale_labels or ["Kesinlikle Katılmıyorum", "Katılmıyorum", "Kararsızım", "Katılıyorum", "Kesinlikle Katılıyorum"],
                    language=template.language or "tr",
                    is_active=template.is_active,
                    time_limit=template.time_limit,
                    question_count=len(questions),
                    questions=[
                        LikertQuestionType(
                            id=str(q.id),
                            question_text=q.question_text,
                            question_order=q.question_order,
                            is_reverse_scored=q.is_reverse_scored or False,
                        ) for q in questions
                    ],
                    created_at=template.created_at.isoformat(),
                    updated_at=template.updated_at.isoformat() if template.updated_at else None,
                )
            
            job_type = None
            if job:
                job_type = LikertJobType(
                    id=str(job.id),
                    title=job.title,
                    description=job.description,
                    description_plain=job.description_plain,
                    location=job.location,
                )
            
            candidate_type = None
            if candidate:
                candidate_type = LikertCandidateType(
                    id=str(candidate.id),
                    name=candidate.name,
                    cv_photo_path=candidate.cv_photo_path,
                    email=candidate.email,
                )
            
            # Build answers with question text
            answers_type = []
            for a in answers:
                q = next((q for q in questions_list if str(q.id) == str(a.question_id)), None)
                answers_type.append(LikertAnswerWithQuestionType(
                    id=str(a.id),
                    question_id=str(a.question_id),
                    question_text=q.question_text if q else "",
                    question_order=q.question_order if q else 0,
                    score=a.score,
                ))
            
            return LikertSessionWithAnswersType(
                id=str(session.id),
                token=session.token,
                status=session.status,
                expires_at=session.expires_at.isoformat() if session.expires_at else None,
                started_at=session.started_at.isoformat() if session.started_at else None,
                completed_at=session.completed_at.isoformat() if session.completed_at else None,
                created_at=session.created_at.isoformat() if session.created_at else None,
                total_score=session.total_score,
                template=template_type,
                job=job_type,
                candidate=candidate_type,
                answers=sorted(answers_type, key=lambda x: x.question_order),
            )
        finally:
            db.close()

    @strawberry.field
    def interview_session_by_application(self, info: Info, application_id: str) -> Optional["InterviewSessionWithAnswersType"]:
        """Get interview session by application ID (for HR view with answers)"""
        from app.modules.interview.resolvers import get_interview_session_by_application
        return get_interview_session_by_application(info, application_id)

    # ============ History Queries ============
    @strawberry.field
    def action_types(self, info: Info) -> List["ActionTypeType"]:
        """Get all action types"""
        from app.modules.history.resolvers import get_action_types
        return get_action_types(info)

    @strawberry.field
    def application_history(self, info: Info, application_id: str) -> "HistoryListResponse":
        """Get full history for an application"""
        from app.modules.history.resolvers import get_application_history
        return get_application_history(info, application_id)

    @strawberry.field
    def last_status(self, info: Info, application_id: str) -> Optional["LastStatusType"]:
        """Get last status for an application"""
        from app.modules.history.resolvers import get_last_status
        return get_last_status(info, application_id)

    @strawberry.field
    def recent_activities(self, info: Info, limit: int = 10) -> "RecentActivitiesResponse":
        """Get recent activities across all applications"""
        from app.modules.history.resolvers import get_recent_activities
        return get_recent_activities(info, limit)

    # ============ Talent Pool Queries ============
    @strawberry.field
    def talent_pool_tags(self, info: Info) -> List[TalentPoolTagType]:
        """Get all talent pool tags for the current company"""
        from app.modules.talent_pool.resolvers import get_talent_pool_tags
        return get_talent_pool_tags(info)

    @strawberry.field
    def talent_pool_entries(self, info: Info, filter: Optional[TalentPoolFilterInput] = None) -> List[TalentPoolEntryType]:
        """Get all talent pool entries with optional filtering"""
        from app.modules.talent_pool.resolvers import get_talent_pool_entries
        return get_talent_pool_entries(info, filter)

    @strawberry.field
    def talent_pool_entry(self, info: Info, id: str) -> Optional[TalentPoolEntryType]:
        """Get a single talent pool entry by ID"""
        from app.modules.talent_pool.resolvers import get_talent_pool_entry
        return get_talent_pool_entry(info, id)

    @strawberry.field
    def talent_pool_stats(self, info: Info) -> TalentPoolStatsType:
        """Get talent pool statistics"""
        from app.modules.talent_pool.resolvers import get_talent_pool_stats
        return get_talent_pool_stats(info)

    @strawberry.field
    def is_candidate_in_talent_pool(self, info: Info, candidate_id: str) -> bool:
        """Check if a candidate is already in the talent pool"""
        from app.modules.talent_pool.resolvers import is_candidate_in_talent_pool
        return is_candidate_in_talent_pool(info, candidate_id)

    # ============ Second Interview Queries ============
    @strawberry.field
    def second_interview(self, info: Info, id: str) -> Optional[SecondInterviewGQLType]:
        """Get a single second interview by ID"""
        from app.modules.second_interview.resolvers import get_second_interview
        return get_second_interview(info, id)

    @strawberry.field
    def second_interview_by_application(
        self, 
        info: Info, 
        application_id: str = strawberry.argument(name="applicationId")
    ) -> Optional[SecondInterviewGQLType]:
        """Get second interview for a specific application"""
        from app.modules.second_interview.resolvers import get_second_interview_by_application
        return get_second_interview_by_application(info, application_id)

    @strawberry.field
    def second_interviews_by_job(
        self, 
        info: Info, 
        job_id: str = strawberry.argument(name="jobId")
    ) -> List[SecondInterviewGQLType]:
        """Get all second interviews for a specific job"""
        from app.modules.second_interview.resolvers import get_second_interviews_by_job
        return get_second_interviews_by_job(info, job_id)

    @strawberry.field
    def all_interviews_by_application(
        self, 
        info: Info, 
        application_id: str = strawberry.argument(name="applicationId")
    ) -> List[SecondInterviewGQLType]:
        """Get all interviews for a specific application"""
        from app.modules.second_interview.resolvers import get_all_interviews_by_application
        return get_all_interviews_by_application(info, application_id)

    @strawberry.field
    def check_active_interview(
        self, 
        info: Info, 
        application_id: str = strawberry.argument(name="applicationId")
    ) -> Optional[SecondInterviewGQLType]:
        """Check if there's an active interview (not completed and date not passed)"""
        from app.modules.second_interview.resolvers import check_active_interview
        return check_active_interview(info, application_id)

    # ============================================
    # Second Interview Template Queries
    # ============================================
    
    @strawberry.field
    def second_interview_templates(
        self, 
        info: Info, 
        template_type: Optional[SecondInterviewTemplateTypeEnum] = None
    ) -> List[SecondInterviewTemplateGQLType]:
        """Get all second interview templates, optionally filtered by type (online/in_person)"""
        from app.modules.second_interview_template.resolvers import get_second_interview_templates
        return get_second_interview_templates(info, template_type)

    @strawberry.field
    def second_interview_template(self, info: Info, id: str) -> Optional[SecondInterviewTemplateGQLType]:
        """Get a single second interview template by ID"""
        from app.modules.second_interview_template.resolvers import get_second_interview_template
        return get_second_interview_template(info, id)

    @strawberry.field
    def second_interview_template_variables(self, info: Info) -> TemplateVariablesResponse:
        """Get available template variables for second interview templates"""
        from app.modules.second_interview_template.resolvers import get_second_interview_template_variables
        return get_second_interview_template_variables(info)

    # ============================================
    # AI Interview Email Template Queries
    # ============================================
    
    @strawberry.field
    def ai_interview_email_templates(
        self, 
        info: Info, 
        language: Optional[str] = None,
        active_only: bool = False
    ) -> AIInterviewEmailTemplateListResponse:
        """Get all AI interview email templates for the company"""
        from app.modules.ai_interview_template.resolvers import ai_interview_email_templates as get_templates
        return get_templates(info, language, active_only)

    # ============================================
    # Likert Test Template Queries
    # ============================================
    
    @strawberry.field
    def likert_templates(self, info: Info) -> List[LikertTemplateGQLType]:
        """Get all Likert test templates for the company"""
        from app.modules.likert_template.resolvers import get_likert_templates
        return get_likert_templates(info)

    @strawberry.field
    def likert_template(self, info: Info, id: str) -> Optional[LikertTemplateGQLType]:
        """Get a single Likert test template by ID"""
        from app.modules.likert_template.resolvers import get_likert_template
        return get_likert_template(info, id)

    @strawberry.field
    def likert_template_variables(self, info: Info) -> LikertTemplateVariablesResponse:
        """Get available template variables for Likert test templates"""
        from app.modules.likert_template.resolvers import get_likert_template_variables
        return get_likert_template_variables(info)

    # ============================================
    # Company Address Queries
    # ============================================
    
    @strawberry.field
    def company_addresses(
        self, 
        info: Info, 
        include_inactive: bool = False
    ) -> List[CompanyAddressGQLType]:
        """Get all addresses for the company"""
        from app.modules.company_address.resolvers import get_company_addresses
        return get_company_addresses(info, include_inactive)

    @strawberry.field
    def company_address(self, info: Info, id: str) -> Optional[CompanyAddressGQLType]:
        """Get a single company address by ID"""
        from app.modules.company_address.resolvers import get_company_address
        return get_company_address(info, id)


@strawberry.type
class Subscription:
    """GraphQL Subscription root"""

    @strawberry.subscription
    async def application_updates(self, job_id: str) -> AsyncGenerator[ApplicationType, None]:
        """
        Stream application updates for a specific job.
        Emits an ApplicationType each time a candidate analysis for the job is saved.
        """
        from app.models.application import Application
        from app.models.job import Job
        from app.models.candidate import Candidate
        from app.models.department import Department

        topic = f"job:{job_id}:applications"

        async for event in pubsub.subscribe(topic):
            app_id = (event or {}).get("application_id")
            if not app_id:
                continue

            db = get_db_session()
            try:
                # Load fresh application and nested relations
                app = db.query(Application).filter(Application.id == app_id).first()
                if not app:
                    continue

                job = db.query(Job).filter(Job.id == app.job_id).first()
                job_type = None
                if job:
                    dept = db.query(Department).filter(Department.id == job.department_id).first()
                    dept_type_for_job = None
                    if dept:
                        dept_type_for_job = DepartmentType(
                            id=dept.id,
                            name=dept.name,
                            is_active=dept.is_active,
                            color=dept.color,
                            created_at=dept.created_at.isoformat(),
                            updated_at=dept.updated_at.isoformat() if dept.updated_at else None
                        )
                    job_type = JobType(
                        id=job.id,
                        title=job.title,
                        department_id=job.department_id,
                        intro_text=job.intro_text,
                        outro_text=job.outro_text,
                        description=job.description,
                        requirements=job.requirements,
                        description_plain=job.description_plain,
                        requirements_plain=job.requirements_plain,
                        keywords=job.keywords or [],
                        location=job.location,
                        remote_policy=job.remote_policy,
                        employment_type=job.employment_type,
                        experience_level=job.experience_level,
                        required_education=job.required_education,
                        preferred_majors=job.preferred_majors,
                        required_languages=job.required_languages or {},
                        salary_min=job.salary_min,
                        salary_max=job.salary_max,
                        salary_currency=job.salary_currency,
                        deadline=job.deadline.isoformat() if job.deadline else None,
                        start_date=job.start_date,
                        status=job.status,
                        is_active=job.is_active,
                        created_at=job.created_at.isoformat(),
                        updated_at=job.updated_at.isoformat() if job.updated_at else None,
                        department=dept_type_for_job,
                    )

                candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
                candidate_type = None
                if candidate:
                    dept = db.query(Department).filter(Department.id == candidate.department_id).first()
                    dept_type = None
                    if dept:
                        dept_type = DepartmentType(
                            id=dept.id,
                            name=dept.name,
                            is_active=dept.is_active,
                            color=dept.color,
                            created_at=dept.created_at.isoformat(),
                            updated_at=dept.updated_at.isoformat() if dept.updated_at else None
                        )
                    candidate_type = CandidateType(
                        id=candidate.id,
                        name=candidate.name,
                        email=candidate.email,
                        phone=candidate.phone,
                        location=candidate.location,
                        birth_year=candidate.birth_year,
                        experience_months=candidate.experience_months,
                        cv_file_name=candidate.cv_file_name,
                        cv_file_path=candidate.cv_file_path,
                        cv_file_size=candidate.cv_file_size,
                        cv_text=candidate.cv_text,
                        cv_language=candidate.cv_language,
                        cv_photo_path=candidate.cv_photo_path,
                        status=candidate.status.value,
                        department_id=candidate.department_id,
                        uploaded_at=candidate.uploaded_at.isoformat(),
                        updated_at=candidate.updated_at.isoformat() if candidate.updated_at else None,
                        department=dept_type
                    )

                yield ApplicationType(
                    id=app.id,
                    job_id=app.job_id,
                    candidate_id=app.candidate_id,
                    analysis_data=app.analysis_data,
                    overall_score=app.overall_score,
                    status=app.status.value,
                    analyzed_at=app.analyzed_at.isoformat() if app.analyzed_at else None,
                    reviewed_at=app.reviewed_at.isoformat() if app.reviewed_at else None,
                    reviewed_by=app.reviewed_by,
                    notes=app.notes,
                    created_at=app.created_at.isoformat(),
                    updated_at=app.updated_at.isoformat() if app.updated_at else None,
                    rejection_note=app.rejection_note,
                    rejected_at=app.rejected_at.isoformat() if app.rejected_at else None,
                    rejection_template_id=app.rejection_template_id,
                    job=job_type,
                    candidate=candidate_type,
                )
            finally:
                db.close()

    @strawberry.subscription
    async def stats_updates(self) -> AsyncGenerator[StatsType, None]:
        """
        Stream global stats snapshots for dashboard cards.
        Emits a StatsType each time any relevant mutation publishes a 'stats' event.
        """
        topic = "stats"

        async for _ in pubsub.subscribe(topic):
            db = get_db_session()
            try:
                from app.models.candidate import Candidate
                from app.models.job import Job
                from app.models.application import Application
                from app.models.department import Department

                cand_count = db.query(Candidate).count()
                job_count = db.query(Job).count()
                app_count = db.query(Application).count()
                # Keep department count active-only (same as Query.stats)
                dep_count = db.query(Department).filter(Department.is_active == True).count()
                yield StatsType(
                    candidate_count=cand_count,
                    job_count=job_count,
                    application_count=app_count,
                    department_count=dep_count,
                )
            finally:
                db.close()


@strawberry.type
class Mutation(CompanyMutation):
    """GraphQL Mutation root"""

    @strawberry.mutation
    async def register(self, input: RegisterInput) -> TokenType:
        """Register a new user"""
        from app.schemas.user import UserRegister
        db = get_db_session()
        try:
            # Create UserRegister schema object
            user_data = UserRegister(
                email=input.email,
                password=input.password,
                full_name=input.full_name,
            )
            
            # register is async; pass the Pydantic object as defined
            result = await AuthService.register(db=db, user_data=user_data)
            
            return TokenType(
                access_token=result["access_token"],
                refresh_token=result["refresh_token"],
                token_type=result["token_type"],
            )
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    async def login(self, input: LoginInput) -> TokenType:
        """Login user with company_code"""
        from app.schemas.user import UserLogin
        db = get_db_session()
        try:
            # Create UserLogin schema object
            login_data = UserLogin(
                email=input.email,
                password=input.password,
            )
            
            # AuthService.login now accepts company_code parameter
            result = AuthService.login(
                db=db, 
                credentials=login_data,
                company_code=input.company_code
            )
            
            return TokenType(
                access_token=result["access_token"],
                refresh_token=result["refresh_token"],
                token_type=result["token_type"],
            )
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    async def forgot_password(self, input: ForgotPasswordInput) -> MessageType:
        """Send password reset email"""
        db = get_db_session()
        try:
            await AuthService.forgot_password(db=db, email=input.email)
            return MessageType(
                message="Password reset email sent",
                success=True,
            )
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def verify_reset_token(self, input: VerifyResetTokenInput) -> MessageType:
        """Verify password reset token"""
        db = get_db_session()
        try:
            AuthService.verify_reset_token(
                db=db,
                email=input.email,
                token=input.token,
            )
            return MessageType(
                message="Token is valid",
                success=True,
            )
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def reset_password(self, input: ResetPasswordInput) -> MessageType:
        """Reset password with token"""
        db = get_db_session()
        try:
            AuthService.reset_password(
                db=db,
                email=input.email,
                token=input.token,
                new_password=input.new_password,
            )
            return MessageType(
                message="Password reset successful",
                success=True,
            )
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def change_password(self, input: ChangePasswordInput, info: Info) -> MessageType:
        """Change password for authenticated user"""
        # Get authorization header
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        
        if not auth_header:
            raise Exception("Not authenticated")
        
        # Extract token
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")
        
        # Get user and change password
        db = get_db_session()
        try:
            user = get_current_user_from_token(token, db)
            AuthService.change_password(
                db=db,
                user_id=user.id,
                old_password=input.old_password,
                new_password=input.new_password,
            )
            return MessageType(
                message="Password changed successfully",
                success=True,
            )
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def create_user(self, input: CreateUserInput, info: Info) -> UserType:
        """Create a new user (admin action)"""
        # Auth required (reuse token parsing)
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            # Ensure caller is a valid user and is admin
            current = get_current_user_from_token(token, db)
            role_name = None
            if current.role_id:
                r = db.query(Role).filter(Role.id == current.role_id).first()
                role_name = r.name if r else None
            if role_name != 'admin':
                raise Exception("Bu işlem için yetkiniz yok")

            # Get company_id from token for multi-tenancy
            company_id = get_company_id_from_token(token)

            created = AuthService.admin_create_user(
                db=db,
                email=input.email,
                password=input.password,
                full_name=input.full_name,
                role=input.role or 'user',
                company_id=company_id
            )
            # Resolve created role
            created_role = None
            if created.role_id:
                rr = db.query(Role).filter(Role.id == created.role_id).first()
                created_role = rr.name if rr else None

            return UserType(
                id=created.id,
                email=created.email,
                full_name=created.full_name,
                is_active=created.is_active,
                is_verified=created.is_verified,
                role=created_role,
                created_at=created.created_at,
                updated_at=created.updated_at,
            )
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def deactivate_user(self, user_id: int, info: Info) -> MessageType:
        """Soft delete: set is_active = false (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            target = db.query(User).filter(User.id == user_id).first()
            if not target:
                raise Exception("Kullanıcı bulunamadı")
            target.is_active = False
            db.commit()
            return MessageType(message="Kullanıcı pasif hale getirildi", success=True)
        finally:
            db.close()

    @strawberry.mutation
    def create_department(self, input: DepartmentInput, info: Info) -> DepartmentType:
        """Create a new department (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            
            # Extract company_id from token
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")
            
            from app.schemas.department import DepartmentCreate
            dept_data = DepartmentCreate(name=input.name, is_active=input.is_active, color=input.color)
            created = DepartmentService.create(db, dept_data, company_id=company_id)
            result = DepartmentType(
                id=created.id,
                name=created.name,
                is_active=created.is_active,
                color=created.color,
                created_at=created.created_at,
                updated_at=created.updated_at,
            )
            # Publish stats update (department count may change if active)
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "department_created"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "department_created"}))
            except Exception:
                pass
            return result
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def update_department(self, id: str, input: DepartmentUpdateInput, info: Info) -> DepartmentType:
        """Update a department (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            from app.schemas.department import DepartmentUpdate
            dept_data = DepartmentUpdate(name=input.name, is_active=input.is_active, color=input.color)
            updated = DepartmentService.update(db, id, dept_data)
            result = DepartmentType(
                id=updated.id,
                name=updated.name,
                is_active=updated.is_active,
                color=updated.color,
                created_at=updated.created_at,
                updated_at=updated.updated_at,
            )
            # Active flag may have changed; publish stats
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "department_updated"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "department_updated"}))
            except Exception:
                pass
            return result
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def toggle_department_active(self, id: str, info: Info) -> DepartmentType:
        """Toggle department active status (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            toggled = DepartmentService.toggle_active(db, id)
            result = DepartmentType(
                id=toggled.id,
                name=toggled.name,
                is_active=toggled.is_active,
                color=toggled.color,
                created_at=toggled.created_at,
                updated_at=toggled.updated_at,
            )
            # Active-only department count changed
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "department_toggled"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "department_toggled"}))
            except Exception:
                pass
            return result
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def delete_department(self, id: str, info: Info) -> bool:
        """Delete department permanently (admin only) - only if no related records exist"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            company_id = current.company_id if hasattr(current, 'company_id') else None
            DepartmentService.delete(db, id, company_id)
            # Department count changed
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "department_deleted"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "department_deleted"}))
            except Exception:
                pass
            return True
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def create_job(self, input: JobInput, info: Info) -> JobType:
        """Create a new job (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            
            # Extract company_id from token
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")
            
            from app.schemas.job import JobCreate
            from datetime import date
            
            # Convert ISO date string to date object
            deadline_date = None
            if input.deadline:
                try:
                    deadline_date = date.fromisoformat(input.deadline)
                except:
                    pass
            
            try:
                job_data = JobCreate(
                    title=input.title,
                    department_id=input.department_id,
                    intro_text=input.intro_text,
                    outro_text=input.outro_text,
                    description=input.description,
                    description_plain=input.description_plain,
                    requirements=input.requirements,
                    requirements_plain=input.requirements_plain,
                    keywords=input.keywords or [],
                    location=input.location,
                    remote_policy=input.remote_policy,
                    employment_type=input.employment_type,
                    experience_level=input.experience_level,
                    required_education=input.required_education,
                    preferred_majors=input.preferred_majors,
                    required_languages=input.required_languages or {},
                    salary_min=input.salary_min,
                    salary_max=input.salary_max,
                    salary_currency=input.salary_currency,
                    deadline=deadline_date,
                    start_date=input.start_date,
                    status=input.status,
                    is_active=input.is_active,
                    is_disabled_friendly=input.is_disabled_friendly,
                )
            except ValueError as ve:
                # Pydantic validation errors - translate to Turkish
                error_msg = str(ve)
                if "salary_max must be greater than or equal to salary_min" in error_msg:
                    raise Exception("Minimum maaş, maksimum maaştan büyük olamaz")
                raise Exception(f"Geçersiz veri: {error_msg}")
            
            created = JobService.create(db, job_data, company_id=company_id)
            
            result = JobType(
                id=created.id,
                title=created.title,
                department_id=created.department_id,
                intro_text=created.intro_text,
                outro_text=created.outro_text,
                description=created.description,
                description_plain=created.description_plain,
                requirements=created.requirements,
                requirements_plain=created.requirements_plain,
                keywords=created.keywords or [],
                location=created.location,
                remote_policy=created.remote_policy,
                employment_type=created.employment_type,
                experience_level=created.experience_level,
                required_education=created.required_education,
                preferred_majors=created.preferred_majors,
                required_languages=created.required_languages or {},
                salary_min=created.salary_min,
                salary_max=created.salary_max,
                salary_currency=created.salary_currency,
                deadline=created.deadline.isoformat() if created.deadline else None,
                start_date=created.start_date,
                status=created.status,
                is_active=created.is_active,
                is_disabled_friendly=created.is_disabled_friendly,
                created_at=created.created_at.isoformat(),
                updated_at=created.updated_at.isoformat(),
            )
            # Publish stats update (job count)
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "job_created"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "job_created"}))
            except Exception:
                pass
            return result
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def update_job(self, id: str, input: JobUpdateInput, info: Info) -> JobType:
        """Update a job (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            
            from app.schemas.job import JobUpdate
            from datetime import date
            
            # Convert ISO date string to date object
            deadline_date = None
            if input.deadline:
                try:
                    deadline_date = date.fromisoformat(input.deadline)
                except:
                    pass
            
            try:
                # Build update dict with only provided fields
                update_dict = {}
                if input.title is not None:
                    update_dict['title'] = input.title
                if input.department_id is not None:
                    update_dict['department_id'] = input.department_id
                if input.intro_text is not None:
                    update_dict['intro_text'] = input.intro_text if input.intro_text else None
                if input.outro_text is not None:
                    update_dict['outro_text'] = input.outro_text if input.outro_text else None
                if input.description is not None:
                    update_dict['description'] = input.description
                if input.description_plain is not None:
                    update_dict['description_plain'] = input.description_plain
                if input.requirements is not None:
                    update_dict['requirements'] = input.requirements
                if input.requirements_plain is not None:
                    update_dict['requirements_plain'] = input.requirements_plain
                if input.keywords is not None:
                    update_dict['keywords'] = input.keywords
                if input.location is not None:
                    update_dict['location'] = input.location
                if input.remote_policy is not None:
                    update_dict['remote_policy'] = input.remote_policy
                if input.employment_type is not None:
                    update_dict['employment_type'] = input.employment_type
                if input.experience_level is not None:
                    update_dict['experience_level'] = input.experience_level
                if input.required_education is not None:
                    update_dict['required_education'] = input.required_education
                if input.preferred_majors is not None:
                    update_dict['preferred_majors'] = input.preferred_majors
                if input.required_languages is not None:
                    update_dict['required_languages'] = input.required_languages
                if input.salary_min is not None:
                    update_dict['salary_min'] = input.salary_min
                if input.salary_max is not None:
                    update_dict['salary_max'] = input.salary_max
                if input.salary_currency is not None:
                    update_dict['salary_currency'] = input.salary_currency
                if deadline_date is not None:
                    update_dict['deadline'] = deadline_date
                if input.start_date is not None:
                    update_dict['start_date'] = input.start_date
                if input.status is not None:
                    update_dict['status'] = input.status
                if input.is_active is not None:
                    update_dict['is_active'] = input.is_active
                if input.is_disabled_friendly is not None:
                    update_dict['is_disabled_friendly'] = input.is_disabled_friendly
                
                # Interview settings
                if input.interview_enabled is not None:
                    update_dict['interview_enabled'] = input.interview_enabled
                if input.interview_template_id is not None:
                    update_dict['interview_template_id'] = input.interview_template_id if input.interview_template_id else None
                if input.interview_deadline_hours is not None:
                    update_dict['interview_deadline_hours'] = input.interview_deadline_hours
                if input.agreement_template_id is not None:
                    update_dict['agreement_template_id'] = input.agreement_template_id if input.agreement_template_id else None
                
                # Likert settings
                if input.likert_enabled is not None:
                    update_dict['likert_enabled'] = input.likert_enabled
                if input.likert_template_id is not None:
                    update_dict['likert_template_id'] = input.likert_template_id if input.likert_template_id else None
                if input.likert_deadline_hours is not None:
                    update_dict['likert_deadline_hours'] = input.likert_deadline_hours
                
                job_data = JobUpdate(**update_dict)
            except ValueError as ve:
                # Pydantic validation errors - translate to Turkish
                error_msg = str(ve)
                if "salary_max must be greater than or equal to salary_min" in error_msg:
                    raise Exception("Minimum maaş, maksimum maaştan büyük olamaz")
                raise Exception(f"Geçersiz veri: {error_msg}")
            
            updated = JobService.update(db, id, job_data)
            
            result = JobType(
                id=updated.id,
                title=updated.title,
                department_id=updated.department_id,
                intro_text=updated.intro_text,
                outro_text=updated.outro_text,
                description=updated.description,
                description_plain=updated.description_plain,
                requirements=updated.requirements,
                requirements_plain=updated.requirements_plain,
                keywords=updated.keywords or [],
                location=updated.location,
                remote_policy=updated.remote_policy,
                employment_type=updated.employment_type,
                experience_level=updated.experience_level,
                required_education=updated.required_education,
                preferred_majors=updated.preferred_majors,
                required_languages=updated.required_languages or {},
                salary_min=updated.salary_min,
                salary_max=updated.salary_max,
                salary_currency=updated.salary_currency,
                deadline=updated.deadline.isoformat() if updated.deadline else None,
                start_date=updated.start_date,
                status=updated.status,
                is_active=updated.is_active,
                is_disabled_friendly=updated.is_disabled_friendly or False,
                # Interview settings
                interview_enabled=updated.interview_enabled or False,
                interview_template_id=updated.interview_template_id,
                interview_deadline_hours=updated.interview_deadline_hours or 72,
                agreement_template_id=updated.agreement_template_id,
                # Likert settings
                likert_enabled=updated.likert_enabled or False,
                likert_template_id=updated.likert_template_id,
                likert_deadline_hours=updated.likert_deadline_hours or 72,
                created_at=updated.created_at.isoformat(),
                updated_at=updated.updated_at.isoformat(),
            )
            # Job visibility/active may affect counts in some views; publish for safety
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "job_updated"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "job_updated"}))
            except Exception:
                pass
            return result
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def toggle_job_active(self, id: str, info: Info) -> JobType:
        """Toggle job active status (admin only)"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            toggled = JobService.toggle_active(db, id)
            result = JobType(
                id=toggled.id,
                title=toggled.title,
                department_id=toggled.department_id,
                description=toggled.description,
                requirements=toggled.requirements,
                keywords=toggled.keywords or [],
                location=toggled.location,
                remote_policy=toggled.remote_policy,
                employment_type=toggled.employment_type,
                experience_level=toggled.experience_level,
                required_education=toggled.required_education,
                preferred_majors=toggled.preferred_majors,
                required_languages=toggled.required_languages or {},
                salary_min=toggled.salary_min,
                salary_max=toggled.salary_max,
                salary_currency=toggled.salary_currency,
                deadline=toggled.deadline.isoformat() if toggled.deadline else None,
                start_date=toggled.start_date,
                status=toggled.status,
                is_active=toggled.is_active,
                color=toggled.color,
                created_at=toggled.created_at.isoformat(),
                updated_at=toggled.updated_at.isoformat(),
            )
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "job_toggled"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "job_toggled"}))
            except Exception:
                pass
            return result
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()

    @strawberry.mutation
    def delete_job(self, id: str, info: Info) -> MessageType:
        """Delete a job (admin only) - only if no applications exist"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            
            # Find the job
            from app.models.job import Job
            from app.models.application import Application
            
            job = db.query(Job).filter(Job.id == id).first()
            if not job:
                return MessageType(success=False, message="İlan bulunamadı")
            
            # Check if job has applications
            application_count = db.query(Application).filter(Application.job_id == id).count()
            if application_count > 0:
                return MessageType(success=False, message="Bu ilanda başvuru var")
            
            # Delete the job
            db.delete(job)
            db.commit()
            
            # Publish stats update
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "job_deleted"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "job_deleted"}))
            except Exception:
                pass
            
            return MessageType(success=True, message="İlan başarıyla silindi")
        except Exception as e:
            db.rollback()
            return MessageType(success=False, message=str(e))
        finally:
            db.close()

    @strawberry.mutation
    def delete_candidate(self, id: str, info: Info) -> MessageType:
        """Delete a candidate/CV (admin only) - cascades to all related records"""
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            
            from app.models.candidate import Candidate
            import os
            
            # Find the candidate
            candidate = db.query(Candidate).filter(
                Candidate.id == id,
                Candidate.company_id == company_id
            ).first()
            
            if not candidate:
                return MessageType(success=False, message="CV bulunamadı")
            
            # Store file path before deletion to remove the physical file
            cv_file_path = candidate.cv_file_path
            cv_photo_path = candidate.cv_photo_path
            
            # Delete the candidate (CASCADE will handle related records)
            db.delete(candidate)
            db.commit()
            
            # Try to delete physical files if they exist
            try:
                if cv_file_path and os.path.exists(cv_file_path):
                    os.remove(cv_file_path)
                if cv_photo_path and os.path.exists(cv_photo_path):
                    os.remove(cv_photo_path)
            except Exception:
                pass  # Ignore file deletion errors
            
            # Publish stats update
            try:
                import asyncio as _asyncio
                try:
                    loop = _asyncio.get_running_loop()
                    loop.create_task(pubsub.publish(topic="stats", payload={"reason": "candidate_deleted"}))
                except RuntimeError:
                    _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "candidate_deleted"}))
            except Exception:
                pass
            
            return MessageType(success=True, message="CV başarıyla silindi")
        except Exception as e:
            db.rollback()
            return MessageType(success=False, message=str(e))
        finally:
            db.close()

    @strawberry.mutation
    async def upload_cvs(
        self, 
        files: List[Upload], 
        department_id: str,
        info: Info
    ) -> CVUploadResponse:
        """
        Upload multiple CV files (admin only)
        Supports PDF and DOCX formats
        Files will be associated with the specified department
        """
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        if not auth_header:
            raise Exception("Not authenticated")
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise Exception("Invalid authentication scheme")
        except ValueError:
            raise Exception("Invalid authorization header")

        db = get_db_session()
        try:
            current = get_current_user_from_token(token, db)
            ensure_admin(current, db)
            
            # Get company_id from current user
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")
            
            # Verify department exists
            from app.models import Department, Candidate
            department = db.query(Department).filter(Department.id == department_id).first()
            if not department:
                raise Exception(f"Department with ID {department_id} not found")
            
            successful = []
            failed = []
            
            # Generate batch number for this upload session
            import random
            batch_number = f"#{random.randint(100000, 999999)}"
            print(f"🔍 Generated batch_number for upload session: {batch_number}")
            
            for file in files:
                try:
                    # Read file content
                    file_content = await file.read()
                    file_size = FileUploadService.get_file_size(file_content)
                    
                    # Validate file
                    is_valid, error_msg = FileUploadService.validate_file(file.filename, file_size)
                    if not is_valid:
                        failed.append(FailedFileType(
                            file_name=file.filename,
                            reason=error_msg
                        ))
                        continue
                    
                    # Save file
                    file_path, unique_filename = await FileUploadService.save_file(
                        file_content, 
                        file.filename
                    )
                    
                    # Parse CV with AI-Service
                    parsed_data = None
                    cv_language = None
                    try:
                        parsed_data = await ai_service_client.parse_cv_file(
                            file_content=file_content,
                            filename=file.filename
                        )
                        
                        # Check if this is a valid CV
                        is_valid_cv = parsed_data.get('is_valid_cv', {})
                        if isinstance(is_valid_cv, dict) and is_valid_cv.get('valid') == False:
                            reason = is_valid_cv.get('reason', 'not_a_cv')
                            confidence = is_valid_cv.get('confidence', 0)
                            error_msg = f"Yüklenen dosya geçerli bir CV değil. Sebep: {reason}"
                            if reason == 'not_a_cv':
                                error_msg = "Yüklenen dosya CV/özgeçmiş formatında değil."
                            elif reason == 'empty_content':
                                error_msg = "Dosya boş veya okunamıyor."
                            elif reason == 'insufficient_info':
                                error_msg = "Dosyada yeterli kişisel/profesyonel bilgi bulunamadı."
                            
                            failed.append(FailedFileType(
                                file_name=file.filename,
                                reason=error_msg
                            ))
                            # Delete the uploaded file since it's not a valid CV
                            import os
                            if os.path.exists(file_path):
                                os.remove(file_path)
                            continue
                        
                        # Extract CV language
                        cv_language = parsed_data.get('language')

                        # Extract personal info from parsed data
                        personal = parsed_data.get('personal', {})
                        name = personal.get('name')
                        email = personal.get('email')
                        phone = personal.get('phone')
                        candidate_location = personal.get('location') or personal.get('address')
                        linkedin = personal.get('linkedin')
                        github = personal.get('github')

                        # Extract full CV text from metadata (for birth year regex)
                        metadata = parsed_data.get('_metadata', {})
                        cv_text = metadata.get('extracted_text', '')

                        # Derive birth year and experience (months) if available
                        birth_year = None
                        exp_months = None
                        try:
                            # Birth year: try explicit birth_year, else parse from DOB strings or CV text
                            from datetime import datetime as _dt
                            current_year = _dt.utcnow().year
                            by = personal.get('birth_year') or personal.get('birthYear')
                            if isinstance(by, int) and 1900 <= by <= current_year:
                                birth_year = by  # store birth year as-is
                            else:
                                # Try common DOB string fields
                                dob_candidates = [
                                    personal.get('dob'), personal.get('date_of_birth'), personal.get('birth_date'),
                                    personal.get('birthdate'), personal.get('dogum_tarihi'), personal.get('Doğum Tarihi')
                                ]
                                import re as _re
                                year_found = None
                                for val in dob_candidates:
                                    if isinstance(val, str):
                                        m = _re.search(r"(19\d{2}|20\d{2})", val)
                                        if m:
                                            y = int(m.group(1))
                                            if 1900 <= y <= current_year:
                                                year_found = y
                                                break
                                if year_found is None and isinstance(cv_text, str):
                                    m = _re.search(r"Doğum\s*Tarihi[^\n\r]*(19\d{2}|20\d{2})", cv_text, _re.IGNORECASE)
                                    if not m:
                                        m = _re.search(r"(19\d{2}|20\d{2})", cv_text)
                                    if m:
                                        y = int(m.group(1))
                                        if 1900 <= y <= current_year:
                                            year_found = y
                                if year_found is not None:
                                    birth_year = year_found
                            # Experience: sum durations from parsed.experience
                            exps = parsed_data.get('experience') or []
                            if isinstance(exps, list) and exps:
                                total = 0
                                for e in exps:
                                    start = e.get('start_date') or e.get('start') or e.get('from')
                                    end = e.get('end_date') or e.get('end') or e.get('to')
                                    # naive year-month parse (YYYY or YYYY-MM)
                                    def _ym(s):
                                        if not s or not isinstance(s, (str, int)):
                                            return None
                                        s = str(s)
                                        try:
                                            parts = s.split('-')
                                            y = int(parts[0])
                                            m = int(parts[1]) if len(parts) > 1 else 1
                                            return y, m
                                        except Exception:
                                            return None
                                    sm = _ym(start)
                                    em = _ym(end) if end and str(end).lower() not in ('present','now','günümüz','current') else None
                                    from datetime import datetime as _d
                                    if sm:
                                        sy, smm = sm
                                        if em:
                                            ey, emm = em
                                            total += (ey - sy) * 12 + (emm - smm)
                                        else:
                                            now = _d.utcnow()
                                            total += (now.year - sy) * 12 + (now.month - smm)
                                exp_months = max(0, int(total))
                        except Exception:
                            pass

                        # cv_text already extracted above
                        
                    except Exception as parse_error:
                        # Log parsing error but continue with upload
                        print(f"⚠️  CV parsing failed for {file.filename}: {str(parse_error)}")
                        name = None
                        email = None
                        phone = None
                        cv_text = None
                        cv_language = None
                        candidate_location = None
                        linkedin = None
                        github = None
                    
                    # Create candidate record in database
                    # Final sanity for birth_year bounds
                    try:
                        from datetime import datetime as _dt2
                        _cy = _dt2.utcnow().year
                        if birth_year is not None and not (1900 <= int(birth_year) <= _cy - 10):
                            birth_year = None
                    except Exception:
                        birth_year = None

                    candidate = Candidate(
                        name=name,
                        email=email,
                        phone=phone,
                        linkedin=linkedin,
                        github=github,
                        cv_file_name=file.filename,
                        cv_file_path=file_path,
                        cv_file_size=file_size,
                        cv_text=cv_text,
                        parsed_data=parsed_data,
                        cv_language=cv_language,
                        location=candidate_location,
                        birth_year=birth_year,
                        experience_months=exp_months,
                        department_id=department_id,
                        company_id=company_id,
                        batch_number=batch_number,
                        status="new"
                    )
                    db.add(candidate)
                    db.commit()
                    db.refresh(candidate)

                    # Per-file success counted; session usage will be recorded after loop
                    
                    successful.append(UploadedFileType(
                        file_name=file.filename,
                        file_path=file_path,
                        file_size=file_size,
                        candidate_name=name,
                        candidate_email=email,
                        candidate_phone=phone,
                        candidate_linkedin=linkedin,
                        candidate_github=github
                    ))
                    
                except Exception as e:
                    db.rollback()
                    failed.append(FailedFileType(
                        file_name=file.filename,
                        reason=str(e)
                    ))
            
            # Record a single session usage with total successful uploads
            try:
                total_success = len(successful)
                print(f"🔍 DEBUG: total_success={total_success}, successful files count={len(successful)}")
                if total_success > 0 and hasattr(current, 'company_id') and current.company_id:
                    from app.services.usage_service import UsageService
                    from app.models.subscription import ResourceType
                    print(f"🔍 DEBUG: Calling create_session_usage with count={total_success}, batch={batch_number}")
                    # Usage recorded as CV_UPLOAD with batch_number, no metadata
                    result = await UsageService.create_session_usage(
                        db, current.company_id, ResourceType.CV_UPLOAD, 
                        count=total_success, metadata={}, batch_number=batch_number
                    )
                    print(f"✅ Recorded CV upload session {batch_number}: {total_success} files, result={result}")
            except Exception as _ue2:
                print(f"❌ Usage session record (cv_upload) failed: {_ue2}")
                import traceback
                traceback.print_exc()

            return CVUploadResponse(
                successful=successful,
                failed=failed,
                total_uploaded=len(successful),
                total_failed=len(failed)
            )
            
        except Exception as e:
            raise Exception(str(e))
        finally:
            # Publish a stats event if any CV was uploaded successfully
            try:
                if 'successful' in locals() and len(successful) > 0:
                    import asyncio as _asyncio
                    # Fire-and-forget publish; ignore if event loop not running
                    try:
                        loop = _asyncio.get_running_loop()
                        loop.create_task(pubsub.publish(topic="stats", payload={"reason": "cv_upload"}))
                    except RuntimeError:
                        # No running loop; best-effort synchronous publish
                        try:
                            _asyncio.run(pubsub.publish(topic="stats", payload={"reason": "cv_upload"}))
                        except Exception:
                            pass
            except Exception:
                pass
            db.close()
    
    @strawberry.mutation
    async def analyze_job_candidates(
        self,
        info: Info,
        input: AnalyzeJobCandidatesInput,
        language: Optional[str] = None
    ) -> MessageType:
        """
        Analyze candidates against a job using AI.
        Sequential processing (one candidate at a time).
        """
        import httpx
        from datetime import datetime
        from app.models.job import Job
        from app.models.candidate import Candidate
        from app.models.application import Application, ApplicationStatus
        from app.core.config import settings
        
        # Get authorization header
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        
        if not auth_header:
            raise Exception("Not authenticated")
        
        # Extract token
        try:
            scheme, token = auth_header.split()
        except ValueError:
            raise Exception("Invalid authorization header")
        
        db = get_db_session()
        try:
            # Verify user is authenticated (admin check removed for now - can be added later)
            current = get_current_user_from_token(token, db)
            # Note: Removed admin check to allow all authenticated users to analyze
            # If you want admin-only: uncomment next line
            # ensure_admin(db, current)
            
            # Get company_id from current user
            from app.api.dependencies import get_company_id_from_token
            company_id = get_company_id_from_token(token)
            if not company_id:
                raise Exception("Company context required")
            
            # Get job (with company filter)
            job = db.query(Job).filter(
                Job.id == input.job_id,
                Job.company_id == company_id
            ).first()
            if not job:
                raise Exception(f"Job not found: {input.job_id}")
            
            # Prepare job data for AI
            job_data = {
                "title": job.title,
                "department": job.department.name if job.department else "N/A",
                "description": job.description,
                "description_plain": job.description_plain,
                "requirements": job.requirements,
                "requirements_plain": job.requirements_plain,
                "keywords": job.keywords if isinstance(job.keywords, list) else (job.keywords if job.keywords else []),
                "location": job.location,
                "employment_type": job.employment_type,
                "experience_level": job.experience_level,
                "required_education": job.required_education,
                "preferred_majors": job.preferred_majors if isinstance(job.preferred_majors, list) else ([job.preferred_majors] if job.preferred_majors else []),
                "required_languages": job.required_languages if isinstance(job.required_languages, dict) else {}
            }
            
            success_count = 0
            error_count = 0

            # Generate batch number for this analysis session
            import random
            batch_number = f"#{random.randint(100000, 999999)}"
            print(f"🔍 Generated batch_number for analysis session: {batch_number}")

            # Quick health check for AI-Service to fail fast with a clear message
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    hc = await client.get(f"{settings.AI_SERVICE_URL}/")
                if hc.status_code != 200:
                    return MessageType(success=False, message="AI-Service unreachable (health check failed)")
            except Exception:
                return MessageType(success=False, message="AI-Service not running at AI_SERVICE_URL; please start AI-Service on port 8001")
            
            # Process each candidate sequentially
            for candidate_id in input.candidate_ids:
                try:
                    # Get candidate (with company filter)
                    candidate = db.query(Candidate).filter(
                        Candidate.id == candidate_id,
                        Candidate.company_id == company_id
                    ).first()
                    if not candidate:
                        print(f"Candidate not found: {candidate_id}")
                        error_count += 1
                        continue
                    
                    # Check if already analyzed
                    existing = db.query(Application).filter(
                        Application.job_id == input.job_id,
                        Application.candidate_id == candidate_id,
                        Application.company_id == company_id
                    ).first()
                    
                    if existing:
                        # Treat already-analyzed candidates as success so the UI can show results
                        print(f"Application already exists for candidate {candidate_id}")
                        success_count += 1
                        # Optional: publish existing result to nudge subscribers
                        try:
                            await pubsub.publish(
                                topic=f"job:{input.job_id}:applications",
                                payload={"application_id": existing.id}
                            )
                        except Exception:
                            pass
                        continue
                    
                    # Prepare candidate data for AI
                    candidate_data = {
                        "name": candidate.name,
                        "email": candidate.email,
                        "phone": candidate.phone,
                        "cv_language": candidate.cv_language,
                        "parsed_data": candidate.parsed_data or {},
                        "location": candidate.location
                    }
                    
                    # Call AI service
                    ai_service_url = f"{settings.AI_SERVICE_URL}/match-cv-to-job"
                    
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        response = await client.post(
                            ai_service_url,
                            json={
                                "job_data": job_data,
                                "candidate_data": candidate_data,
                                "language": language or "turkish"
                            }
                        )
                    
                    if response.status_code != 200:
                        raise Exception(f"AI service error: {response.text}")
                    
                    result = response.json()
                    
                    if not result.get("success"):
                        raise Exception(result.get("error", "Unknown error"))
                    
                    analysis_data = result.get("data")
                    
                    # Save to database
                    application = Application(
                        job_id=input.job_id,
                        candidate_id=candidate_id,
                        company_id=company_id,
                        analysis_data=analysis_data,
                        overall_score=analysis_data.get("overall_score"),
                        batch_number=batch_number,
                        status=ApplicationStatus.ANALYZED,
                        analyzed_at=datetime.utcnow()
                    )
                    
                    db.add(application)
                    db.commit()
                    db.refresh(application)
                    
                    # Add history entries
                    try:
                        from app.modules.history.resolvers import create_history_entry
                        # CV Uploaded entry
                        create_history_entry(
                            db=db,
                            company_id=str(company_id),
                            application_id=str(application.id),
                            candidate_id=str(candidate_id),
                            job_id=str(input.job_id),
                            action_code="cv_uploaded",
                            performed_by=current.id if current else None,
                            action_data={"batch_number": batch_number},
                        )
                        # CV Analyzed entry
                        create_history_entry(
                            db=db,
                            company_id=str(company_id),
                            application_id=str(application.id),
                            candidate_id=str(candidate_id),
                            job_id=str(input.job_id),
                            action_code="cv_analyzed",
                            performed_by=current.id if current else None,
                            action_data={"score": analysis_data.get("overall_score"), "batch_number": batch_number},
                        )
                    except Exception as hist_err:
                        print(f"⚠️ History entry creation failed: {hist_err}")

                    # Publish subscription event for this job
                    await pubsub.publish(
                        topic=f"job:{input.job_id}:applications",
                        payload={"application_id": application.id}
                    )
                    # Also publish a stats update (application count changed)
                    try:
                        await pubsub.publish(topic="stats", payload={"reason": "application_created"})
                    except Exception:
                        pass
                    
                    success_count += 1
                    print(f"Successfully analyzed candidate {candidate_id}: Score {analysis_data.get('overall_score')}")
                    
                except Exception as e:
                    print(f"Error analyzing candidate {candidate_id}: {str(e)}")
                    db.rollback()
                    error_count += 1
                    continue
            
            # Report success only if at least one analysis succeeded
            # Record a single AI_ANALYSIS usage session with the number of analyzed candidates
            try:
                if success_count > 0 and hasattr(current, 'company_id') and current.company_id:
                    from app.services.usage_service import UsageService
                    from app.models.subscription import ResourceType
                    await UsageService.create_session_usage(
                        db,
                        current.company_id,
                        ResourceType.AI_ANALYSIS,
                        count=success_count,
                        metadata={},
                        batch_number=batch_number
                    )
                    print(f"✅ Recorded AI analysis session {batch_number}: {success_count} candidates")
            except Exception as _ue:
                print(f"❌ Usage session record failed: {_ue}")

            overall_success = success_count > 0
            return MessageType(
                success=overall_success,
                message=f"Analysis complete. Success: {success_count}, Failed: {error_count}"
            )
            
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()
    
    @strawberry.mutation
    async def generate_job_with_ai(
        self,
        info: Info,
        input: GenerateJobWithAIInput
    ) -> GenerateJobResultType:
        """
        Generate a job description using AI.
        Does NOT save to database - returns generated data for preview/edit.
        """
        import httpx
        import json
        from app.core.config import settings
        
        # Get authorization header
        request = info.context["request"]
        auth_header = request.headers.get("authorization")
        
        if not auth_header:
            raise Exception("Not authenticated")
        
        # Extract token
        try:
            scheme, token = auth_header.split()
        except ValueError:
            raise Exception("Invalid authorization header")
        
        db = get_db_session()
        try:
            # Verify user is authenticated
            current = get_current_user_from_token(token, db)
            if not current:
                raise Exception("User not found")
            
            # Prepare payload for AI Service
            payload = {
                "position": input.position,
                "department": input.department,
                "location": input.location,
                "employment_type": input.employment_type,
                "experience_level": input.experience_level,
                "required_skills": input.required_skills or [],
                "required_languages": [
                    {"name": lang.name, "level": lang.level}
                    for lang in (input.required_languages or [])
                ],
                "additional_notes": input.additional_notes,
                "language": input.language or "turkish"
            }
            
            # Call AI Service
            ai_service_url = f"{settings.AI_SERVICE_URL}/generate-job-description"
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    ai_service_url,
                    json=payload
                )
            
            if response.status_code != 200:
                raise Exception(f"AI service error: {response.text}")
            
            result = response.json()
            
            if not result.get("success"):
                raise Exception(result.get("error", "Unknown error from AI service"))
            
            # Return job data as JSON string (for frontend to parse)
            job_data = result.get("data")
            
            return GenerateJobResultType(
                success=True,
                job_data=json.dumps(job_data),  # Convert dict to JSON string
                message="Job description generated successfully"
            )
            
        except Exception as e:
            return GenerateJobResultType(
                success=False,
                job_data=None,
                message=f"Failed to generate job description: {str(e)}"
            )
        finally:
            db.close()


    # ============ Interview Template Mutations ============
    @strawberry.mutation
    async def create_interview_template(self, info: Info, input: InterviewTemplateInput) -> InterviewTemplateResponse:
        """Create a new interview template"""
        from app.modules.interview.resolvers import create_interview_template
        return await create_interview_template(info, input)

    @strawberry.mutation
    async def update_interview_template(self, info: Info, id: str, input: InterviewTemplateInput) -> InterviewTemplateResponse:
        """Update an interview template"""
        from app.modules.interview.resolvers import update_interview_template
        return await update_interview_template(info, id, input)

    @strawberry.mutation
    async def delete_interview_template(self, info: Info, id: str) -> MessageType:
        """Delete an interview template"""
        from app.modules.interview.resolvers import delete_interview_template
        return await delete_interview_template(info, id)

    @strawberry.mutation
    async def toggle_interview_template(self, info: Info, id: str) -> InterviewTemplateResponse:
        """Toggle interview template active status"""
        from app.modules.interview.resolvers import toggle_interview_template
        return await toggle_interview_template(info, id)

    # ============ Agreement Template Mutations ============
    @strawberry.mutation
    async def create_agreement_template(self, info: Info, input: AgreementTemplateInput) -> AgreementTemplateResponse:
        """Create a new agreement template"""
        from app.modules.agreement.resolvers import create_agreement_template
        return await create_agreement_template(info, input)

    @strawberry.mutation
    async def update_agreement_template(self, info: Info, id: str, input: AgreementTemplateInput) -> AgreementTemplateResponse:
        """Update an agreement template"""
        from app.modules.agreement.resolvers import update_agreement_template
        return await update_agreement_template(info, id, input)

    @strawberry.mutation
    async def delete_agreement_template(self, info: Info, id: str) -> MessageType:
        """Delete an agreement template"""
        from app.modules.agreement.resolvers import delete_agreement_template
        return await delete_agreement_template(info, id)

    @strawberry.mutation
    async def toggle_agreement_template(self, info: Info, id: str) -> AgreementTemplateResponse:
        """Toggle agreement template active status"""
        from app.modules.agreement.resolvers import toggle_agreement_template
        return await toggle_agreement_template(info, id)

    # ============ Likert Template Mutations ============
    @strawberry.mutation
    async def create_likert_template(self, info: Info, input: LikertTemplateInput) -> LikertTemplateResponse:
        """Create a new likert template"""
        from app.modules.likert.resolvers import create_likert_template
        return await create_likert_template(info, input)

    @strawberry.mutation
    async def update_likert_template(self, info: Info, id: str, input: LikertTemplateInput) -> LikertTemplateResponse:
        """Update a likert template"""
        from app.modules.likert.resolvers import update_likert_template
        return await update_likert_template(info, id, input)

    @strawberry.mutation
    async def delete_likert_template(self, info: Info, id: str) -> MessageType:
        """Delete a likert template"""
        from app.modules.likert.resolvers import delete_likert_template
        return await delete_likert_template(info, id)

    @strawberry.mutation
    async def toggle_likert_template(self, info: Info, id: str) -> LikertTemplateResponse:
        """Toggle likert template active status"""
        from app.modules.likert.resolvers import toggle_likert_template
        return await toggle_likert_template(info, id)

    # ============ Rejection Template Mutations ============
    @strawberry.mutation
    async def create_rejection_template(self, info: Info, input: "RejectionTemplateInput") -> "RejectionTemplateResponse":
        """Create a new rejection email template"""
        from app.modules.rejection.resolvers import create_rejection_template
        return await create_rejection_template(info, input)

    @strawberry.mutation
    async def update_rejection_template(self, info: Info, id: str, input: "RejectionTemplateInput") -> "RejectionTemplateResponse":
        """Update a rejection email template"""
        from app.modules.rejection.resolvers import update_rejection_template
        return await update_rejection_template(info, id, input)

    @strawberry.mutation
    async def delete_rejection_template(self, info: Info, id: str) -> MessageType:
        """Delete a rejection template"""
        from app.modules.rejection.resolvers import delete_rejection_template
        return await delete_rejection_template(info, id)

    # ============ Job Intro Template Mutations ============
    @strawberry.mutation
    async def create_job_intro_template(self, info: Info, input: JobIntroTemplateInput) -> JobIntroTemplateResponse:
        """Create a new job intro template"""
        from app.modules.job_intro.resolvers import create_job_intro_template
        return await create_job_intro_template(info, input)

    @strawberry.mutation
    async def update_job_intro_template(self, info: Info, id: str, input: JobIntroTemplateInput) -> JobIntroTemplateResponse:
        """Update a job intro template"""
        from app.modules.job_intro.resolvers import update_job_intro_template
        return await update_job_intro_template(info, id, input)

    @strawberry.mutation
    async def delete_job_intro_template(self, info: Info, id: str) -> MessageType:
        """Delete a job intro template"""
        from app.modules.job_intro.resolvers import delete_job_intro_template
        return await delete_job_intro_template(info, id)

    @strawberry.mutation
    async def toggle_job_intro_template(self, info: Info, id: str) -> JobIntroTemplateResponse:
        """Toggle job intro template active status"""
        from app.modules.job_intro.resolvers import toggle_job_intro_template
        return await toggle_job_intro_template(info, id)

    # ============ Job Outro Template Mutations ============
    @strawberry.mutation
    async def create_job_outro_template(self, info: Info, input: "JobOutroTemplateInput") -> "JobOutroTemplateResponse":
        """Create a new job outro template"""
        from app.modules.job_outro.resolvers import create_job_outro_template
        return await create_job_outro_template(info, input)

    @strawberry.mutation
    async def update_job_outro_template(self, info: Info, id: str, input: "JobOutroTemplateInput") -> "JobOutroTemplateResponse":
        """Update a job outro template"""
        from app.modules.job_outro.resolvers import update_job_outro_template
        return await update_job_outro_template(info, id, input)

    @strawberry.mutation
    async def delete_job_outro_template(self, info: Info, id: str) -> MessageType:
        """Delete a job outro template"""
        from app.modules.job_outro.resolvers import delete_job_outro_template
        return await delete_job_outro_template(info, id)

    @strawberry.mutation
    async def toggle_job_outro_template(self, info: Info, id: str) -> "JobOutroTemplateResponse":
        """Toggle job outro template active status"""
        from app.modules.job_outro.resolvers import toggle_job_outro_template
        return await toggle_job_outro_template(info, id)

    # ============ Application Rejection Mutations ============
    @strawberry.mutation
    async def reject_application(
        self, 
        info: Info, 
        application_id: str, 
        rejection_note: Optional[str] = None,
        template_id: Optional[str] = None
    ) -> MessageType:
        """Reject an application and mark it with a rejection note"""
        from app.modules.rejection.resolvers import reject_application
        return await reject_application(info, application_id, rejection_note, template_id)

    # ============ History Mutations ============
    @strawberry.mutation
    async def add_history_entry(self, info: Info, input: "CreateHistoryEntryInput") -> "HistoryResponse":
        """Add a new history entry for an application"""
        from app.modules.history.resolvers import add_history_entry
        return await add_history_entry(info, input)

    @strawberry.mutation
    async def seed_action_types(self, info: Info) -> "HistoryResponse":
        """Seed default action types (admin only)"""
        from app.modules.history.resolvers import seed_action_types_mutation
        return await seed_action_types_mutation(info)

    # ============ Likert Session Mutations ============
    @strawberry.mutation
    async def create_likert_session(self, info: Info, input: CreateLikertSessionInput) -> LikertSessionResponse:
        """Create a new likert test session for a candidate"""
        from app.modules.likert.resolvers import create_likert_session
        return await create_likert_session(info, input)

    @strawberry.mutation
    async def start_likert_session(self, token: str) -> "GenericResponse":
        """Start a likert session (mark as in_progress)"""
        from app.modules.likert.resolvers import start_likert_session
        return await start_likert_session(token)

    @strawberry.mutation
    async def save_likert_answer(self, session_token: str, question_id: str, score: int) -> "GenericResponse":
        """Save a likert answer"""
        from app.modules.likert.resolvers import save_likert_answer
        return await save_likert_answer(session_token, question_id, score)

    @strawberry.mutation
    async def complete_likert_session(self, token: str) -> "GenericResponse":
        """Complete a likert session"""
        from app.modules.likert.resolvers import complete_likert_session
        return await complete_likert_session(token)

    @strawberry.mutation
    async def create_interview_session(self, info: Info, input: CreateInterviewSessionInput) -> InterviewSessionResponse:
        """Create a new interview session for a candidate"""
        from app.modules.interview.resolvers import create_interview_session
        return await create_interview_session(info, input)

    @strawberry.mutation
    async def start_interview_session(self, info: Info, token: str) -> InterviewSessionResponse:
        """Start an interview session (called when candidate begins)"""
        from app.modules.interview.resolvers import start_interview_session
        return await start_interview_session(info, token)

    @strawberry.mutation
    async def save_interview_answer(self, info: Info, input: SaveInterviewAnswerInput) -> InterviewAnswerResponse:
        """Save an interview answer"""
        from app.modules.interview.resolvers import save_interview_answer
        return await save_interview_answer(info, input)

    @strawberry.mutation
    async def complete_interview_session(self, info: Info, token: str) -> InterviewSessionResponse:
        """Complete an interview session"""
        from app.modules.interview.resolvers import complete_interview_session
        return await complete_interview_session(info, token)

    @strawberry.mutation
    async def accept_interview_agreement(self, info: Info, token: str) -> InterviewSessionResponse:
        """Accept interview agreement"""
        from app.modules.interview.resolvers import accept_interview_agreement
        return await accept_interview_agreement(info, token)

    @strawberry.mutation
    async def analyze_interview_with_ai(self, info: Info, session_id: str) -> "AIAnalysisResponse":
        """Trigger AI analysis for a completed interview session"""
        from app.modules.interview.resolvers import analyze_interview_with_ai
        return await analyze_interview_with_ai(info, session_id)

    @strawberry.mutation
    async def update_browser_stt_support(self, info: Info, token: str, supported: bool) -> InterviewSessionResponse:
        """Update browser STT support status for a session"""
        from app.modules.interview.resolvers import update_browser_stt_support
        return await update_browser_stt_support(info, token, supported)

    @strawberry.mutation
    async def submit_likert_session(self, info: Info, token: str, answers: List[LikertAnswerInput]) -> LikertSessionResponse:
        """Submit likert test answers"""
        from app.modules.likert.models import LikertSession, LikertAnswer
        
        db = get_db_session()
        try:
            session = db.query(LikertSession).filter(LikertSession.token == token).first()
            if not session:
                return LikertSessionResponse(success=False, message="Session not found", likert_link=None, session=None)
            
            if session.status == 'completed':
                return LikertSessionResponse(success=False, message="Session already completed", likert_link=None, session=None)
            
            # Save all answers
            total_score = 0
            for ans in answers:
                answer = LikertAnswer(
                    session_id=session.id,
                    question_id=ans.question_id,
                    score=ans.value,
                    company_id=session.company_id,
                )
                db.add(answer)
                total_score += ans.value
            
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.total_score = total_score
            db.commit()
            db.refresh(session)
            
            return LikertSessionResponse(
                success=True,
                message="Likert test completed successfully",
                likert_link=None,
                session=LikertSessionType(
                    id=str(session.id),
                    token=session.token,
                    status=session.status,
                    expires_at=session.expires_at.isoformat() if session.expires_at else None,
                    created_at=session.created_at.isoformat() if session.created_at else None,
                )
            )
        except Exception as e:
            db.rollback()
            return LikertSessionResponse(success=False, message=str(e), likert_link=None, session=None)
        finally:
            db.close()

    # ============ Talent Pool Mutations ============
    @strawberry.mutation
    async def create_talent_pool_tag(self, info: Info, input: TalentPoolTagInput) -> TalentPoolTagResponse:
        """Create a new talent pool tag"""
        from app.modules.talent_pool.resolvers import create_talent_pool_tag
        return await create_talent_pool_tag(info, input)

    @strawberry.mutation
    async def update_talent_pool_tag(self, info: Info, id: str, input: TalentPoolTagUpdateInput) -> TalentPoolTagResponse:
        """Update a talent pool tag"""
        from app.modules.talent_pool.resolvers import update_talent_pool_tag
        return await update_talent_pool_tag(info, id, input)

    @strawberry.mutation
    async def delete_talent_pool_tag(self, info: Info, id: str) -> MessageType:
        """Delete a talent pool tag"""
        from app.modules.talent_pool.resolvers import delete_talent_pool_tag
        return await delete_talent_pool_tag(info, id)

    @strawberry.mutation
    async def add_to_talent_pool(self, info: Info, input: TalentPoolEntryInput) -> TalentPoolEntryResponse:
        """Add a candidate to the talent pool"""
        from app.modules.talent_pool.resolvers import add_to_talent_pool
        return await add_to_talent_pool(info, input)

    @strawberry.mutation
    async def bulk_add_to_talent_pool(self, info: Info, input: TalentPoolBulkAddInput) -> TalentPoolBulkResponse:
        """Bulk add candidates to the talent pool"""
        from app.modules.talent_pool.resolvers import bulk_add_to_talent_pool
        return await bulk_add_to_talent_pool(info, input)

    @strawberry.mutation
    async def update_talent_pool_entry(self, info: Info, id: str, input: TalentPoolEntryUpdateInput) -> TalentPoolEntryResponse:
        """Update a talent pool entry"""
        from app.modules.talent_pool.resolvers import update_talent_pool_entry
        return await update_talent_pool_entry(info, id, input)

    @strawberry.mutation
    async def archive_talent_pool_entry(self, info: Info, id: str) -> TalentPoolEntryResponse:
        """Archive a talent pool entry"""
        from app.modules.talent_pool.resolvers import archive_talent_pool_entry
        return await archive_talent_pool_entry(info, id)

    @strawberry.mutation
    async def restore_talent_pool_entry(self, info: Info, id: str) -> TalentPoolEntryResponse:
        """Restore an archived talent pool entry"""
        from app.modules.talent_pool.resolvers import restore_talent_pool_entry
        return await restore_talent_pool_entry(info, id)

    @strawberry.mutation
    async def remove_from_talent_pool(self, info: Info, id: str) -> MessageType:
        """Permanently remove a candidate from the talent pool"""
        from app.modules.talent_pool.resolvers import remove_from_talent_pool
        return await remove_from_talent_pool(info, id)

    @strawberry.mutation
    async def assign_to_job_from_pool(self, info: Info, input: TalentPoolAssignToJobInput) -> TalentPoolEntryResponse:
        """Assign a candidate from talent pool to a job"""
        from app.modules.talent_pool.resolvers import assign_to_job_from_pool
        return await assign_to_job_from_pool(info, input)

    # ============ Second Interview Mutations ============
    @strawberry.mutation
    async def send_second_interview_invite(
        self, 
        info: Info, 
        input: SecondInterviewInviteInput
    ) -> SecondInterviewResponse:
        """Send second interview invitation to a candidate"""
        from app.modules.second_interview.resolvers import send_second_interview_invite
        return await send_second_interview_invite(info, input)

    @strawberry.mutation
    async def submit_second_interview_feedback(
        self, 
        info: Info, 
        input: SecondInterviewFeedbackInput
    ) -> SecondInterviewResponse:
        """Submit feedback for a completed second interview"""
        from app.modules.second_interview.resolvers import submit_second_interview_feedback
        return await submit_second_interview_feedback(info, input)

    @strawberry.mutation
    async def cancel_second_interview(
        self, 
        info: Info, 
        id: str
    ) -> SecondInterviewResponse:
        """Cancel a second interview"""
        from app.modules.second_interview.resolvers import cancel_second_interview
        return await cancel_second_interview(info, id)

    # ============================================
    # Second Interview Template Mutations
    # ============================================

    @strawberry.mutation
    async def create_second_interview_template(
        self, 
        info: Info, 
        input: SecondInterviewTemplateInputType
    ) -> SecondInterviewTemplateResponse:
        """Create a new second interview email template"""
        from app.modules.second_interview_template.resolvers import create_second_interview_template
        return await create_second_interview_template(info, input)

    @strawberry.mutation
    async def update_second_interview_template(
        self, 
        info: Info, 
        id: str,
        input: SecondInterviewTemplateUpdateInput
    ) -> SecondInterviewTemplateResponse:
        """Update a second interview email template"""
        from app.modules.second_interview_template.resolvers import update_second_interview_template
        return await update_second_interview_template(info, id, input)

    @strawberry.mutation
    async def delete_second_interview_template(
        self, 
        info: Info, 
        id: str
    ) -> MessageType:
        """Delete a second interview email template"""
        from app.modules.second_interview_template.resolvers import delete_second_interview_template
        return await delete_second_interview_template(info, id)

    # ============================================
    # AI Interview Email Template Mutations
    # ============================================

    @strawberry.mutation
    def create_ai_interview_email_template(
        self, 
        info: Info, 
        input: AIInterviewEmailTemplateInput
    ) -> AIInterviewEmailTemplateResponse:
        """Create a new AI interview email template"""
        from app.modules.ai_interview_template.resolvers import create_ai_interview_email_template
        return create_ai_interview_email_template(info, input)

    @strawberry.mutation
    def update_ai_interview_email_template(
        self, 
        info: Info, 
        id: str,
        input: AIInterviewEmailTemplateUpdateInput
    ) -> AIInterviewEmailTemplateResponse:
        """Update an AI interview email template"""
        from app.modules.ai_interview_template.resolvers import update_ai_interview_email_template
        return update_ai_interview_email_template(info, id, input)

    @strawberry.mutation
    def delete_ai_interview_email_template(
        self, 
        info: Info, 
        id: str
    ) -> AIInterviewEmailTemplateResponse:
        """Delete an AI interview email template"""
        from app.modules.ai_interview_template.resolvers import delete_ai_interview_email_template
        return delete_ai_interview_email_template(info, id)

    # ============================================
    # Likert Test Template Mutations
    # ============================================

    @strawberry.mutation
    async def create_likert_template(
        self, 
        info: Info, 
        input: LikertTemplateInput
    ) -> LikertTemplateResponse:
        """Create a new Likert test email template"""
        from app.modules.likert_template.resolvers import create_likert_template
        return await create_likert_template(info, input)

    @strawberry.mutation
    async def update_likert_template(
        self, 
        info: Info, 
        id: str,
        input: LikertTemplateUpdateInput
    ) -> LikertTemplateResponse:
        """Update a Likert test email template"""
        from app.modules.likert_template.resolvers import update_likert_template
        return await update_likert_template(info, id, input)

    @strawberry.mutation
    async def delete_likert_template(
        self, 
        info: Info, 
        id: str
    ) -> MessageType:
        """Delete a Likert test template"""
        from app.modules.likert_template.resolvers import delete_likert_template
        return await delete_likert_template(info, id)

    # ============================================
    # Company Address Mutations
    # ============================================

    @strawberry.mutation
    async def create_company_address(
        self, 
        info: Info, 
        input: CompanyAddressInput
    ) -> CompanyAddressResponse:
        """Create a new company address"""
        from app.modules.company_address.resolvers import create_company_address
        return await create_company_address(info, input)

    @strawberry.mutation
    async def update_company_address(
        self, 
        info: Info, 
        input: CompanyAddressUpdateInput
    ) -> CompanyAddressResponse:
        """Update an existing company address"""
        from app.modules.company_address.resolvers import update_company_address
        return await update_company_address(info, input)

    @strawberry.mutation
    async def delete_company_address(
        self, 
        info: Info, 
        id: str
    ) -> CompanyAddressResponse:
        """Delete a company address"""
        from app.modules.company_address.resolvers import delete_company_address
        return await delete_company_address(info, id)


# Create schema
schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
