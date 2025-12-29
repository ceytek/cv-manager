"""
Company Service
Handles company (tenant) management operations
"""
import re
import random
import string
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company import Company
from app.core.database import get_db


class CompanyService:
    """Service for managing companies (tenants)"""
    
    @staticmethod
    def generate_company_code() -> str:
        """
        Generate a unique 6-character company code
        Format: 3 uppercase letters + 3 numbers (e.g., ABC123)
        """
        letters = ''.join(random.choices(string.ascii_uppercase, k=3))
        numbers = ''.join(random.choices(string.digits, k=3))
        return f"{letters}{numbers}"
    
    @staticmethod
    def validate_company_code(code: str) -> bool:
        """
        Validate company code format
        Must be 6 characters: 3 letters + 3 numbers
        """
        pattern = r'^[A-Z]{3}[0-9]{3}$'
        return bool(re.match(pattern, code))
    
    @staticmethod
    async def check_code_availability(db: AsyncSession, code: str) -> bool:
        """Check if company code is available"""
        result = await db.execute(
            select(Company).where(Company.company_code == code)
        )
        return result.scalar_one_or_none() is None
    
    @staticmethod
    async def check_subdomain_availability(db: AsyncSession, subdomain: str) -> bool:
        """Check if subdomain is available"""
        result = await db.execute(
            select(Company).where(Company.subdomain == subdomain)
        )
        return result.scalar_one_or_none() is None
    
    @staticmethod
    async def generate_unique_code(db: AsyncSession) -> str:
        """Generate a unique company code"""
        max_attempts = 100
        for _ in range(max_attempts):
            code = CompanyService.generate_company_code()
            if await CompanyService.check_code_availability(db, code):
                return code
        raise Exception("Failed to generate unique company code after 100 attempts")
    
    @staticmethod
    async def create_company(
        db: AsyncSession,
        name: str,
        subdomain: Optional[str] = None,
        custom_domain: Optional[str] = None,
        theme_colors: Optional[dict] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        company_code: Optional[str] = None
    ) -> Company:
        """
        Create a new company
        
        Args:
            db: Database session
            name: Company name
            subdomain: Subdomain for white-label (e.g., 'acme' -> acme.hrsmart.co)
            custom_domain: Custom domain for white-label
            theme_colors: Theme colors dict (primary, secondary)
            email: Company contact email
            phone: Company contact phone
            company_code: Optional custom company code (must be unique)
        
        Returns:
            Created Company object
        """
        # Generate or validate company code
        if company_code:
            if not CompanyService.validate_company_code(company_code):
                raise ValueError(f"Invalid company code format: {company_code}")
            if not await CompanyService.check_code_availability(db, company_code):
                raise ValueError(f"Company code already exists: {company_code}")
        else:
            company_code = await CompanyService.generate_unique_code(db)
        
        # Check subdomain availability
        if subdomain:
            if not await CompanyService.check_subdomain_availability(db, subdomain):
                raise ValueError(f"Subdomain already exists: {subdomain}")
        
        # Default theme colors
        if theme_colors is None:
            theme_colors = {
                "primary": "#667eea",
                "secondary": "#764ba2"
            }
        
        company = Company(
            company_code=company_code,
            name=name,
            subdomain=subdomain,
            custom_domain=custom_domain,
            theme_colors=theme_colors,
            email=email,
            phone=phone,
            is_active=True
        )
        
        db.add(company)
        await db.commit()
        await db.refresh(company)
        
        return company
    
    @staticmethod
    async def get_company_by_id(db: AsyncSession, company_id: UUID) -> Optional[Company]:
        """Get company by ID"""
        result = await db.execute(
            select(Company).where(Company.id == company_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_company_by_code(db: AsyncSession, code: str) -> Optional[Company]:
        """Get company by company code"""
        result = await db.execute(
            select(Company).where(Company.company_code == code)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_company_by_subdomain(db: AsyncSession, subdomain: str) -> Optional[Company]:
        """Get company by subdomain"""
        result = await db.execute(
            select(Company).where(Company.subdomain == subdomain)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_company_by_domain(db: AsyncSession, domain: str) -> Optional[Company]:
        """Get company by custom domain or subdomain"""
        result = await db.execute(
            select(Company).where(
                or_(
                    Company.custom_domain == domain,
                    Company.subdomain == domain
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_companies(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False
    ) -> List[Company]:
        """List all companies with pagination"""
        query = select(Company)
        
        if active_only:
            query = query.where(Company.is_active == True)
        
        query = query.offset(skip).limit(limit).order_by(Company.created_at.desc())
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update_company(
        db: AsyncSession,
        company_id: UUID,
        **updates
    ) -> Optional[Company]:
        """Update company details"""
        company = await CompanyService.get_company_by_id(db, company_id)
        if not company:
            return None
        
        # Validate subdomain if being updated
        if 'subdomain' in updates and updates['subdomain'] != company.subdomain:
            if not await CompanyService.check_subdomain_availability(db, updates['subdomain']):
                raise ValueError(f"Subdomain already exists: {updates['subdomain']}")
        
        for key, value in updates.items():
            if hasattr(company, key):
                setattr(company, key, value)
        
        await db.commit()
        await db.refresh(company)
        
        return company
    
    @staticmethod
    async def activate_company(db: AsyncSession, company_id: UUID) -> Optional[Company]:
        """Activate a company"""
        return await CompanyService.update_company(db, company_id, is_active=True)
    
    @staticmethod
    async def deactivate_company(db: AsyncSession, company_id: UUID) -> Optional[Company]:
        """Deactivate a company"""
        return await CompanyService.update_company(db, company_id, is_active=False)
    
    @staticmethod
    async def delete_company(db: AsyncSession, company_id: UUID) -> bool:
        """
        Delete a company (cascade deletes all related data)
        WARNING: This is a destructive operation!
        """
        company = await CompanyService.get_company_by_id(db, company_id)
        if not company:
            return False
        
        await db.delete(company)
        await db.commit()
        
        return True
