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
        notes_section = f"**EK NOTLAR (Kullanıcının Sağladığı İçerik):**\n{additional_notes}\n"
    
    return f"""Sen profesyonel bir İnsan Kaynakları uzmanısın. Verilen bilgilere dayanarak kapsamlı ve çekici bir iş ilanı oluştur.

**POZISYON BİLGİLERİ:**
- Pozisyon: {position}
- Departman: {department or "Belirtilmemiş"}
- Lokasyon: {location or "Belirtilmemiş"}
- Çalışma Şekli: {employment_type}
- Deneyim Seviyesi: {experience_level}
- Gerekli Yetenekler: {skills_str}
- Dil Gereksinimleri: {languages_str}

{notes_section}
**GÖREV:**
Yukarıdaki bilgilere dayanarak profesyonel bir iş ilanı oluştur. İlan şu bölümlerden oluşmalı:

1. **İş Tanımı (description):**
   - MUTLAKA karma format kullan: Giriş paragrafı + madde işaretli görevler + kapanış paragrafı
   - İlk önce pozisyonu tanıtan 1-2 paragraf (<p> etiketi ile)
   - Ardından görevler ve sorumluluklar için MUTLAKA madde işaretli liste (<ul><li> ile)
   - Son olarak pozisyonun önemini vurgulayan kapanış paragrafı
   - EK NOTLARDA madde işaretli içerik varsa, bu formatı KORU ve geliştir
   - Düz metin paragrafları sıkıcı ve okunması zordur - KAÇIN!

   ÖRNEK YAPI:
   <p>Giriş paragrafı - pozisyon hakkında genel bilgi...</p>
   <p><strong>Temel Sorumluluklar:</strong></p>
   <ul>
     <li>Görev 1</li>
     <li>Görev 2</li>
     <li>Görev 3</li>
   </ul>
   <p>Kapanış paragrafı...</p>

2. **Aranan Nitelikler (requirements):**
   - Zorunlu yetenek ve deneyimler
   - Tercih edilen yetenek ve sertifikalar
   - Kişisel özellikler ve soft skills
   - HTML formatında (<ul><li> listesi)
   - Minimum 8-10 madde
   - Net ve ölçülebilir kriterler

3. **Anahtar Kelimeler (keywords):**
   - İlanla ilgili teknik terimler ve teknolojiler
   - 10-15 adet anahtar kelime
   - Array formatında

4. **Tercih Edilen Bölümler (preferred_majors):**
   - İlgili üniversite bölümleri
   - Virgülle ayrılmış string

5. **Gerekli Diller (required_languages):**
   - Pozisyon için gerekli diller ve seviyeleri
   - JSON format: {{"Türkçe": "Anadil", "İngilizce": "İş Seviyesi"}}
   - Seviyeler: Anadil, İş Seviyesi, İleri, Orta, Temel
   - UYARI: Eğer kullanıcı dil belirtmişse ({languages_str}), SADECE bu dilleri kullan. Kendi başına dil ekleme!
   - Eğer kullanıcı dil belirtmemişse, pozisyona uygun dilleri öner.

6. **Başlangıç Tarihi (start_date):**
   - "immediate" (Hemen), "1month" (1 Ay İçinde), "3months" (3 Ay İçinde), veya "flexible" (Esnek)

**ÖNEMLİ KURALLAR:**
- Tüm metinler Türkçe olmalı
- HTML formatında description ve requirements oluştur
- description_plain ve requirements_plain için düz metin versiyonları da ekle
- Gerçekçi ve sektör standartlarına uygun olmalı
- Pozisyona özel ve detaylı olmalı
- Kopyala-yapıştır gibiymiş gibi görünmemeli, özgün olmalı
- **KRİTİK:** İş tanımında ASLA sadece düz paragraflar kullanma! Görevler ve sorumluluklar için MUTLAKA madde işaretli liste kullan!
- **KRİTİK:** Ek notlarda madde işaretli içerik varsa, bu yapıyı koru ve profesyonelce geliştir!

**ÇIKTI FORMATI:**
Sadece JSON formatında yanıt ver, başka açıklama ekleme:

{{
  "title": "{position}",
  "description": "<p>Giriş paragrafı...</p><p><strong>Temel Sorumluluklar:</strong></p><ul><li>Görev 1</li><li>Görev 2</li></ul><p>Kapanış...</p>",
  "description_plain": "Düz metin versiyonu iş tanımı...",
  "requirements": "<ul><li>İlk gereksinim</li><li>İkinci gereksinim</li>...</ul>",
  "requirements_plain": "Düz metin versiyonu gereksinimler...",
  "keywords": ["Python", "Django", "PostgreSQL", ...],
  "preferred_majors": "Bilgisayar Mühendisliği, Yazılım Mühendisliği",
  "required_languages": {{"Türkçe": "Anadil", "İngilizce": "İş Seviyesi"}},
  "start_date": "immediate"
}}

Şimdi bu bilgilere dayanarak profesyonel bir iş ilanı oluştur."""


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
        notes_section = f"**ADDITIONAL NOTES (User-Provided Content):**\n{additional_notes}\n"
    
    return f"""You are a professional Human Resources specialist. Create a comprehensive and attractive job posting based on the given information.

**POSITION INFORMATION:**
- Position: {position}
- Department: {department or "Not specified"}
- Location: {location or "Not specified"}
- Employment Type: {employment_type}
- Experience Level: {experience_level}
- Required Skills: {skills_str}
- Language Requirements: {languages_str}

{notes_section}
**TASK:**
Based on the above information, create a professional job posting. The posting should consist of these sections:

1. **Job Description (description):**
   - MUST use mixed format: Introduction paragraph + bulleted tasks + closing paragraph
   - Start with 1-2 paragraphs introducing the position (<p> tags)
   - Then MUST include a bulleted list for duties and responsibilities (<ul><li>)
   - End with a closing paragraph highlighting the importance of the role
   - If ADDITIONAL NOTES contain bulleted content, PRESERVE this format and enhance it
   - Plain text paragraphs only are boring and hard to read - AVOID!

   EXAMPLE STRUCTURE:
   <p>Introduction paragraph - general info about the position...</p>
   <p><strong>Key Responsibilities:</strong></p>
   <ul>
     <li>Task 1</li>
     <li>Task 2</li>
     <li>Task 3</li>
   </ul>
   <p>Closing paragraph...</p>

2. **Requirements (requirements):**
   - Mandatory skills and experience
   - Preferred skills and certifications
   - Personal qualities and soft skills
   - HTML format (<ul><li> list)
   - Minimum 8-10 items
   - Clear and measurable criteria

3. **Keywords (keywords):**
   - Technical terms and technologies related to the position
   - 10-15 keywords
   - Array format

4. **Preferred Majors (preferred_majors):**
   - Relevant university degrees/majors
   - Comma-separated string

5. **Required Languages (required_languages):**
   - Languages required for the position and their proficiency levels
   - JSON format: {{"Turkish": "Native", "English": "Business"}}
   - Levels: Native, Business, Advanced, Intermediate, Basic
   - WARNING: If user specified languages ({languages_str}), use ONLY those languages. Do NOT add languages on your own!
   - If user did not specify languages, suggest appropriate languages for the position.

6. **Start Date (start_date):**
   - "immediate", "1month", "3months", or "flexible"

**IMPORTANT RULES:**
- All texts must be in English
- Create description and requirements in HTML format
- Also include plain text versions (description_plain and requirements_plain)
- Must be realistic and comply with industry standards
- Should be position-specific and detailed
- Should not look like copy-paste, must be original
- **CRITICAL:** NEVER use only plain paragraphs in job description! MUST use bulleted lists for tasks and responsibilities!
- **CRITICAL:** If additional notes contain bulleted content, preserve this structure and enhance it professionally!

**OUTPUT FORMAT:**
Respond only in JSON format, no additional explanation:

{{
  "title": "{position}",
  "description": "<p>Introduction paragraph...</p><p><strong>Key Responsibilities:</strong></p><ul><li>Task 1</li><li>Task 2</li></ul><p>Closing...</p>",
  "description_plain": "Plain text version of job description...",
  "requirements": "<ul><li>First requirement</li><li>Second requirement</li>...</ul>",
  "requirements_plain": "Plain text version of requirements...",
  "keywords": ["Python", "Django", "PostgreSQL", ...],
  "preferred_majors": "Computer Engineering, Software Engineering",
  "required_languages": {{"Turkish": "Native", "English": "Business"}},
  "start_date": "immediate"
}}

Now create a professional job posting based on this information."""
