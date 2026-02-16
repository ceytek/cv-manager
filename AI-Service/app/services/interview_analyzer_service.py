"""
Interview Analyzer Service
AI-powered interview response analysis using OpenAI
"""
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.services.openai_client import get_openai_client


# ============================================
# Interview Analysis Prompt
# ============================================

INTERVIEW_ANALYSIS_PROMPT_TR = """Sen deneyimli bir İK uzmanı ve mülakat değerlendirme uzmanısın. Aşağıdaki mülakat sorularına verilen cevapları değerlendir.

## İş İlanı Bilgileri:
Pozisyon: {job_title}
İş Tanımı: {job_description}
Gereksinimler: {job_requirements}

## Mülakat Soruları ve Cevapları:
{questions_answers}

## Değerlendirme Kriterleri:

Aşağıdaki 5 kategori üzerinden değerlendirme yap. Her kategori için 1-5 arası puan ver ve detaylı geri bildirim sağla.

1. **İçerik Uyumu (Content Relevance)**: Cevapların soruyla ve iş gereksinimleriyle ne kadar alakalı olduğu
2. **Sözlü İletişim Becerisi (Communication Skills)**: Açıklık, akıcılık, profesyonel dil kullanımı
3. **Öğrenme İsteği & Etki Yaratma (Learning & Impact)**: Gelişime açıklık, motivasyon, pozitif katkı potansiyeli
4. **Problem Çözme & Eleştirel Düşünme (Problem Solving)**: Analitik düşünce, yaratıcı çözümler, mantıksal yaklaşım
5. **Takım Çalışması (Teamwork)**: İşbirliği, iletişim, ekip dinamiklerine uyum

## Puanlama Rehberi:
- 5: Mükemmel - Beklentileri aşıyor
- 4: İyi - Beklentileri karşılıyor
- 3: Orta - Kabul edilebilir, gelişim alanları var
- 2: Zayıf - Önemli eksiklikler var
- 1: Yetersiz - Ciddi eksiklikler var

## Yanıt Formatı (JSON):
{{
    "overall_score": <1-5 arası ortalama puan>,
    "summary": "<Genel değerlendirme özeti - 2-3 cümle>",
    "categories": [
        {{
            "category": "İçerik Uyumu",
            "category_en": "Content Relevance",
            "score": <1-5>,
            "feedback": [
                "<Madde 1>",
                "<Madde 2>",
                "<Madde 3>"
            ]
        }},
        {{
            "category": "Sözlü İletişim Becerisi",
            "category_en": "Communication Skills",
            "score": <1-5>,
            "feedback": ["...", "...", "..."]
        }},
        {{
            "category": "Öğrenme İsteği & Etki Yaratma",
            "category_en": "Learning & Impact",
            "score": <1-5>,
            "feedback": ["...", "...", "..."]
        }},
        {{
            "category": "Problem Çözme & Eleştirel Düşünme",
            "category_en": "Problem Solving",
            "score": <1-5>,
            "feedback": ["...", "...", "..."]
        }},
        {{
            "category": "Takım Çalışması",
            "category_en": "Teamwork",
            "score": <1-5>,
            "feedback": ["...", "...", "..."]
        }}
    ],
    "analyzed_at": "{current_time}"
}}

Sadece JSON formatında yanıt ver, başka açıklama ekleme."""


