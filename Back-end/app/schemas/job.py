"""
Job Pydantic Schemas
Validation and serialization for Job API
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from datetime import date, datetime


class JobCreate(BaseModel):
    """Schema for creating a job"""
    title: str = Field(..., min_length=3, max_length=200, description="Job title")
    department_id: str = Field(..., description="Department UUID")
    description: str = Field(..., min_length=10, description="Job description (HTML)")
    description_plain: Optional[str] = Field(None, description="Plain text for AI matching")
    requirements: str = Field(..., min_length=10, description="Required qualifications (HTML)")
    requirements_plain: Optional[str] = Field(None, description="Plain text for AI matching")
    keywords: List[str] = Field(default_factory=list, description="Keywords for matching")
    
    location: str = Field(..., min_length=2, max_length=100, description="Job location")
    remote_policy: str = Field(default='office', description="office/hybrid/remote")
    employment_type: str = Field(default='full-time', description="full-time/part-time/contract/internship")
    
    experience_level: str = Field(default='mid', description="junior/mid/senior/lead")
    required_education: Optional[str] = Field(None, description="high_school/associate/bachelor/master/phd")
    preferred_majors: Optional[str] = Field(None, description="Preferred university majors")
    required_languages: Dict[str, str] = Field(default_factory=dict, description="Language requirements")
    
    salary_min: Optional[int] = Field(None, ge=0, description="Minimum salary")
    salary_max: Optional[int] = Field(None, ge=0, description="Maximum salary")
    salary_currency: str = Field(default='TRY', description="Currency code")
    
    deadline: Optional[date] = Field(None, description="Application deadline")
    start_date: Optional[str] = Field(None, description="immediate/1month/3months/flexible")
    status: str = Field(default='draft', description="draft/active/closed/archived")
    is_active: bool = Field(default=True, description="Soft delete flag")

    @field_validator('remote_policy')
    @classmethod
    def validate_remote_policy(cls, v):
        allowed = ['office', 'hybrid', 'remote']
        if v not in allowed:
            raise ValueError(f"remote_policy must be one of {allowed}")
        return v

    @field_validator('employment_type')
    @classmethod
    def validate_employment_type(cls, v):
        allowed = ['full-time', 'part-time', 'contract', 'internship']
        if v not in allowed:
            raise ValueError(f"employment_type must be one of {allowed}")
        return v

    @field_validator('experience_level')
    @classmethod
    def validate_experience_level(cls, v):
        allowed = ['junior', 'mid', 'senior', 'lead']
        if v not in allowed:
            raise ValueError(f"experience_level must be one of {allowed}")
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        allowed = ['draft', 'active', 'closed', 'archived']
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v

    @field_validator('salary_max')
    @classmethod
    def validate_salary_range(cls, v, info):
        if v is not None and 'salary_min' in info.data and info.data['salary_min'] is not None:
            if v < info.data['salary_min']:
                raise ValueError("salary_max must be greater than or equal to salary_min")
        return v


class JobUpdate(BaseModel):
    """Schema for updating a job"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    department_id: Optional[str] = None
    description: Optional[str] = Field(None, min_length=10)
    description_plain: Optional[str] = None
    requirements: Optional[str] = Field(None, min_length=10)
    requirements_plain: Optional[str] = None
    keywords: Optional[List[str]] = None
    
    location: Optional[str] = Field(None, min_length=2, max_length=100)
    remote_policy: Optional[str] = None
    employment_type: Optional[str] = None
    
    experience_level: Optional[str] = None
    required_education: Optional[str] = None
    preferred_majors: Optional[str] = None
    required_languages: Optional[Dict[str, str]] = None
    
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: Optional[str] = None
    
    deadline: Optional[date] = None
    start_date: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('remote_policy')
    @classmethod
    def validate_remote_policy(cls, v):
        if v is not None:
            allowed = ['office', 'hybrid', 'remote']
            if v not in allowed:
                raise ValueError(f"remote_policy must be one of {allowed}")
        return v

    @field_validator('employment_type')
    @classmethod
    def validate_employment_type(cls, v):
        if v is not None:
            allowed = ['full-time', 'part-time', 'contract', 'internship']
            if v not in allowed:
                raise ValueError(f"employment_type must be one of {allowed}")
        return v

    @field_validator('experience_level')
    @classmethod
    def validate_experience_level(cls, v):
        if v is not None:
            allowed = ['junior', 'mid', 'senior', 'lead']
            if v not in allowed:
                raise ValueError(f"experience_level must be one of {allowed}")
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v is not None:
            allowed = ['draft', 'active', 'closed', 'archived']
            if v not in allowed:
                raise ValueError(f"status must be one of {allowed}")
        return v


class JobResponse(BaseModel):
    """Schema for job response"""
    id: str
    title: str
    department_id: str
    description: str
    description_plain: Optional[str]
    requirements: str
    requirements_plain: Optional[str]
    keywords: List[str]
    
    location: str
    remote_policy: str
    employment_type: str
    
    experience_level: str
    required_education: Optional[str]
    preferred_majors: Optional[str]
    required_languages: Dict[str, str]
    
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str
    
    deadline: Optional[date]
    start_date: Optional[str]
    status: str
    is_active: bool
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
