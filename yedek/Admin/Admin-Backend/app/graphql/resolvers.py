import strawberry
from strawberry.types import Info
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models import AdminUser as AdminUserModel, Company as CompanyModel, CompanySubscription as CompanySubscriptionModel, SubscriptionPlan as SubscriptionPlanModel
from app.models.user import User as UserModel
from app.graphql.types import AdminUser, LoginResponse, Company, CompanySubscriptionInfo, CompanyListResponse, SubscriptionPlan, PlanWithSubscriberCount, PlanSubscriber
from app.config import ADMIN_JWT_SECRET, ADMIN_JWT_ALGORITHM, ADMIN_JWT_EXPIRE_MINUTES
import math
import random
import string
from datetime import date as date_type
from dateutil.relativedelta import relativedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ADMIN_JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, ADMIN_JWT_SECRET, algorithm=ADMIN_JWT_ALGORITHM)

@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "Admin GraphQL API"
    
    @strawberry.field
    def subscription_plans(self, info: Info) -> list[SubscriptionPlan]:
        db: Session = info.context["db"]
        plans_db = db.query(SubscriptionPlanModel).filter(
            SubscriptionPlanModel.is_active == True
        ).order_by(SubscriptionPlanModel.sort_order).all()
        
        # Convert SQLAlchemy models to GraphQL types
        plans = []
        for plan in plans_db:
            plans.append(SubscriptionPlan(
                id=plan.id,
                name=plan.name,
                slug=plan.slug,
                description=plan.description,
                cv_limit=plan.cv_limit,
                job_limit=plan.job_limit,
                user_limit=plan.user_limit,
                monthly_price=float(plan.monthly_price),
                yearly_price=float(plan.yearly_price),
                is_active=plan.is_active,
                sort_order=plan.sort_order
            ))
        return plans

    @strawberry.field
    def subscription_plans_with_count(self, info: Info) -> list[PlanWithSubscriberCount]:
        db: Session = info.context["db"]
        
        # Get all active plans ordered by sort_order
        plans_db = db.query(SubscriptionPlanModel).filter(
            SubscriptionPlanModel.is_active == True
        ).order_by(SubscriptionPlanModel.sort_order).all()
        
        result = []
        for plan in plans_db:
            # Count active subscribers using indexed columns
            subscriber_count = db.query(func.count(CompanySubscriptionModel.id)).filter(
                CompanySubscriptionModel.plan_id == plan.id,
                CompanySubscriptionModel.status.in_(['active', 'trial'])
            ).scalar()
            
            result.append(PlanWithSubscriberCount(
                id=plan.id,
                name=plan.name,
                slug=plan.slug,
                description=plan.description,
                cv_limit=plan.cv_limit,
                job_limit=plan.job_limit,
                user_limit=plan.user_limit,
                monthly_price=float(plan.monthly_price),
                yearly_price=float(plan.yearly_price),
                is_active=plan.is_active,
                sort_order=plan.sort_order,
                subscriber_count=subscriber_count or 0
            ))
        
        return result

    @strawberry.field
    def plan_subscribers(self, info: Info, plan_id: str) -> list[PlanSubscriber]:
        db: Session = info.context["db"]
        
        # Get plan details
        plan = db.query(SubscriptionPlanModel).filter(
            SubscriptionPlanModel.id == plan_id
        ).first()
        
        if not plan:
            raise Exception("Plan not found")
        
        # Query subscriptions with JOIN to companies (uses indexes: plan_id, status, company_id)
        subscriptions = db.query(
            CompanySubscriptionModel, CompanyModel
        ).join(
            CompanyModel,
            CompanySubscriptionModel.company_id == CompanyModel.id
        ).filter(
            CompanySubscriptionModel.plan_id == plan_id,
            CompanySubscriptionModel.status.in_(['active', 'trial']),
            CompanyModel.is_active == True
        ).all()
        
        result = []
        for subscription, company in subscriptions:
            # Calculate usage from usage_tracking table
            # Get current month's usage
            from sqlalchemy import text as sql_text
            
            # CV usage
            cv_usage = db.execute(
                sql_text("""
                    SELECT COALESCE(SUM(count), 0) as total
                    FROM usage_tracking
                    WHERE company_id = :company_id
                    AND resource_type = 'cv_upload'
                    AND period_start >= DATE_TRUNC('month', CURRENT_DATE)
                """),
                {"company_id": str(company.id)}
            ).fetchone()[0]
            
            # Job posting usage
            job_usage = db.execute(
                sql_text("""
                    SELECT COALESCE(SUM(count), 0) as total
                    FROM usage_tracking
                    WHERE company_id = :company_id
                    AND resource_type = 'job_post'
                    AND period_start >= DATE_TRUNC('month', CURRENT_DATE)
                """),
                {"company_id": str(company.id)}
            ).fetchone()[0]
            
            # User account count
            user_count = db.query(func.count(UserModel.id)).filter(
                UserModel.company_id == company.id,
                UserModel.is_active == True
            ).scalar()
            
            # Calculate remaining quotas
            remaining_cv = (plan.cv_limit or 0) - int(cv_usage or 0)
            remaining_job = (plan.job_limit or 0) - int(job_usage or 0)
            remaining_user = (plan.user_limit or 0) - int(user_count or 0)
            
            result.append(PlanSubscriber(
                company_id=company.id,
                company_name=company.name,
                company_code=company.company_code,
                subscription_status=subscription.status,
                start_date=subscription.start_date,
                end_date=subscription.end_date,
                remaining_cv_quota=max(0, remaining_cv),
                remaining_job_quota=max(0, remaining_job),
                remaining_user_quota=max(0, remaining_user)
            ))
        
        return result
    
    @strawberry.field
    def companies(
        self, 
        info: Info,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        plan_id: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> CompanyListResponse:
        db: Session = info.context["db"]
        
        # Base query with indexes (company_code, name, is_active)
        query = db.query(CompanyModel)
        
        # Filter by active status (uses is_active index)
        if is_active is not None:
            query = query.filter(CompanyModel.is_active == is_active)
        
        # Search by name or company_code (uses name and company_code indexes)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    CompanyModel.name.ilike(search_term),
                    CompanyModel.company_code.ilike(search_term)
                )
            )
        
        # Filter by subscription plan
        if plan_id:
            query = query.join(
                CompanySubscriptionModel,
                CompanyModel.id == CompanySubscriptionModel.company_id
            ).filter(
                CompanySubscriptionModel.plan_id == plan_id,
                CompanySubscriptionModel.status.in_(['active', 'trial'])
            )
        
        # Count total
        total = query.count()
        total_pages = math.ceil(total / page_size)
        
        # Pagination
        offset = (page - 1) * page_size
        companies_db = query.order_by(CompanyModel.created_at.desc()).offset(offset).limit(page_size).all()
        
        # Build response with subscription info
        companies_list = []
        for company_db in companies_db:
            # Get active subscription (uses company_id and status indexes)
            subscription_db = db.query(CompanySubscriptionModel).filter(
                CompanySubscriptionModel.company_id == company_db.id,
                CompanySubscriptionModel.status.in_(['active', 'trial'])
            ).first()
            
            subscription_info = None
            if subscription_db:
                plan = db.query(SubscriptionPlanModel).filter(
                    SubscriptionPlanModel.id == subscription_db.plan_id
                ).first()
                
                if plan:
                    subscription_info = CompanySubscriptionInfo(
                        plan_name=plan.name,
                        status=subscription_db.status,
                        start_date=subscription_db.start_date,
                        end_date=subscription_db.end_date
                    )
            
            companies_list.append(Company(
                id=company_db.id,
                company_code=company_db.company_code,
                name=company_db.name,
                email=company_db.email,
                phone=company_db.phone,
                is_active=company_db.is_active,
                created_at=company_db.created_at,
                subscription=subscription_info
            ))
        
        return CompanyListResponse(
            companies=companies_list,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

@strawberry.type
class Mutation:
    @strawberry.mutation
    def admin_login(self, username: str, password: str, info: Info) -> LoginResponse:
        db: Session = info.context["db"]
        
        # Find admin user
        admin_user = db.query(AdminUserModel).filter(
            AdminUserModel.username == username,
            AdminUserModel.is_active == True
        ).first()
        
        if not admin_user or not verify_password(password, admin_user.password_hash):
            raise Exception("Invalid credentials")
        
        # Create JWT token
        token_data = {
            "sub": str(admin_user.id),
            "username": admin_user.username,
            "type": "admin"
        }
        token = create_access_token(token_data)
        
        # Return response
        return LoginResponse(
            token=token,
            admin_user=AdminUser(
                id=admin_user.id,
                username=admin_user.username,
                full_name=admin_user.full_name,
                is_active=admin_user.is_active,
                created_at=admin_user.created_at
            )
        )

    @strawberry.mutation
    def create_subscription_plan(
        self,
        info: Info,
        name: str,
        slug: str,
        description: Optional[str],
        cv_limit: int,
        job_limit: int,
        user_limit: int,
        monthly_price: float,
        yearly_price: float,
        sort_order: int = 0
    ) -> SubscriptionPlan:
        db: Session = info.context["db"]
        
        # Check if slug already exists
        existing = db.query(SubscriptionPlanModel).filter(
            SubscriptionPlanModel.slug == slug
        ).first()
        if existing:
            raise Exception("Bu slug zaten kullanılıyor")
        
        # Create plan
        new_plan = SubscriptionPlanModel(
            name=name,
            slug=slug,
            description=description,
            cv_limit=cv_limit,
            job_limit=job_limit,
            user_limit=user_limit,
            monthly_price=monthly_price,
            yearly_price=yearly_price,
            is_active=True,
            sort_order=sort_order
        )
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        
        return SubscriptionPlan(
            id=new_plan.id,
            name=new_plan.name,
            slug=new_plan.slug,
            description=new_plan.description,
            cv_limit=new_plan.cv_limit,
            job_limit=new_plan.job_limit,
            user_limit=new_plan.user_limit,
            monthly_price=float(new_plan.monthly_price),
            yearly_price=float(new_plan.yearly_price),
            is_active=new_plan.is_active,
            sort_order=new_plan.sort_order
        )

    @strawberry.mutation
    def create_company(
        self,
        info: Info,
        name: str,
        email: str,
        phone: Optional[str],
        address: Optional[str],
        plan_id: str
    ) -> Company:
        db: Session = info.context["db"]
        
        # Generate unique 6-character company code
        while True:
            company_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            existing = db.query(CompanyModel).filter(CompanyModel.company_code == company_code).first()
            if not existing:
                break
        
        # Verify plan exists
        plan = db.query(SubscriptionPlanModel).filter(SubscriptionPlanModel.id == plan_id).first()
        if not plan:
            raise Exception("Üyelik planı bulunamadı")
        
        # Create company
        new_company = CompanyModel(
            company_code=company_code,
            name=name,
            email=email,
            phone=phone,
            address=address,
            is_active=True
        )
        db.add(new_company)
        db.flush()
        
        # Create subscription (starts today, billing day is today's day of month)
        today = date_type.today()
        end_date = today + relativedelta(months=1)
        
        new_subscription = CompanySubscriptionModel(
            company_id=new_company.id,
            plan_id=plan_id,
            status='active',
            start_date=today,
            end_date=end_date,
            auto_renew=True,
            billing_cycle='monthly',
            next_billing_date=end_date
        )
        db.add(new_subscription)
        
        # Create first admin user for the company
        # Get admin role ID
        admin_role_id = "9b907985-97c0-420b-9395-b1beae615b73"
        
        # Hash default password
        default_password_hash = pwd_context.hash("admin123")
        
        first_user = UserModel(
            email="admin@" + name.lower().replace(" ", "") + ".com",
            full_name="Administrator",
            password_hash=default_password_hash,
            is_active=True,
            is_verified=True,
            role_id=admin_role_id,
            company_id=new_company.id
        )
        db.add(first_user)
        
        db.commit()
        db.refresh(new_company)
        
        # Return company with subscription info
        subscription_info = CompanySubscriptionInfo(
            plan_name=plan.name,
            status='active',
            start_date=today,
            end_date=end_date
        )
        
        return Company(
            id=new_company.id,
            company_code=new_company.company_code,
            name=new_company.name,
            email=new_company.email,
            phone=new_company.phone,
            is_active=new_company.is_active,
            created_at=new_company.created_at,
            subscription=subscription_info
        )

schema = strawberry.Schema(query=Query, mutation=Mutation)
