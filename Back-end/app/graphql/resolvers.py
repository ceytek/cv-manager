"""
GraphQL Resolvers
"""
import strawberry
import logging
from typing import Optional, List, AsyncGenerator
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
    StatsType,
    ComparisonResultType,
)
from app.services.auth import AuthService
from app.services.department import DepartmentService
from app.services.job import JobService
from app.services.file_upload import FileUploadService
from app.services.ai_service_client import ai_service_client
from app.core.database import get_db
from app.api.dependencies import get_current_user_from_token
from app.models.user import User
from app.models.role import Role
from app.api.authorization import ensure_admin
from app.graphql.pubsub import pubsub


def get_db_session() -> Session:
    """Get database session for GraphQL (caller is responsible for closing)."""
    return next(get_db())


@strawberry.type
class Query:
    """GraphQL Query root"""

    @strawberry.field
    def me(self, info: strawberry.Info) -> Optional[UserType]:
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

            return UserType(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                role=role_name,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")
        finally:
            db.close()

    @strawberry.field
    def users(self, info: strawberry.Info) -> list[UserType]:
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
            rows = db.query(User).all()
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
    def stats(self, info: strawberry.Info) -> StatsType:
        """Return global counts for dashboard cards"""
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
            # Validate user (no admin requirement; just authenticated)
            _ = get_current_user_from_token(token, db)

            from app.models.candidate import Candidate
            from app.models.job import Job
            from app.models.application import Application
            from app.models.department import Department
            cand_count = db.query(Candidate).count()
            job_count = db.query(Job).count()
            app_count = db.query(Application).count()
            # Only count active departments for dashboard metric
            dep_count = db.query(Department).filter(Department.is_active == True).count()
            return StatsType(
                candidate_count=cand_count,
                job_count=job_count,
                application_count=app_count,
                department_count=dep_count,
            )
        finally:
            db.close()

    @strawberry.field
    def departments(self, info: strawberry.Info, include_inactive: bool = False) -> list[DepartmentType]:
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
            departments = DepartmentService.list_all(db, include_inactive=include_inactive)
            return [
                DepartmentType(
                    id=d.id,
                    name=d.name,
                    is_active=d.is_active,
                    created_at=d.created_at,
                    updated_at=d.updated_at,
                )
                for d in departments
            ]
        finally:
            db.close()

    @strawberry.field
    def jobs(
        self,
        info: strawberry.Info,
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

            jobs = JobService.list_all(
                db,
                include_inactive=include_inactive,
                status=status,
                department_id=department_id,
                search_term=search_term
            )

            # Prefetch application counts per job
            from app.models.application import Application, ApplicationStatus
            from sqlalchemy import func
            counts = (
                db.query(Application.job_id, func.count(Application.id))
                .filter(Application.status != ApplicationStatus.PENDING)
                .group_by(Application.job_id)
                .all()
            )
            count_map = {jid: cnt for jid, cnt in counts}

            # Preload departments map
            from app.models.department import Department
            deps = db.query(Department).all()
            dep_map = {d.id: d for d in deps}

            return [
                JobType(
                    id=j.id,
                    title=j.title,
                    department_id=j.department_id,
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
                    created_at=j.created_at.isoformat(),
                    updated_at=j.updated_at.isoformat(),
                    analysis_count=count_map.get(j.id, 0),
                    department=(
                        DepartmentType(
                            id=dep_map[j.department_id].id,
                            name=dep_map[j.department_id].name,
                            is_active=dep_map[j.department_id].is_active,
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
        info: strawberry.Info,
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

            # Build query
            query = db.query(Candidate)

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
            for c in candidates:
                # Get department name
                dept = db.query(Department).filter(Department.id == c.department_id).first()
                dept_type = None
                if dept:
                    dept_type = DepartmentType(
                        id=dept.id,
                        name=dept.name,
                        is_active=dept.is_active,
                        created_at=dept.created_at.isoformat(),
                        updated_at=dept.updated_at.isoformat() if dept.updated_at else None
                    )

                result.append(CandidateType(
                    id=c.id,
                    name=c.name,
                    email=c.email,
                    phone=c.phone,
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
                    department=dept_type
                ))

            return result

        finally:
            db.close()

    @strawberry.field
    def applications(
        self,
        info: strawberry.Info,
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

            # Build query
            query = db.query(Application)

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
                            created_at=dept.created_at.isoformat(),
                            updated_at=dept.updated_at.isoformat() if dept.updated_at else None
                        )
                    job_type = JobType(
                        id=job.id,
                        title=job.title,
                        department_id=job.department_id,
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
                        parsed_data=candidate.parsed_data,
                        cv_photo_path=candidate.cv_photo_path,
                        status=candidate.status.value,
                        department_id=candidate.department_id,
                        uploaded_at=candidate.uploaded_at.isoformat(),
                        updated_at=candidate.updated_at.isoformat() if candidate.updated_at else None,
                        department=dept_type
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
                    job=job_type,
                    candidate=candidate_type
                ))

            return result

        finally:
            db.close()

    @strawberry.field
    def compare_candidates(
        self,
        info: strawberry.Info,
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
                            created_at=dept.created_at.isoformat(),
                            updated_at=dept.updated_at.isoformat() if dept.updated_at else None
                        )
                    job_type = JobType(
                        id=job.id,
                        title=job.title,
                        department_id=job.department_id,
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
class Mutation:
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
        """Login user"""
        from app.schemas.user import UserLogin
        db = get_db_session()
        try:
            # Create UserLogin schema object
            login_data = UserLogin(
                email=input.email,
                password=input.password,
            )
            
            # AuthService.login is synchronous and expects 'credentials'
            result = AuthService.login(db=db, credentials=login_data)
            
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
    def change_password(self, input: ChangePasswordInput, info: strawberry.Info) -> MessageType:
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
    def create_user(self, input: CreateUserInput, info: strawberry.Info) -> UserType:
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

            created = AuthService.admin_create_user(
                db=db,
                email=input.email,
                password=input.password,
                full_name=input.full_name,
                role=input.role or 'user'
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
    def deactivate_user(self, user_id: int, info: strawberry.Info) -> MessageType:
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
    def create_department(self, input: DepartmentInput, info: strawberry.Info) -> DepartmentType:
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
            from app.schemas.department import DepartmentCreate
            dept_data = DepartmentCreate(name=input.name, is_active=input.is_active)
            created = DepartmentService.create(db, dept_data)
            result = DepartmentType(
                id=created.id,
                name=created.name,
                is_active=created.is_active,
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
    def update_department(self, id: str, input: DepartmentUpdateInput, info: strawberry.Info) -> DepartmentType:
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
            dept_data = DepartmentUpdate(name=input.name, is_active=input.is_active)
            updated = DepartmentService.update(db, id, dept_data)
            result = DepartmentType(
                id=updated.id,
                name=updated.name,
                is_active=updated.is_active,
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
    def toggle_department_active(self, id: str, info: strawberry.Info) -> DepartmentType:
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
    def create_job(self, input: JobInput, info: strawberry.Info) -> JobType:
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
                )
            except ValueError as ve:
                # Pydantic validation errors - translate to Turkish
                error_msg = str(ve)
                if "salary_max must be greater than or equal to salary_min" in error_msg:
                    raise Exception("Minimum maaş, maksimum maaştan büyük olamaz")
                raise Exception(f"Geçersiz veri: {error_msg}")
            
            created = JobService.create(db, job_data)
            
            result = JobType(
                id=created.id,
                title=created.title,
                department_id=created.department_id,
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
    def update_job(self, id: str, input: JobUpdateInput, info: strawberry.Info) -> JobType:
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
    def toggle_job_active(self, id: str, info: strawberry.Info) -> JobType:
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
    async def upload_cvs(
        self, 
        files: List[Upload], 
        department_id: str,
        info: strawberry.Info
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
            
            # Verify department exists
            from app.models import Department, Candidate
            department = db.query(Department).filter(Department.id == department_id).first()
            if not department:
                raise Exception(f"Department with ID {department_id} not found")
            
            successful = []
            failed = []
            
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
                        
                        # Extract CV language
                        cv_language = parsed_data.get('language')

                        # Extract personal info from parsed data
                        personal = parsed_data.get('personal', {})
                        name = personal.get('name')
                        email = personal.get('email')
                        phone = personal.get('phone')
                        candidate_location = personal.get('location') or personal.get('address')

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
                        status="new"
                    )
                    db.add(candidate)
                    db.commit()
                    db.refresh(candidate)
                    
                    successful.append(UploadedFileType(
                        file_name=file.filename,
                        file_path=file_path,
                        file_size=file_size
                    ))
                    
                except Exception as e:
                    db.rollback()
                    failed.append(FailedFileType(
                        file_name=file.filename,
                        reason=str(e)
                    ))
            
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
        info: strawberry.Info,
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
            
            # Get job
            job = db.query(Job).filter(Job.id == input.job_id).first()
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
                    # Get candidate
                    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
                    if not candidate:
                        print(f"Candidate not found: {candidate_id}")
                        error_count += 1
                        continue
                    
                    # Check if already analyzed
                    existing = db.query(Application).filter(
                        Application.job_id == input.job_id,
                        Application.candidate_id == candidate_id
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
                        analysis_data=analysis_data,
                        overall_score=analysis_data.get("overall_score"),
                        status=ApplicationStatus.ANALYZED,
                        analyzed_at=datetime.utcnow()
                    )
                    
                    db.add(application)
                    db.commit()

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
            overall_success = success_count > 0
            return MessageType(
                success=overall_success,
                message=f"Analysis complete. Success: {success_count}, Failed: {error_count}"
            )
            
        except Exception as e:
            raise Exception(str(e))
        finally:
            db.close()


# Create schema
schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
