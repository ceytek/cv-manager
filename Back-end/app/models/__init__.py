"""
Models package
"""
from app.models.user import User
from app.models.role import Role
from app.models.department import Department
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus

__all__ = ['User', 'Role', 'Department', 'Job', 'Candidate', 'Application', 'ApplicationStatus']
