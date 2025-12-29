"""
Simplified two-CV comparison service.
Only asks AI for evaluation. All data extraction is done from database.
"""
import json
import logging
import re
from typing import Any, Dict, Optional

from app.services.openai_client import get_openai_client
from app.prompts.cv_compare_prompt import get_cv_compare_prompt

logger = logging.getLogger(__name__)


def _extract_json(raw: str) -> Optional[Dict[str, Any]]:
    """Try multiple strategies to parse JSON from a model response."""
    try:
        return json.loads(raw)
    except Exception:
        pass

    # Strip markdown fences if present
    if raw.strip().startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9_-]*\n|\n```$", "", raw.strip())
        try:
            return json.loads(cleaned)
        except Exception:
            pass

    # Fallback: extract biggest JSON object substring
    try:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = raw[start : end + 1]
            return json.loads(snippet)
    except Exception:
        return None
    return None


def _build_fallback_evaluation(
    candidate_a: Dict[str, Any], candidate_b: Dict[str, Any], job: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Build a simple deterministic evaluation when AI fails.
    Only returns aiEvaluation structure.
    """
    name_a = candidate_a.get("name") or "Aday A"
    name_b = candidate_b.get("name") or "Aday B"
    
    pa = candidate_a.get("parsed_data") or {}
    pb = candidate_b.get("parsed_data") or {}
    
    # Extract skills for position suggestions
    def _get_skills(parsed_data):
        skills = parsed_data.get("skills") or []
        if not isinstance(skills, list):
            skills = []
        return [s.lower() if isinstance(s, str) else str(s).lower() for s in skills if s]
    
    skills_a = _get_skills(pa)
    skills_b = _get_skills(pb)
    
    # Simple position suggestion based on skills
    def _suggest_positions(skills, name):
        positions = []
        if any(w in skills for w in ["python", "java", "javascript", "react", "node", "software", "developer", "yazılım"]):
            positions.append("Yazılım Geliştirici")
        if any(w in skills for w in ["frontend", "react", "vue", "angular", "css", "html"]):
            positions.append("Frontend Developer")
        if any(w in skills for w in ["backend", "api", "database", "sql", "server"]):
            positions.append("Backend Developer")
        if any(w in skills for w in ["grafik", "tasarım", "photoshop", "illustrator", "design", "ui", "ux"]):
            positions.append("UI/UX Tasarımcı")
        if any(w in skills for w in ["proje", "project", "yönetim", "management"]):
            positions.append("Proje Yöneticisi")
        if not positions:
            positions.append("Çeşitli Pozisyonlar")
        return positions[:3]
    
    # Simple strengths based on data availability
    def _suggest_strengths(parsed_data, name):
        strengths = []
        skills = parsed_data.get("skills") or []
        experience = parsed_data.get("experience") or []
        education = parsed_data.get("education") or []
        
        if len(skills) > 10:
            strengths.append("Geniş teknik yetenek yelpazesi")
        elif len(skills) > 5:
            strengths.append("Çeşitli teknik beceriler")
        
        if len(experience) > 3:
            strengths.append("Zengin iş deneyimi")
        elif len(experience) > 0:
            strengths.append("İş tecrübesi mevcut")
        
        if len(education) > 0:
            strengths.append("Akademik eğitim")
        
        if not strengths:
            strengths.append("Değerlendirme için yeterli veri bulunamadı")
        
        return strengths[:5]
    
    return {
        "aiEvaluation": {
            "candidateA": {
                "strengths": _suggest_strengths(pa, name_a),
                "suitablePositions": _suggest_positions(skills_a, name_a),
            },
            "candidateB": {
                "strengths": _suggest_strengths(pb, name_b),
                "suitablePositions": _suggest_positions(skills_b, name_b),
            },
        }
    }


class CVCompareService:
    def __init__(self, model: str = "gpt-4o-mini") -> None:
        try:
            self.client = get_openai_client()
        except Exception as e:
            logger.warning(f"OpenAI client init failed, will use fallback: {e}")
            self.client = None
        self.model = model

    async def compare_two_cvs(
        self,
        candidate_a: Dict[str, Any],
        candidate_b: Dict[str, Any],
        job: Optional[Dict[str, Any]] = None,
        language: str = "turkish",
    ) -> Dict[str, Any]:
        prompt = get_cv_compare_prompt(candidate_a, candidate_b, job, language)
        
        # If client is unavailable, skip AI and return fallback directly
        if not self.client:
            return _build_fallback_evaluation(candidate_a, candidate_b, job)
        
        try:
            # Set system message based on language
            if language == "english":
                system_message = (
                    "You are an expert HR analyst. Compare two candidates and provide evaluation. "
                    "IMPORTANT: Return only JSON, no additional explanations. "
                    "Write all descriptions and comments in English. "
                    "Use JSON keys in English as specified."
                )
            else:  # turkish (default)
                system_message = (
                    "Sen uzman bir İK analistisiniz. İki adayı karşılaştır ve değerlendirme yap. "
                    "ÖNEMLİ: Sadece JSON döndür, başka açıklama ekleme. "
                    "Tüm açıklama ve yorum metinlerini Türkçe yaz. "
                    "JSON anahtarlarını İngilizce olarak belirtildiği gibi kullan."
                )
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1000,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content or ""
            data = _extract_json(raw)
            
            if not data:
                logger.warning("AI JSON parse failed; returning deterministic fallback")
                return _build_fallback_evaluation(candidate_a, candidate_b, job)

            # Minimal validation; if missing expected fields, use fallback
            if not isinstance(data, dict) or "aiEvaluation" not in data:
                logger.warning("AI response missing aiEvaluation field; using fallback")
                return _build_fallback_evaluation(candidate_a, candidate_b, job)
            
            return data
        except Exception as e:
            logger.error(f"Compare error, using fallback: {e}")
            return _build_fallback_evaluation(candidate_a, candidate_b, job)


_compare_service: Optional[CVCompareService] = None


def get_compare_service() -> CVCompareService:
    global _compare_service
    if _compare_service is None:
        _compare_service = CVCompareService()
    return _compare_service
