"""
Job Generator Service
Generates professional job postings using OpenAI GPT-4o-mini.
"""

import json
import re
import logging
from typing import Dict, Any, List

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
            
            # Build skills context for system message
            skills_list = required_skills or []
            skills_context = ", ".join(skills_list) if skills_list else ""
            
            # Dynamic system message based on language
            if language == "english":
                skills_msg = ""
                if skills_context:
                    skills_msg = (
                        f"CRITICAL: The user specified these competencies: \"{skills_context}\". "
                        "These competencies define the DOMAIN/INDUSTRY of the job. "
                        "ALL content (description, tasks, requirements, keywords) MUST be specific to this domain. "
                    )
                system_message = (
                    "You are an expert HR specialist. "
                    "Create professional job descriptions in English. "
                    "Follow the exact JSON structure. "
                    f"Title MUST be exactly \"{position}\". "
                    f"{skills_msg}"
                    "The department field is ONLY organizational and must NOT influence job content."
                )
            else:  # turkish (default)
                skills_msg = ""
                if skills_context:
                    skills_msg = (
                        f"KRİTİK: Kullanıcı şu yetkinlikleri belirtti: \"{skills_context}\". "
                        "Bu yetkinlikler ilanın ALANINI/SEKTÖRÜNÜ belirler. "
                        "TÜM içerik (tanım, görevler, nitelikler, anahtar kelimeler) bu alana ÖZGÜ olmalı. "
                    )
                system_message = (
                    "Sen uzman bir İK uzmanısın. "
                    "Profesyonel iş ilanları oluştur. Tüm çıktı Türkçe olmalı. "
                    "JSON yapısına tam uy. "
                    f"title MUTLAKA \"{position}\" olmalı. "
                    f"{skills_msg}"
                    "Departman sadece organizasyonel bilgidir, içeriği etkilemez."
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
                temperature=0.35,  # Low temperature for strict instruction following
                max_tokens=2500,
                response_format={"type": "json_object"}  # Ensure JSON response
            )
            
            # Extract and parse the response
            job_data_text = response.choices[0].message.content
            job_data = json.loads(job_data_text)
            
            # Post-processing: Force title and ensure domain keywords from skills
            job_data = self._enforce_position_fidelity(job_data, position, required_skills or [])
            
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
    
    def _enforce_position_fidelity(self, data: Dict[str, Any], position: str, skills: List[str] = None) -> Dict[str, Any]:
        """
        Post-processing step to ensure the generated content faithfully
        reflects the position name AND the skills/competencies domain.
        
        Args:
            data: Generated job data dictionary
            position: Original position name provided by user
            skills: List of required skills/competencies that define the domain
            
        Returns:
            Modified job data with enforced fidelity
        """
        import re as _re
        skills = skills or []
        
        # 1. Force title to be the exact position name
        original_title = data.get('title', '')
        if original_title.strip().lower() != position.strip().lower():
            logger.warning(
                f"AI changed title from '{position}' to '{original_title}'. "
                f"Forcing title back to '{position}'"
            )
        data['title'] = position.strip()
        
        # 2. Extract significant words from BOTH position and skills
        stop_words = {
            've', 'ile', 'için', 'bir', 'bu', 'de', 'da', 'den', 'dan', 'veya',
            'and', 'for', 'the', 'a', 'an', 'in', 'at', 'of', 'to', 'or'
        }
        
        # Collect all domain words from skills (these define the industry/domain)
        all_domain_words = set()
        for skill in skills:
            for word in skill.strip().split():
                if len(word) > 2 and word.lower() not in stop_words:
                    all_domain_words.add(word)
        
        # Also add position words
        for word in position.strip().split():
            if len(word) > 2 and word.lower() not in stop_words:
                all_domain_words.add(word)
        
        # 3. Ensure keywords contain skill/domain terms
        keywords = data.get('keywords', [])
        keywords_lower = ' '.join(keywords).lower()
        
        # Add each skill as a keyword if not present
        for skill in skills:
            skill_lower = skill.strip().lower()
            if skill_lower and not any(skill_lower in kw.lower() for kw in keywords):
                keywords.insert(0, skill.strip())
                logger.info(f"Added skill '{skill}' to keywords")
        
        # Add individual domain words if not in keywords
        for word in all_domain_words:
            if word.lower() not in keywords_lower:
                keywords.append(word)
        
        data['keywords'] = keywords
        
        # 4. Check if skill domain words appear in description
        description = data.get('description', '')
        description_plain = data.get('description_plain', '')
        desc_lower = (description + description_plain).lower()
        
        # Find skill words that are NOT in the description (the domain gap)
        missing_domain_words = []
        for skill in skills:
            skill_words = [w for w in skill.strip().split() if len(w) > 2 and w.lower() not in stop_words]
            for word in skill_words:
                if word.lower() not in desc_lower:
                    missing_domain_words.append(word)
        
        if missing_domain_words:
            logger.warning(
                f"Domain words from skills {missing_domain_words} not found in description. "
                f"Attempting to inject domain context."
            )
            
            # For each skill, try to find partial matches and replace
            for skill in skills:
                skill_words = [w for w in skill.strip().split() if len(w) > 2 and w.lower() not in stop_words]
                skill_stripped = skill.strip()
                
                # Try to find a subset of the skill in description and expand it
                for i in range(len(skill_words)):
                    partial = ' '.join(skill_words[i:])
                    if len(partial) > 3 and partial.lower() in description.lower():
                        pattern = _re.compile(_re.escape(partial), _re.IGNORECASE)
                        data['description'] = pattern.sub(skill_stripped, description, count=0)
                        if description_plain:
                            data['description_plain'] = pattern.sub(
                                skill_stripped, description_plain, count=0
                            )
                        logger.info(f"Replaced '{partial}' with '{skill_stripped}' in description")
                        description = data['description']  # Update for next iteration
                        break
        
        return data
    
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
