"""
Modular architecture for the CV Manager backend.
Each module contains its own models, types, and resolvers.

Available modules:
- common: Shared types (MessageType, GenericResponse)
- rejection: Rejection email templates
- second_interview: HR manual second interview system
- second_interview_template: Second interview email templates
- company_address: Company address management

Usage:
    from app.modules.rejection import RejectionTemplate, RejectionTemplateType
    from app.modules.common import MessageType
    from app.modules.second_interview import SecondInterview
    from app.modules.second_interview_template import SecondInterviewTemplate
    from app.modules.company_address import CompanyAddress
"""
