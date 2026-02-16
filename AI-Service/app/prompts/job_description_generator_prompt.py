"""
Job Description Generator Prompt
Creates professional job postings using AI based on basic input parameters.
"""

def get_job_description_generator_prompt(
    position: str,
    department: str = None,
    location: str = None,
    employment_type: str = "full_time",
    experience_level: str = None,
    required_skills: list = None,
    required_languages: list = None,
    additional_notes: str = None,
    language: str = "turkish"
) -> str:
    """
    Generate prompt for AI-powered job description creation.
    
    Args:
        position: Job title/position name
        department: Department name (optional)
        location: City/location (Ankara, İstanbul, İzmir, etc.)
        employment_type: full_time, part_time, contract, intern
        experience_level: entry, junior, mid, senior, lead
        required_skills: List of required skills/technologies
        required_languages: List of language requirements with levels
        additional_notes: Additional requirements or highlights
        language: "turkish" or "english"
    
    Returns:
        Formatted prompt string for OpenAI
    """
    
    required_skills = required_skills or []
    required_languages = required_languages or []
    skills_str = ", ".join(required_skills) if required_skills else "Belirtilmemiş"
    
    # Format languages
    if required_languages:
        languages_str = ", ".join([f"{lang['name']} ({lang['level']})" for lang in required_languages])
    else:
        languages_str = "Belirtilmemiş"
    
    # Employment type mapping
    employment_type_map = {
        "full-time": "Tam Zamanlı",
        "part-time": "Yarı Zamanlı", 
        "contract": "Sözleşmeli",
        "internship": "Stajyer"
    }
    
    employment_type_en_map = {
        "full-time": "Full-time",
        "part-time": "Part-time",
        "contract": "Contract",
        "internship": "Internship"
    }
    
    # Experience level mapping
    experience_map = {
        "entry": "Giriş Seviyesi (0-1 yıl)",
        "junior": "Junior (0-2 yıl)",
        "mid": "Mid-Level (2-5 yıl)",
        "senior": "Senior (5+ yıl)",
        "lead": "Lead/Manager (8+ yıl)"
    }
    
    experience_en_map = {
        "entry": "Entry Level (0-1 years)",
        "junior": "Junior (0-2 years)",
        "mid": "Mid-Level (2-5 years)",
        "senior": "Senior (5+ years)",
        "lead": "Lead/Manager (8+ years)"
    }
    
    if language == "english":
        return _get_english_prompt(
            position=position,
            department=department,
            location=location,
            employment_type=employment_type_en_map.get(employment_type, "Full-time"),
            experience_level=experience_en_map.get(experience_level, "Not specified") if experience_level else "Not specified",
            skills_str=skills_str,
            languages_str=languages_str,
            additional_notes=additional_notes
        )
    else:  # turkish (default)
        return _get_turkish_prompt(
            position=position,
            department=department,
            location=location,
            employment_type=employment_type_map.get(employment_type, "Tam Zamanlı"),
            experience_level=experience_map.get(experience_level, "Belirtilmemiş") if experience_level else "Belirtilmemiş",
            skills_str=skills_str,
            languages_str=languages_str,
            additional_notes=additional_notes
        )


def _get_turkish_prompt(
    position: str,
    department: str,
    location: str,
    employment_type: str,
    experience_level: str,
    skills_str: str,
    languages_str: str,
    additional_notes: str
) -> str:
    """Generate Turkish language prompt."""
    
    # Build additional notes section separately to avoid f-string backslash issue
    notes_section = ""
    if additional_notes:
        notes_section = f"EK NOTLAR:\n{additional_notes}\n"
    
    # Build domain context from skills - skills define the REAL domain of the job
    domain_context = ""
    if skills_str and skills_str != "Belirtilmemiş":
        domain_context = f"""
ÖNEMLİ - ALAN BELİRLEYİCİ BİLGİ:
Kullanıcı şu yetkinlikleri/becerileri belirtti: {skills_str}
Bu beceriler ilanın GERÇEK ALANINI ve SEKTÖRÜNÜ belirler!
İş tanımı, sorumluluklar, aranan nitelikler ve anahtar kelimeler 
bu becerilerin belirttiği ALANA/SEKTÖRE ÖZGÜ olmalıdır.

Örnek: Pozisyon "Satış Temsilcisi", Beceri "Makine Satış Temsilcisi" ise
→ İlan makine satışı alanına özgü olmalı (makine bilgisi, teknik satış, endüstriyel müşteriler vb.)
→ Genel satış ilanı DEĞİL, makine sektörüne özel satış ilanı!
"""
    
    return f""""{position}" pozisyonu için bir iş ilanı oluştur.

İLAN BAŞLIĞI: {position}

Departman: {department or "Belirtilmemiş"} (organizasyonel bilgi, içeriği belirlemez)
Lokasyon: {location or "Belirtilmemiş"}
Çalışma Şekli: {employment_type}
Deneyim Seviyesi: {experience_level}
Aranan Yetkinlikler/Beceriler: {skills_str}
Dil Gereksinimleri: {languages_str}
{domain_context}
{notes_section}

Aşağıdaki JSON formatında yanıt ver:

{{
  "title": "{position}",
  "description": "İŞ TANIMI (HTML)",
  "description_plain": "İŞ TANIMI (düz metin)",
  "requirements": "ARANAN NİTELİKLER (HTML)",
  "requirements_plain": "ARANAN NİTELİKLER (düz metin)",
  "keywords": ["anahtar kelimeler"],
  "preferred_majors": "üniversite bölümleri",
  "required_languages": {{"dil": "seviye"}},
  "start_date": "immediate|1month|3months|flexible"
}}

TALİMATLAR:

1. title: TAM OLARAK "{position}" yaz.

2. description (İş Tanımı - HTML):
   - Format: <p>giriş</p><p><strong>Temel Sorumluluklar:</strong></p><ul><li>görev</li></ul><p>kapanış</p>
   - MUTLAKA madde işaretli liste kullan
   - Eğer yetkinlikler ({skills_str}) bir SEKTÖR veya ALAN belirtiyorsa, 
     TÜM görevler ve sorumluluklar o alana ÖZGÜ olmalı!
   - Genel/jenerik görevler yazma, SEKTÖRE ÖZEL görevler yaz!

3. requirements (Aranan Nitelikler - HTML):
   - <ul><li> formatında minimum 8-10 madde
   - Yetkinliklerin ({skills_str}) belirttiği alana ÖZGÜ teknik nitelikler dahil et
   - Genel niteliklerin yanı sıra SEKTÖRE ÖZEL tecrübe ve bilgi iste

4. keywords: 10-15 adet
   - Yetkinliklerde ({skills_str}) geçen terimleri MUTLAKA dahil et
   - Alana/sektöre özgü teknik terimler ekle

5. required_languages:
   - Kullanıcı dil belirttiyse ({languages_str}): SADECE bunları kullan
   - Belirtmediyse: pozisyona uygun öner
   - Seviyeler: Anadil, İş Seviyesi, İleri, Orta, Temel

6. start_date: "immediate", "1month", "3months" veya "flexible"

KURALLAR:
- TÜM çıktı TÜRKÇE olmalı
- title DAİMA "{position}" olmalı
- Yetkinlikler ({skills_str}) ilanın ALANINI/SEKTÖRÜNÜ belirler — buna göre içerik üret!
- Ek notlardaki madde işaretli yapıyı koru
- Sadece JSON döndür"""


