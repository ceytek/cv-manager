
"""
Job Matcher Service
Matches candidate CVs to job requirements using OpenAI.
"""

import json
import logging
import unicodedata
from typing import Dict, Any, Optional, Tuple

from app.services.openai_client import get_openai_client
from app.prompts.cv_job_matching_prompt import get_cv_job_matching_prompt
from app.utils.location_utils import compute_location_match

logger = logging.getLogger(__name__)

# Comparison JSON contract (for reference across services)
# {
#   "overall": { "a": 0-100, "b": 0-100 },
#   "summaryTR": "Türkçe karşılaştırma özeti...",
#   "similarities": ["React", "Node.js", ...],
#   "differences": { "aOnly": ["GraphQL"], "bOnly": ["Django"] },
#   "sections": {
#       "experience": { "overlap": [...], "aOnly": [...], "bOnly": [...], "commentTR": "..." },
#       "education":  { "overlap": [...], "aOnly": [...], "bOnly": [...], "commentTR": "..." },
#       "skills":     { "overlap": [...], "aOnly": [...], "bOnly": [...], "commentTR": "..." },
#       "languages":  { "overlap": [...], "aOnly": [...], "bOnly": [...], "commentTR": "..." },
#       "projects":   { "highlightsA": [...], "highlightsB": [...], "commentTR": "..." }
#   },
#   "keyFactsA": ["..."],
#   "keyFactsB": ["..."],
#   "notesTR": "Kısa kapanış notu"
# }


