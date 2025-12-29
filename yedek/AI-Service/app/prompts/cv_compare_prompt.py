"""
Simplified prompt for two-CV comparison.
Only asks AI for evaluation (strengths and suitable positions).
All data extraction is done from database.
"""
import json
from typing import Any, Dict, Optional


def get_cv_compare_prompt(
    candidate_a: Dict[str, Any],
    candidate_b: Dict[str, Any],
    job: Optional[Dict[str, Any]] = None,
    language: str = "turkish",
) -> str:
    """
    Simplified prompt: Only ask AI for evaluation (strengths and suitable positions).
    All data extraction (experience, skills, languages, education) is done from database.
    Supports Turkish and English language output.
    """
    name_a = candidate_a.get("name") or ("Candidate A" if language == "english" else "Aday A")
    name_b = candidate_b.get("name") or ("Candidate B" if language == "english" else "Aday B")
    
    pa = candidate_a.get("parsed_data") or {}
    pb = candidate_b.get("parsed_data") or {}

    if language == "english":
        # English prompt
        job_desc = ""
        if job:
            job_desc = f"\n\n**Position Information:**\n- Title: {job.get('title', 'N/A')}\n"
            if job.get("department"):
                job_desc += f"- Department: {job['department']}\n"
            if job.get("requirements_plain"):
                job_desc += f"- Requirements: {job['requirements_plain'][:300]}...\n"

        prompt = f"""You are comparing two software development candidates: **{name_a}** and **{name_b}**.

**IMPORTANT**: You will only provide EVALUATION. Years of experience, skill lists, language skills, and education information are already retrieved from the database.
You only need to provide for each candidate:
1. **Strengths**: The candidate's 3-5 standout qualities (in English, short sentences)
2. **Suitable Positions** (suitablePositions): Which positions the candidate is suitable for (in English, list)

{name_a} parsed_data:
```json
{json.dumps(pa, indent=2, ensure_ascii=False)}
```

{name_b} parsed_data:
```json
{json.dumps(pb, indent=2, ensure_ascii=False)}
```
{job_desc}

**Expected JSON Format:**
```json
{{
  "aiEvaluation": {{
    "candidateA": {{
      "strengths": [
        "Wide range of technical skills",
        "Strong English proficiency (C1)",
        "Project management experience"
      ],
      "suitablePositions": [
        "Senior Full-Stack Developer",
        "Technical Lead",
        "Project Manager"
      ]
    }},
    "candidateB": {{
      "strengths": [
        "Expert in frontend technologies",
        "UI/UX design skills",
        "Fast learner"
      ],
      "suitablePositions": [
        "Frontend Developer",
        "UI/UX Developer",
        "Web Developer"
      ]
    }}
  }}
}}
```

IMPORTANT:
- Return only JSON object, no additional explanation
- Write all text fields in **English**
- Use JSON keys in **English** as specified
- You can use candidate names in strengths
- Only provide evaluation and position recommendations
- Do not repeat skill, experience, language or education lists
"""
    else:
        # Turkish prompt (default)
        job_desc = ""
        if job:
            job_desc = f"\n\n**Pozisyon Bilgisi:**\n- Başlık: {job.get('title', 'N/A')}\n"
            if job.get("department"):
                job_desc += f"- Departman: {job['department']}\n"
            if job.get("requirements_plain"):
                job_desc += f"- Gereksinimler: {job['requirements_plain'][:300]}...\n"

        prompt = f"""İki yazılım geliştirme uzmanı adayını karşılaştırıyorsunuz: **{name_a}** ve **{name_b}**.

**ÖNEMLI**: Sadece DEĞERLENDIRME yapacaksınız. Deneyim yılı, yetenek listesi, dil bilgisi ve eğitim bilgileri zaten veritabanından alınıyor.
Sizden sadece her aday için:
1. **Güçlü Yönler** (strengths): Adayın öne çıkan 3-5 özelliği (Türkçe, kısa cümleler)
2. **Uygun Pozisyonlar** (suitablePositions): Adayın hangi pozisyonlar için uygun olduğu (Türkçe, liste)

{name_a} parsed_data:
```json
{json.dumps(pa, indent=2, ensure_ascii=False)}
```

{name_b} parsed_data:
```json
{json.dumps(pb, indent=2, ensure_ascii=False)}
```
{job_desc}

**Beklenen JSON Formatı:**
```json
{{
  "aiEvaluation": {{
    "candidateA": {{
      "strengths": [
        "Geniş teknik yetenek yelpazesi",
        "Güçlü İngilizce (C1)",
        "Proje yönetimi deneyimi"
      ],
      "suitablePositions": [
        "Senior Full-Stack Developer",
        "Technical Lead",
        "Project Manager"
      ]
    }},
    "candidateB": {{
      "strengths": [
        "Frontend teknolojilerinde uzman",
        "UI/UX tasarım becerisi",
        "Hızlı öğrenme yeteneği"
      ],
      "suitablePositions": [
        "Frontend Developer",
        "UI/UX Developer",
        "Web Developer"
      ]
    }}
  }}
}}
```

ÖNEMLİ:
- Sadece JSON objesi döndürün, başka açıklama eklemeyin
- Tüm metin alanlarını **Türkçe** yazın
- JSON anahtarlarını **İngilizce** olarak belirtildiği gibi kullanın
- Aday isimlerini güçlü yönlerde kullanabilirsiniz
- Sadece değerlendirme ve pozisyon önerisi yapın
- Yetenek, deneyim, dil veya eğitim listelerini tekrar yazmayın
"""
    return prompt