def _get_english_prompt(
    position: str,
    department: str,
    location: str,
    employment_type: str,
    experience_level: str,
    skills_str: str,
    languages_str: str,
    additional_notes: str
) -> str:
    """Generate English language prompt."""
    
    # Build additional notes section separately to avoid f-string backslash issue
    notes_section = ""
    if additional_notes:
        notes_section = f"ADDITIONAL NOTES:\n{additional_notes}\n"
    
    # Build domain context from skills
    domain_context = ""
    if skills_str and skills_str != "Belirtilmemiş":
        domain_context = f"""
IMPORTANT - DOMAIN DEFINING INFORMATION:
The user specified these competencies/skills: {skills_str}
These skills define the REAL DOMAIN and INDUSTRY of the job!
Job description, responsibilities, requirements, and keywords 
MUST be SPECIFIC to the domain/industry indicated by these skills.

Example: Position "Sales Representative", Skill "Machine Sales Representative"
→ The posting should be specific to machine/equipment sales (technical knowledge, industrial clients, etc.)
→ NOT a generic sales posting, but an INDUSTRY-SPECIFIC sales posting!
"""
    
    return f"""Create a job posting for: "{position}"

JOB TITLE: {position}

Department: {department or "Not specified"} (organizational info, does not affect content)
Location: {location or "Not specified"}
Employment Type: {employment_type}
Experience Level: {experience_level}
Required Competencies/Skills: {skills_str}
Language Requirements: {languages_str}
{domain_context}
{notes_section}

Respond in JSON format:

{{
  "title": "{position}",
  "description": "JOB DESCRIPTION (HTML)",
  "description_plain": "JOB DESCRIPTION (plain text)",
  "requirements": "REQUIREMENTS (HTML)",
  "requirements_plain": "REQUIREMENTS (plain text)",
  "keywords": ["keywords"],
  "preferred_majors": "university majors",
  "required_languages": {{"language": "level"}},
  "start_date": "immediate|1month|3months|flexible"
}}

INSTRUCTIONS:

1. title: Write EXACTLY "{position}".

2. description (HTML):
   - Format: <p>intro</p><p><strong>Key Responsibilities:</strong></p><ul><li>task</li></ul><p>closing</p>
   - MUST use bulleted lists
   - If competencies ({skills_str}) indicate a DOMAIN or INDUSTRY,
     ALL tasks and responsibilities MUST be specific to that domain!
   - Do NOT write generic tasks, write DOMAIN-SPECIFIC tasks!

3. requirements (HTML):
   - <ul><li> format, minimum 8-10 items
   - Include technical requirements SPECIFIC to the domain indicated by ({skills_str})
   - Include INDUSTRY-SPECIFIC experience alongside general qualifications

4. keywords: 10-15 items
   - MUST include terms from competencies ({skills_str})
   - Add domain/industry-specific technical terms

5. required_languages:
   - If user specified ({languages_str}): use ONLY those
   - If not: suggest appropriate ones
   - Levels: Native, Business, Advanced, Intermediate, Basic

6. start_date: "immediate", "1month", "3months", or "flexible"

RULES:
- ALL output MUST be in ENGLISH
- title MUST be "{position}"
- Competencies ({skills_str}) define the job's DOMAIN — generate content accordingly!
- Preserve bulleted structure from additional notes
- Return ONLY JSON"""
