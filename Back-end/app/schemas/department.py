from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Predefined color palette for departments
DEPARTMENT_COLORS = [
    "#3B82F6",  # Blue
    "#F97316",  # Orange
    "#EAB308",  # Yellow
    "#22C55E",  # Green
    "#8B5CF6",  # Purple
    "#EC4899",  # Pink
    "#14B8A6",  # Teal
    "#F43F5E",  # Rose
    "#6366F1",  # Indigo
    "#84CC16",  # Lime
]

# Predefined icons for departments (lucide-react icon names)
DEPARTMENT_ICONS = [
    {"id": "building-2", "name_tr": "Genel / Yönetim", "name_en": "General / Management"},
    {"id": "briefcase", "name_tr": "İş / Operasyon", "name_en": "Business / Operations"},
    {"id": "users", "name_tr": "İnsan Kaynakları", "name_en": "Human Resources"},
    {"id": "calculator", "name_tr": "Finans / Muhasebe", "name_en": "Finance / Accounting"},
    {"id": "code", "name_tr": "Yazılım / IT", "name_en": "Software / IT"},
    {"id": "wrench", "name_tr": "Teknik / Mühendislik", "name_en": "Technical / Engineering"},
    {"id": "headphones", "name_tr": "Müşteri Hizmetleri", "name_en": "Customer Service"},
    {"id": "megaphone", "name_tr": "Pazarlama", "name_en": "Marketing"},
    {"id": "scale", "name_tr": "Hukuk", "name_en": "Legal"},
    {"id": "factory", "name_tr": "Üretim", "name_en": "Manufacturing"},
    {"id": "truck", "name_tr": "Lojistik", "name_en": "Logistics"},
    {"id": "shopping-cart", "name_tr": "Satın Alma", "name_en": "Procurement"},
    {"id": "heart-pulse", "name_tr": "Sağlık / İSG", "name_en": "Health / Safety"},
    {"id": "graduation-cap", "name_tr": "Eğitim / Akademi", "name_en": "Education / Academy"},
    {"id": "globe", "name_tr": "Uluslararası", "name_en": "International"},
    {"id": "bar-chart-2", "name_tr": "Analiz / BI", "name_en": "Analytics / BI"},
    {"id": "shield", "name_tr": "Güvenlik", "name_en": "Security"},
    {"id": "file-text", "name_tr": "İdari İşler", "name_en": "Administrative"},
]


# Request schemas
class DepartmentCreate(BaseModel):
    """Department creation schema"""
    name: str = Field(..., min_length=2, max_length=100)
    is_active: bool = True
    color: Optional[str] = Field(None, max_length=7, description="Hex color code like #3B82F6")
    icon: Optional[str] = Field(None, max_length=50, description="Lucide icon name like 'briefcase'")


class DepartmentUpdate(BaseModel):
    """Department update schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None
    color: Optional[str] = Field(None, max_length=7, description="Hex color code like #3B82F6")
    icon: Optional[str] = Field(None, max_length=50, description="Lucide icon name like 'briefcase'")


# Response schemas
class DepartmentResponse(BaseModel):
    id: str
    name: str
    is_active: bool
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
