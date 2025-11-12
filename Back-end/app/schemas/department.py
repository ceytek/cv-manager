from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Request schemas
class DepartmentCreate(BaseModel):
    """Department creation schema"""
    name: str = Field(..., min_length=2, max_length=100)
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    """Department update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None


# Response schemas
class DepartmentResponse(BaseModel):
    id: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
