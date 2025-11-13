"""
Job Generator Service
Generates professional job postings using OpenAI GPT-4o-mini.
"""

import json
import logging
from typing import Dict, Any

from app.services.openai_client import get_openai_client
from app.prompts.job_description_generator_prompt import get_job_description_generator_prompt

logger = logging.getLogger(__name__)


class JobGeneratorService:
    """Service for generating job descriptions with AI."""
    
    def __init__(self):
        self.client = get_openai_client()
        self.model = "gpt-4o-mini"
    
    async def generate_job_description(
        self,
        position: str,
        department: str = None,
        location: str = None,
        employment_type: str = "full_time",
        experience_level: str = None,
        required_skills: list = None,
        required_languages: list = None,
        additional_notes: str = None,
        language: str = "turkish"
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive job description using AI.
        
        Args:
            position: Job title/position name
            department: Department name (optional)
            location: City/location
            employment_type: full_time, part_time, contract, intern
            experience_level: entry, junior, mid, senior, lead
            required_skills: List of required skills/technologies
            required_languages: List of language requirements with levels
            additional_notes: Additional requirements or highlights
            language: "turkish" or "english"
        
        Returns:
            Dictionary containing generated job data matching DB schema
        
        Raises:
            Exception: If OpenAI API call fails or validation fails
        """
        try:
            # Generate the prompt
            prompt = get_job_description_generator_prompt(
                position=position,
                department=department,
                location=location,
                employment_type=employment_type,
                experience_level=experience_level,
                required_skills=required_skills or [],
                required_languages=required_languages or [],
                additional_notes=additional_notes,
                language=language
            )
            
            logger.info(
                f"Generating job description for position: {position} "
                f"in {language}"
            )
            
            # Dynamic system message based on language
            if language == "english":
                system_message = (
                    "You are an expert HR specialist and job posting writer. "
                    "Create professional, comprehensive, and engaging job descriptions. "
                    "IMPORTANT: All output text must be in English. "
                    "Follow the exact JSON structure provided. "
                    "Be specific, realistic, and aligned with industry standards."
                )
            else:  # turkish (default)
                system_message = (
                    "Sen uzman bir İnsan Kaynakları uzmanı ve iş ilanı yazarısın. "
                    "Profesyonel, kapsamlı ve çekici iş ilanları oluştur. "
                    "ÖNEMLİ: Tüm çıktı metinleri Türkçe olmalıdır. "
                    "Verilen JSON yapısına tam olarak uy. "
                    "Spesifik, gerçekçi ve sektör standartlarına uygun ol."
                )
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_message
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,  # Balanced between creativity and consistency
                max_tokens=2500,
                response_format={"type": "json_object"}  # Ensure JSON response
            )
            
            # Extract and parse the response
            job_data_text = response.choices[0].message.content
            job_data = json.loads(job_data_text)
            
            # Validate the generated data
            self._validate_generated_job(job_data)
            
            # Add metadata
            job_data['generated_by_ai'] = True
            job_data['language'] = language
            
            logger.info(
                f"Job description generated successfully: {job_data.get('title')} "
                f"with {len(job_data.get('keywords', []))} keywords"
            )
            
            return job_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response as JSON: {e}")
            raise Exception("Invalid JSON response from AI service")
        
        except Exception as e:
            logger.error(f"Error in job description generation: {str(e)}")
            raise Exception(f"Failed to generate job description: {str(e)}")
    
    def _validate_generated_job(self, data: Dict[str, Any]) -> None:
        """
        Validate that the generated job data has all required fields
        and matches the database schema.
        
        Args:
            data: Generated job data dictionary
        
        Raises:
            ValueError: If required fields are missing or invalid
        """
        # Required fields that must be present
        required_fields = [
            'title',
            'description',
            'description_plain',
            'requirements',
            'requirements_plain',
            'keywords'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            raise ValueError(
                f"Missing required fields in generated job data: {', '.join(missing_fields)}"
            )
        
        # Validate field types
        if not isinstance(data.get('title'), str) or not data['title'].strip():
            raise ValueError("Invalid or empty title")
        
        if not isinstance(data.get('description'), str) or not data['description'].strip():
            raise ValueError("Invalid or empty description")
        
        if not isinstance(data.get('requirements'), str) or not data['requirements'].strip():
            raise ValueError("Invalid or empty requirements")
        
        if not isinstance(data.get('keywords'), list) or len(data['keywords']) == 0:
            raise ValueError("Keywords must be a non-empty list")
        
        # Validate keywords (max 20 keywords)
        if len(data['keywords']) > 20:
            data['keywords'] = data['keywords'][:20]
            logger.warning(f"Keywords truncated to 20 items")
        
        # Validate required_languages format if present
        if 'required_languages' in data:
            if not isinstance(data['required_languages'], dict):
                raise ValueError("required_languages must be a dictionary")
        
        # Validate start_date if present
        valid_start_dates = ['immediate', '1month', '3months', 'flexible']
        if 'start_date' in data:
            if data['start_date'] not in valid_start_dates:
                logger.warning(
                    f"Invalid start_date: {data['start_date']}, "
                    f"defaulting to 'flexible'"
                )
                data['start_date'] = 'flexible'
        
        # Ensure HTML tags in description and requirements
        if '<p>' not in data['description'] and '<ul>' not in data['description']:
            logger.warning("Description might not be properly HTML formatted")
        
        if '<li>' not in data['requirements']:
            logger.warning("Requirements might not be properly HTML formatted")
        
        logger.info("Job data validation passed")


# Create a singleton instance
_job_generator_service = None


def get_job_generator_service() -> JobGeneratorService:
    """Get or create the job generator service instance."""
    global _job_generator_service
    
    if _job_generator_service is None:
        _job_generator_service = JobGeneratorService()
    
    return _job_generator_service
