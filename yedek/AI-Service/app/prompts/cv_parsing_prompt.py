"""
CV Parsing Prompts for OpenAI
System and user prompts for structured CV extraction
"""

SYSTEM_PROMPT = """Sen bir CV (özgeçmiş) analiz uzmanısın. Türkçe ve İngilizce CV'leri okuyup yapılandırılmış JSON formatında veri çıkarıyorsun.

Görevin:
- CV metninden kişisel bilgileri, eğitim geçmişini, iş deneyimini, becerileri çıkarmak
- Eksik veya belirsiz bilgiler için null döndürmek
- Tutarlı ve temiz veri üretmek

Önemli:
- Her zaman geçerli JSON döndür
- Tarihleri YYYY-MM formatında ver
- Toplam deneyimi yıl cinsinden hesapla
- Becerileri kategorize et (teknik/soft/dil/araç)"""


def get_user_prompt(cv_text: str) -> str:
    """
    Generate user prompt with CV text
    
    Args:
        cv_text: Extracted text from CV file
        
    Returns:
        Formatted user prompt
    """
    return f"""Aşağıdaki CV metnini analiz et ve JSON formatında döndür:

CV METNİ:
{cv_text}

JSON ŞEMASI:
{{
  "language": "string (CV'nin dili: 'TR' Türkçe, 'EN' İngilizce, 'DE' Almanca, vb. ISO 639-1 kodları)",
  "personal": {{
    "name": "string veya null",
    "email": "string veya null",
    "phone": "string veya null (XXX XXX XXXX formatında normalize et)",
    "location": "string veya null (şehir/ülke)",
    "linkedin": "string veya null"
  }},
  "summary": "string veya null (özet/hakkımda/profil bölümü)",
  "education": [
    {{
      "degree": "string (Lisans/Yüksek Lisans/Doktora/Ön Lisans)",
      "field": "string (bölüm/alan)",
      "institution": "string (üniversite/okul adı)",
      "graduation_year": "int veya null",
      "gpa": "float veya null"
    }}
  ],
  "experience": [
    {{
      "title": "string (pozisyon/ünvan)",
      "company": "string (şirket adı)",
      "start_date": "string (YYYY-MM formatında veya null)",
      "end_date": "string (YYYY-MM formatında veya 'present' veya null)",
      "description": "string (görev ve sorumluluklar)",
      "duration_months": "int (ay cinsinden veya null)"
    }}
  ],
  "skills": {{
    "technical": ["string (programlama dilleri, teknolojiler)"],
    "soft": ["string (liderlik, iletişim, vb)"],
    "languages": [
      {{
        "language": "string",
        "level": "string (Native/Fluent/Advanced/Intermediate/Basic)"
      }}
    ],
    "tools": ["string (yazılımlar, platformlar)"]
  }},
  "certifications": ["string (sertifika adları ve tarihleri)"],
  "projects": [
    {{
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }}
  ],
  "total_experience_years": "float (toplam iş deneyimi yıl cinsinden)"
}}

KURALLAR:
1. CV'nin dilini tespit et ve language field'ına yaz (TR, EN, DE, FR, vb.)
2. Telefon numarasını XXX XXX XXXX formatına normalize et (örn: "5321234567" → "532 123 4567")
3. Bulunamayan alanlar için null döndür, boş string değil
4. Tarihleri YYYY-MM formatına çevir (örn: "Ocak 2020" → "2020-01")
5. Hala çalışıyorsa end_date: "present" yaz
6. duration_months'u start_date ve end_date'den hesapla
7. total_experience_years'ı tüm deneyimlerin toplamından hesapla
8. Becerileri doğru kategorilere yerleştir
9. Sadece JSON döndür, başka açıklama ekleme
10. Türkçe karakterleri koru (ı, ş, ğ, ü, ö, ç, İ)"""
