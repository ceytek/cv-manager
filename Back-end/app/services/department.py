from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from typing import Optional, List


class DepartmentService:
    """Department management service"""
    
    @staticmethod
    def get_by_id(db: Session, department_id: str) -> Optional[Department]:
        """Get department by ID"""
        return db.query(Department).filter(Department.id == department_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Department]:
        """Get department by name"""
        return db.query(Department).filter(Department.name == name).first()
    
    @staticmethod
    def list_all(db: Session, include_inactive: bool = False) -> List[Department]:
        """List all departments"""
        query = db.query(Department)
        if not include_inactive:
            query = query.filter(Department.is_active == True)
        return query.order_by(Department.name).all()
    
    @staticmethod
    def create(db: Session, department_data: DepartmentCreate) -> Department:
        """Create a new department"""
        # Check if department already exists
        existing = DepartmentService.get_by_name(db, department_data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu isimde bir departman zaten mevcut"
            )
        
        new_department = Department(
            name=department_data.name,
            is_active=department_data.is_active
        )
        
        db.add(new_department)
        db.commit()
        db.refresh(new_department)
        return new_department
    
    @staticmethod
    def update(db: Session, department_id: str, department_data: DepartmentUpdate) -> Department:
        """Update department"""
        department = DepartmentService.get_by_id(db, department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Departman bulunamadı"
            )
        
        # Check name uniqueness if changing name
        if department_data.name and department_data.name != department.name:
            existing = DepartmentService.get_by_name(db, department_data.name)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bu isimde bir departman zaten mevcut"
                )
            department.name = department_data.name
        
        if department_data.is_active is not None:
            department.is_active = department_data.is_active
        
        db.commit()
        db.refresh(department)
        return department
    
    @staticmethod
    def toggle_active(db: Session, department_id: str) -> Department:
        """Toggle department active status"""
        department = DepartmentService.get_by_id(db, department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Departman bulunamadı"
            )
        
        department.is_active = not department.is_active
        db.commit()
        db.refresh(department)
        return department