INTERVIEW_ANALYSIS_PROMPT_EN = """You are an experienced HR specialist and interview evaluation expert. Evaluate the following interview responses.

## Job Information:
Position: {job_title}
Job Description: {job_description}
Requirements: {job_requirements}

## Interview Questions and Answers:
{questions_answers}

## Evaluation Criteria:

Evaluate based on the following 5 categories. Give a score of 1-5 for each category and provide detailed feedback.

1. **Content Relevance**: How relevant the answers are to the question and job requirements
2. **Communication Skills**: Clarity, fluency, professional language use
3. **Learning & Impact**: Openness to growth, motivation, positive contribution potential
4. **Problem Solving**: Analytical thinking, creative solutions, logical approach
5. **Teamwork**: Collaboration, communication, fit with team dynamics

## Scoring Guide:
- 5: Excellent - Exceeds expectations
- 4: Good - Meets expectations
- 3: Average - Acceptable, room for improvement
- 2: Weak - Significant gaps
- 1: Poor - Serious deficiencies

## Response Format (JSON):
{{
    "overall_score": <average score 1-5>,
    "summary": "<Overall evaluation summary - 2-3 sentences>",
    "categories": [
        {{
            "category": "Content Relevance",
            "category_en": "Content Relevance",
            "score": <1-5>,
            "feedback": [
                "<Point 1>",
                "<Point 2>",
                "<Point 3>"
            ]
        }},
        {{
            "category": "Communication Skills",
            "category_en": "Communication Skills",
            "score": <1-5>,
            "feedback": ["...", "...", "..."]
        }},
        {{
            "category": "Learning & Impact",
            "category_en": "Learning & Impact",
            "score": <1-5>,
            "feedback": ["...", "...", "..."]
        }},
        {{
            "category": "Problem Solving",
            "category_en": "Problem Solving",
            "score": <1-5>,
            "feedback": ["...", "...", "..."]
        }},
        {{
            "category": "Teamwork",
            "category_en": "Teamwork",
            "score": <1-5>,
            "feedback": ["...", "...", "..."]
        }}
    ],
    "analyzed_at": "{current_time}"
}}

Respond only with JSON, no additional explanations."""


class InterviewAnalyzerService:
    """Service for analyzing interview responses using AI"""
    
    def __init__(self):
        self.client = get_openai_client()
    
    async def analyze_interview(
        self,
        job_context: Dict[str, Any],
        questions_answers: List[Dict[str, Any]],
        language: str = "tr"
    ) -> Dict[str, Any]:
        """
        Analyze interview responses using AI.
        
        Args:
            job_context: Job information (title, description, requirements)
            questions_answers: List of {question, answer, order}
            language: Response language ('tr' or 'en')
            
        Returns:
            Analysis results with categories and scores
        """
        # Format Q&A for prompt
        qa_text = ""
        for qa in sorted(questions_answers, key=lambda x: x.get("order", 0)):
            qa_text += f"Soru {qa.get('order', '?')}: {qa.get('question', '')}\n"
            qa_text += f"Cevap: {qa.get('answer', '[Cevap verilmedi]')}\n\n"
        
        # Select prompt based on language
        prompt_template = INTERVIEW_ANALYSIS_PROMPT_TR if language == "tr" else INTERVIEW_ANALYSIS_PROMPT_EN
        
        # Build prompt
        prompt = prompt_template.format(
            job_title=job_context.get("title", "Belirtilmemiş"),
            job_description=job_context.get("description", "Belirtilmemiş"),
            job_requirements=job_context.get("requirements", "Belirtilmemiş"),
            questions_answers=qa_text,
            current_time=datetime.utcnow().isoformat(),
        )
        
        try:
            # Call OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert HR interview evaluator. Always respond in valid JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            # Validate and add timestamp if missing
            if "analyzed_at" not in result:
                result["analyzed_at"] = datetime.utcnow().isoformat()
            
            # Ensure overall_score is a float
            if "overall_score" in result:
                result["overall_score"] = float(result["overall_score"])
            
            return result
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return a default error response
            return {
                "overall_score": 0,
                "summary": f"Analiz sırasında hata oluştu: JSON parse hatası",
                "categories": [],
                "analyzed_at": datetime.utcnow().isoformat(),
                "error": str(e)
            }
        except Exception as e:
            return {
                "overall_score": 0,
                "summary": f"Analiz sırasında hata oluştu: {str(e)}",
                "categories": [],
                "analyzed_at": datetime.utcnow().isoformat(),
                "error": str(e)
            }


# Singleton instance
_interview_analyzer_service: Optional[InterviewAnalyzerService] = None


def get_interview_analyzer_service() -> InterviewAnalyzerService:
    """Get or create interview analyzer service instance"""
    global _interview_analyzer_service
    if _interview_analyzer_service is None:
        _interview_analyzer_service = InterviewAnalyzerService()
    return _interview_analyzer_service