class JobMatcherService:
    """Service for matching candidates to job requirements."""
    
    def __init__(self):
        self.client = get_openai_client()
        self.model = "gpt-4o-mini"  # Same model as CV parsing
    
    async def match_cv_to_job(
        self,
        job_data: Dict[str, Any],
        candidate_data: Dict[str, Any],
        language: str = "turkish"
    ) -> Dict[str, Any]:
        """
        Analyze a candidate's CV against job requirements.
        
        Args:
            job_data: Dictionary containing job information
            candidate_data: Dictionary containing candidate CV data
        
        Returns:
            Dictionary containing analysis results with scores and recommendations
        
        Raises:
            Exception: If OpenAI API call fails
        """
        try:
            # Generate the matching prompt with language support
            prompt = get_cv_job_matching_prompt(job_data, candidate_data, language)
            
            logger.info(
                f"Analyzing candidate {candidate_data.get('name', 'Unknown')} "
                f"for job {job_data.get('title', 'Unknown')} in {language}"
            )
            
            # Dynamic system message based on language
            if language == "english":
                system_message = (
                    "You are an expert HR analyst specializing in candidate evaluation and job matching. "
                    "You provide objective, data-driven assessments of candidate-job fit. "
                    "IMPORTANT LANGUAGE POLICY: Produce all narrative/free-text content in English — "
                    "including summary, strengths, weaknesses, reasoning fields and any notes. "
                    "Keep JSON keys and any enum/code values exactly as specified in English."
                )
            else:  # turkish (default)
                system_message = (
                    "You are an expert HR analyst specializing in candidate evaluation and job matching. "
                    "You provide objective, data-driven assessments of candidate-job fit. "
                    "IMPORTANT LANGUAGE POLICY: Produce all narrative/free-text content in Turkish (Türkçe) — "
                    "including summary, strengths, weaknesses, reasoning fields and any notes. "
                    "Keep JSON keys and any enum/code values exactly as specified in English."
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
                temperature=0.3,  # Lower temperature for more consistent scoring
                max_tokens=2000,
                response_format={"type": "json_object"}  # Ensure JSON response
            )
            
            # Extract and parse the response
            analysis_text = response.choices[0].message.content
            analysis_data = json.loads(analysis_text)
            
            # Validate the response structure
            self._validate_analysis_data(analysis_data)

            # Normalize optional language_matches, enforce coverage of all required languages,
            # and gently enforce language-weight if job requires languages
            try:
                req_langs_raw = job_data.get('required_languages') or {}
                req_langs_norm: Dict[str, Optional[str]] = {}

                # Helper: normalize language names to canonical lowercase English
                def _norm_lang(name: Any) -> str:
                    if not isinstance(name, str):
                        return ''
                    s = name.strip().lower()
                    # strip accents
                    s = unicodedata.normalize('NFKD', s)
                    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
                    # common mappings (TR -> EN and variants)
                    mapping = {
                        'turkce': 'turkish', 'türkçe': 'turkish', 'turkish': 'turkish',
                        'ingilizce': 'english', 'english': 'english', 'en': 'english',
                        'ispanyolca': 'spanish', 'spanish': 'spanish', 'espanol': 'spanish', 'español': 'spanish',
                        'almanca': 'german', 'german': 'german', 'deutsch': 'german',
                        'fransizca': 'french', 'francais': 'french', 'français': 'french', 'french': 'french',
                        'italyanca': 'italian', 'italiano': 'italian', 'italian': 'italian',
                        'portekizce': 'portuguese', 'portugues': 'portuguese', 'portuguese': 'portuguese',
                        'arapca': 'arabic', 'arabic': 'arabic',
                        'cince': 'chinese', 'chinese': 'chinese', 'mandarin': 'chinese',
                        'japonca': 'japanese', 'japanese': 'japanese',
                        'korece': 'korean', 'korean': 'korean',
                        'hollandaca': 'dutch', 'dutch': 'dutch', 'nederlands': 'dutch',
                        'yunanca': 'greek', 'greek': 'greek',
                        'lehce': 'polish', 'polish': 'polish',
                        'rusca': 'russian', 'russian': 'russian',
                        'japonca': 'japanese',
                    }
                    return mapping.get(s, s)

                # Helper: coerce levels to simple strings, keep as-is if unknown
                def _norm_level(level: Any) -> Optional[str]:
                    if not isinstance(level, str):
                        return None
                    lvl = level.strip()
                    return lvl if lvl else None

                # Build normalized required languages map
                if isinstance(req_langs_raw, dict):
                    for k, v in req_langs_raw.items():
                        nm = _norm_lang(k)
                        if nm:
                            req_langs_norm[nm] = _norm_level(v)
                elif isinstance(req_langs_raw, list):
                    for item in req_langs_raw:
                        if isinstance(item, dict):
                            nm = _norm_lang(item.get('language') or item.get('name'))
                            if nm:
                                req_langs_norm[nm] = _norm_level(item.get('level'))
                        elif isinstance(item, str):
                            nm = _norm_lang(item)
                            if nm:
                                req_langs_norm[nm] = None

                if req_langs_norm:
                    # Ensure language_matches array exists
                    lm = analysis_data.get('language_matches')
                    if not isinstance(lm, list):
                        lm = []
                    # Normalize existing entries and index by normalized language
                    norm_matches: Dict[str, Dict[str, Any]] = {}
                    for entry in lm:
                        if not isinstance(entry, dict):
                            continue
                        lang_name = _norm_lang(entry.get('language'))
                        if not lang_name:
                            continue
                        # Fill required_level from job if missing
                        if not entry.get('required_level') and lang_name in req_langs_norm and req_langs_norm[lang_name]:
                            entry['required_level'] = req_langs_norm[lang_name]
                        # Normalize status values
                        status = entry.get('status')
                        if isinstance(status, str):
                            st = status.strip().lower()
                            if st not in ('meets', 'exceeds', 'partial', 'missing', 'not_found', 'below'):
                                st = 'partial'
                            entry['status'] = st
                        norm_matches[lang_name] = entry

                    # Add any missing required languages as explicit "missing"
                    for rlang, rlevel in req_langs_norm.items():
                        if rlang not in norm_matches:
                            norm_matches[rlang] = {
                                'language': rlang,
                                'required_level': rlevel,
                                'candidate_level': 'missing',
                                'status': 'missing',
                                'notes': 'Required language not evidenced in CV'
                            }

                    # Write back normalized list preserving a stable order (required langs first)
                    ordered = []
                    for rlang in req_langs_norm.keys():
                        if rlang in norm_matches:
                            ordered.append(norm_matches[rlang])
                    # Include any extras reported by AI
                    for k, v in norm_matches.items():
                        if k not in req_langs_norm:
                            ordered.append(v)
                    analysis_data['language_matches'] = ordered

                    # Ensure language_score present and within 0-10
                    b = analysis_data.get('breakdown', {})
                    lang_score = b.get('language_score')
                    if not isinstance(lang_score, (int, float)):
                        lang_score = 0
                    b['language_score'] = max(0, min(10, int(lang_score)))
                    analysis_data['breakdown'] = b

                    # Recompute overall score if all core parts are present; otherwise lightly blend
                    overall = analysis_data.get('overall_score', 0)
                    parts = [b.get('experience_score'), b.get('education_score'), b.get('skills_score'), b.get('language_score'), b.get('fit_score')]
                    if all(isinstance(x, (int, float)) for x in parts):
                        recomputed = int(sum(parts))
                        analysis_data['overall_score'] = max(0, min(100, recomputed))
                    else:
                        analysis_data['overall_score'] = max(0, min(100, int(0.9 * overall + b.get('language_score', 0))))
            except Exception:
                # Do not fail the whole analysis if normalization fails
                pass

            # ============================================================
            # HARD RULE: Disability (Engelli) Position Check
            # If the job is marked as disabled-friendly (engelli kadrosu),
            # the candidate MUST have disability mentioned in their CV.
            # This is a legal requirement in Turkey - no exceptions.
            # ============================================================
            try:
                is_disabled_job = job_data.get('is_disabled_friendly', False)
                if is_disabled_job:
                    # Check if candidate's CV mentions disability
                    disability_found = self._check_disability_in_cv(candidate_data)
                    
                    if not disability_found:
                        # Override entire analysis to 0
                        logger.info(
                            f"Disability position check FAILED for candidate "
                            f"{candidate_data.get('name', 'Unknown')} - "
                            f"CV does not mention disability status. Score forced to 0."
                        )
                        
                        disability_msg_tr = (
                            "Bu ilan engelli kadrosu için açılmıştır. "
                            "Adayın CV'sinde engellilik durumu belirtilmediği için "
                            "bu pozisyon için değerlendirilemez. "
                            "Engelli kadroları yasal zorunluluk olup koşulları kesindir."
                        )
                        disability_msg_en = (
                            "This position is designated for disabled candidates. "
                            "The candidate's CV does not indicate any disability status, "
                            "therefore they cannot be evaluated for this position. "
                            "Disabled positions are a legal requirement with strict conditions."
                        )
                        
                        summary_msg = disability_msg_tr if language != "english" else disability_msg_en
                        weakness_msg = disability_msg_tr if language != "english" else disability_msg_en
                        
                        analysis_data['overall_score'] = 0
                        analysis_data['recommendation'] = 'not_recommended'
                        analysis_data['summary'] = summary_msg
                        analysis_data['weaknesses'] = [weakness_msg]
                        analysis_data['strengths'] = []
                        analysis_data['breakdown'] = {
                            'experience_score': 0,
                            'experience_reasoning': summary_msg,
                            'education_score': 0,
                            'education_reasoning': summary_msg,
                            'skills_score': 0,
                            'skills_reasoning': summary_msg,
                            'language_score': 0,
                            'language_reasoning': summary_msg,
                            'fit_score': 0,
                            'fit_reasoning': summary_msg,
                        }
                        # Add a flag for frontend to display
                        analysis_data['disability_check_failed'] = True
            except Exception as e:
                logger.warning(f"Disability check error (non-fatal): {e}")

            # Compute/normalize location match from DB-backed candidate location
            try:
                # Extract locations
                job_loc = job_data.get('location') or job_data.get('city')
                # Prefer explicit candidate_data.location if provided, then parsed personal fields
                cand_loc = candidate_data.get('location') or candidate_data.get('city')
                if not cand_loc:
                    parsed = candidate_data.get('parsed_data') or {}
                    if isinstance(parsed, dict):
                        personal = parsed.get('personal') or {}
                        cand_loc = personal.get('location') or personal.get('address')
                # Always compute from our trusted sources (override AI-provided to ensure DB wins)
                loc_match = compute_location_match(job_loc, cand_loc)
                # Pretty-case city labels for UI
                def _pretty_city(s):
                    if not isinstance(s, str) or not s:
                        return s
                    return s[:1].upper() + s[1:]
                if loc_match:
                    analysis_data['location_match'] = {
                        'job_city': _pretty_city(loc_match.get('job_city')),
                        'candidate_city': _pretty_city(loc_match.get('candidate_city')),
                        'distance_km': loc_match.get('distance_km'),
                        'category': loc_match.get('category'),
                    }
                # Sync breakdown.location_score if available/derivable
                b = analysis_data.get('breakdown') or {}
                if loc_match:
                    loc_score = loc_match.get('location_score') if isinstance(loc_match, dict) else None
                    if isinstance(loc_score, (int, float)):
                        # Ensure integer 0-10
                        ls = max(0, min(10, int(loc_score)))
                        b['location_score'] = ls
                        # Provide a short reasoning if absent (language-aware)
                        if not b.get('location_reasoning'):
                            cat = loc_match.get('category')
                            if language == "english":
                                if cat == 'exact':
                                    b['location_reasoning'] = "Candidate and job are in the same city (exact match)."
                                elif cat == 'near':
                                    b['location_reasoning'] = "Candidate city is 10-150 km from job city (nearby)."
                                else:
                                    b['location_reasoning'] = "Candidate city is far from job city (>150 km)."
                            else:  # turkish
                                if cat == 'exact':
                                    b['location_reasoning'] = "Aday ve ilan aynı şehirde (tam eşleşme)."
                                elif cat == 'near':
                                    b['location_reasoning'] = "Aday şehir ilan şehrine 10–150 km aralığında (yakın)."
                                else:
                                    b['location_reasoning'] = "Aday şehir ilan şehrine uzak (>150 km)."
                        analysis_data['breakdown'] = b

                # Append a short note to the summary to reflect location outcome (language-aware)
                try:
                    summary = analysis_data.get('summary') or ''
                    cat = loc_match.get('category') if isinstance(loc_match, dict) else None
                    if language == "english":
                        if cat == 'exact':
                            note = "Location: Exact city match (10/10)."
                        elif cat == 'near':
                            note = "Location: Candidate is nearby (10-150 km) (8/10)."
                        elif cat == 'far':
                            note = "Location: Candidate is far from job location (>150 km) (0/10). Consider asking if they can relocate."
                        else:
                            note = None
                    else:  # turkish
                        if cat == 'exact':
                            note = "Lokasyon: Aday il ile tam eşleşme (10/10)."
                        elif cat == 'near':
                            note = "Lokasyon: Aday il ilan iline yakın (10–150 km) (8/10)."
                        elif cat == 'far':
                            note = "Lokasyon: Aday il ilan iline uzak (>150 km) (0/10). Çalışma yerinde ikamet edebilir mi sorulmalı."
                        else:
                            note = None
                    if note:
                        analysis_data['summary'] = (summary + "\n" + note).strip() if summary else note
                except Exception:
                    pass
                # Keep overall score consistent only with core parts (experience+education+skills+language+fit)
                # If we earlier recomputed overall, nothing to do; otherwise ensure it's within 0-100
                if not isinstance(analysis_data.get('overall_score'), (int, float)):
                    analysis_data['overall_score'] = 0
                analysis_data['overall_score'] = max(0, min(100, int(analysis_data['overall_score'])))
            except Exception:
                # Non-fatal; location info is auxiliary
                pass
            
            logger.info(
                f"Analysis complete: Overall score {analysis_data.get('overall_score')} "
                f"- {analysis_data.get('recommendation')}"
            )
            
            return analysis_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response as JSON: {e}")
            raise Exception("Invalid JSON response from AI service")
        
        except Exception as e:
            logger.error(f"Error in CV-to-Job matching: {str(e)}")
            raise Exception(f"Failed to analyze candidate: {str(e)}")
    
    def _check_disability_in_cv(self, candidate_data: Dict[str, Any]) -> bool:
        """
        Check if the candidate's CV mentions disability status.
        
        Searches through:
        - Parsed data (personal info, summary, experience descriptions)
        - Raw CV text if available
        - Name/title fields
        
        Returns True if disability-related keywords are found.
        """
        import re
        
        # Disability-related keywords in Turkish and English
        disability_keywords = [
            # Turkish
            'engelli', 'engellilik', 'engel durumu', 'engelli raporu',
            'engelli sağlık kurulu', 'engelli kimlik', 'engelli kartı',
            'bedensel engel', 'görme engel', 'işitme engel', 'ortopedik engel',
            'zihinsel engel', 'süreğen hastalık', 'kronik hastalık',
            'engelli oranı', 'engel oranı', '% engel',
            'engelli personel', 'engelli çalışan', 'engelli aday',
            'sağlık kurulu raporu', 'özürlü', 'özürlülük',
            # English
            'disabled', 'disability', 'handicap', 'impairment',
            'disability report', 'disability certificate', 'disability card',
            'physical disability', 'visual impairment', 'hearing impairment',
            'orthopedic disability', 'chronic illness', 'chronic disease',
            'disability rate', 'disability percentage',
            'special needs', 'differently abled',
        ]
        
        # Build a single regex pattern for efficiency
        pattern = re.compile(
            '|'.join(re.escape(kw) for kw in disability_keywords),
            re.IGNORECASE
        )
        
        # Collect all text from candidate data
        text_parts = []
        
        # Name (might include "Engelli" designation)
        if candidate_data.get('name'):
            text_parts.append(str(candidate_data['name']))
        
        # Raw CV text
        if candidate_data.get('cv_text'):
            text_parts.append(str(candidate_data['cv_text']))
        
        # Parsed data
        parsed = candidate_data.get('parsed_data') or {}
        if isinstance(parsed, dict):
            # Personal info
            personal = parsed.get('personal') or {}
            if isinstance(personal, dict):
                for key, val in personal.items():
                    if val:
                        text_parts.append(str(val))
            
            # Summary
            if parsed.get('summary'):
                text_parts.append(str(parsed['summary']))
            
            # Experience descriptions
            experiences = parsed.get('experience') or []
            if isinstance(experiences, list):
                for exp in experiences:
                    if isinstance(exp, dict):
                        for key in ['title', 'description', 'company']:
                            if exp.get(key):
                                text_parts.append(str(exp[key]))
                    else:
                        text_parts.append(str(exp))
            
            # Education
            educations = parsed.get('education') or []
            if isinstance(educations, list):
                for edu in educations:
                    if isinstance(edu, dict):
                        for key, val in edu.items():
                            if val:
                                text_parts.append(str(val))
                    else:
                        text_parts.append(str(edu))
            
            # Skills (might mention disability-related skills)
            skills = parsed.get('skills') or {}
            if isinstance(skills, dict):
                for key, val in skills.items():
                    if isinstance(val, list):
                        text_parts.extend(str(s) for s in val)
                    elif val:
                        text_parts.append(str(val))
            
            # Certifications (disability report could be listed)
            certs = parsed.get('certifications') or []
            if isinstance(certs, list):
                for cert in certs:
                    if isinstance(cert, dict):
                        for key, val in cert.items():
                            if val:
                                text_parts.append(str(val))
                    else:
                        text_parts.append(str(cert))
            
            # Additional/other sections
            for key in ['additional', 'other', 'notes', 'references', 'hobbies']:
                if parsed.get(key):
                    val = parsed[key]
                    if isinstance(val, list):
                        text_parts.extend(str(s) for s in val)
                    elif isinstance(val, dict):
                        for k, v in val.items():
                            if v:
                                text_parts.append(str(v))
                    else:
                        text_parts.append(str(val))
        
        # Search through all collected text
        combined_text = ' '.join(text_parts)
        
        if pattern.search(combined_text):
            return True
        
        # Also check for percentage patterns like "40% engelli" or "%40 engelli"
        percent_pattern = re.compile(r'(%\s*\d+|\d+\s*%)\s*(engel|disability|handicap)', re.IGNORECASE)
        if percent_pattern.search(combined_text):
            return True
        
        return False

    def _validate_analysis_data(self, data: Dict[str, Any]) -> None:
        """
        Validate that the analysis data has all required fields.
        
        Args:
            data: Analysis data dictionary
        
        Raises:
            ValueError: If required fields are missing
        """
        required_fields = [
            'overall_score',
            'recommendation',
            'breakdown',
            'matched_skills',
            'missing_skills',
            'strengths',
            'weaknesses',
            'summary'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            raise ValueError(f"Missing required fields in analysis: {', '.join(missing_fields)}")
        
        # Validate overall_score is in valid range
        score = data.get('overall_score')
        if not isinstance(score, (int, float)) or not (0 <= score <= 100):
            raise ValueError(f"Invalid overall_score: {score}. Must be between 0 and 100.")
        
        # Validate recommendation is one of the expected values
        valid_recommendations = ['highly_recommended', 'recommended', 'maybe', 'not_recommended']
        if data.get('recommendation') not in valid_recommendations:
            raise ValueError(
                f"Invalid recommendation: {data.get('recommendation')}. "
                f"Must be one of: {', '.join(valid_recommendations)}"
            )
        
        # Validate breakdown exists and has required fields
        breakdown = data.get('breakdown', {})
        required_breakdown_fields = [
            'experience_score',
            'education_score',
            'skills_score',
            'language_score',
            'fit_score'
        ]
        
        missing_breakdown = [
            field for field in required_breakdown_fields 
            if field not in breakdown
        ]
        
        if missing_breakdown:
            raise ValueError(
                f"Missing required breakdown fields: {', '.join(missing_breakdown)}"
            )


# Create a singleton instance
_job_matcher_service: Optional[JobMatcherService] = None


def get_job_matcher_service() -> JobMatcherService:
    """Get or create the job matcher service instance."""
    global _job_matcher_service
    
    if _job_matcher_service is None:
        _job_matcher_service = JobMatcherService()
    
    return _job_matcher_service
