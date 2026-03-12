"""
CV Parsing Prompts for OpenAI
System and user prompts for structured CV extraction
Enhanced with CV validation, LinkedIn detection, and KVKK anonymization support
"""

SYSTEM_PROMPT = """You are an expert CV/Resume parser and validator. You analyze CVs in any language (Turkish, English, German, etc.) and extract structured data in JSON format.

Your responsibilities:
1. FIRST: Validate if the document is actually a CV/Resume
2. Extract personal information, education, work experience, and skills
3. Return null for missing or unclear information
4. Produce consistent, clean, and normalized data

Critical rules:
- Always return valid JSON
- Use YYYY-MM format for dates
- Calculate total experience in years
- Categorize skills properly (technical/soft/language/tools)
- Detect and extract LinkedIn URLs in any format
- Preserve special characters (Turkish: ı, ş, ğ, ü, ö, ç, İ)

IMPORTANT - Privacy Placeholders:
- The document may contain privacy placeholders like [NAME_1], [EMAIL_1], [PHONE_1], [LINKEDIN_1], [GITHUB_1], [URL_1], [TC_KIMLIK_1], [BIRTH_DATE_1]
- These are intentional anonymization tokens for data privacy (KVKK compliance)
- Preserve these placeholders EXACTLY as they appear in your output
- Do NOT try to guess or generate real values for these placeholders
- Treat placeholders as valid values for their respective fields"""


def get_user_prompt(cv_text: str) -> str:
    """
    Generate user prompt with CV text
    
    Args:
        cv_text: Extracted (and anonymized) CV text
        
    Returns:
        Formatted user prompt
    """
    return f"""Analyze the following document and return JSON:

DOCUMENT TEXT:
{cv_text}

JSON SCHEMA:
{{
  "is_valid_cv": {{
    "valid": "boolean (true if this is a CV/Resume, false otherwise)",
    "confidence": "float (0.0-1.0, how confident you are)",
    "reason": "string or null (if invalid, explain why: 'not_a_cv', 'empty_content', 'unreadable', 'insufficient_info')"
  }},
  "language": "string (document language: 'TR', 'EN', 'DE', 'FR', etc. ISO 639-1 codes)",
  "personal": {{
    "name": "string or null (full name — may be a [NAME_x] placeholder)",
    "email": "string or null (email — may be an [EMAIL_x] placeholder)",
    "phone": "string or null (phone — may be a [PHONE_x] placeholder)",
    "location": "string or null (city, country or both)",
    "linkedin": "string or null (LinkedIn URL — may be a [LINKEDIN_x] placeholder)",
    "github": "string or null (GitHub URL — may be a [GITHUB_x] placeholder)",
    "portfolio": "string or null (personal website — may be a [URL_x] placeholder)",
    "birth_year": "int or null (4-digit year if found)"
  }},
  "summary": "string or null (profile summary/about me/objective section)",
  "education": [
    {{
      "degree": "string (Bachelor/Master/PhD/Associate/High School)",
      "field": "string (major/field of study)",
      "institution": "string (university/school name)",
      "graduation_year": "int or null",
      "gpa": "float or null (normalize to 4.0 scale if possible)"
    }}
  ],
  "experience": [
    {{
      "title": "string (job title/position)",
      "company": "string (company name)",
      "start_date": "string (YYYY-MM format or null)",
      "end_date": "string (YYYY-MM format, 'present' if current, or null)",
      "description": "string (responsibilities and achievements)",
      "duration_months": "int (calculated months, or null)"
    }}
  ],
  "skills": {{
    "technical": ["string (programming languages, frameworks, technologies)"],
    "soft": ["string (leadership, communication, problem-solving, etc)"],
    "languages": [
      {{
        "language": "string (language name)",
        "level": "string (Native/Fluent/Advanced/Intermediate/Basic)"
      }}
    ],
    "tools": ["string (software, platforms, IDEs)"]
  }},
  "certifications": [
    {{
      "name": "string (certification name)",
      "issuer": "string or null (issuing organization)",
      "date": "string or null (YYYY-MM or YYYY)",
      "credential_id": "string or null"
    }}
  ],
  "projects": [
    {{
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null"
    }}
  ],
  "total_experience_years": "float (total work experience in years, calculated from all positions)"
}}

VALIDATION RULES:
1. A valid CV typically contains: name or [NAME_x] placeholder, contact info (email/phone or their placeholders), AND either education OR work experience
2. If the document lacks these basic elements, set is_valid_cv.valid = false
3. Examples of INVALID documents: invoices, letters, articles, random text, contracts, forms
4. Documents with [NAME_x], [EMAIL_x] placeholders ARE valid CVs — these are privacy-masked fields

EXTRACTION RULES:
1. Detect document language and set the 'language' field (TR, EN, DE, FR, etc.)
2. Phone number normalization:
   - If phone is a placeholder like [PHONE_1], keep it as-is
   - Turkish: +90 5XX XXX XXXX (e.g., "05321234567" → "+90 532 123 4567")
   - International: keep country code, format as +XX XXX XXX XXXX
3. LinkedIn URL detection - look for:
   - [LINKEDIN_x] placeholders — use as-is
   - linkedin.com/in/username
   - linkedin.com/pub/username
   - Just "linkedin.com/username"
   - Text like "LinkedIn: username" → convert to full URL
4. Return null for missing fields, never empty strings
5. Convert dates to YYYY-MM format:
   - "January 2020" or "Ocak 2020" → "2020-01"
   - "2020" alone → "2020-01" (assume January)
6. For current positions: end_date = "present"
7. Calculate duration_months from start_date to end_date (or current date if present)
8. Calculate total_experience_years by summing all experience durations
9. Categorize skills accurately:
   - technical: Python, JavaScript, SQL, AWS, Docker, etc.
   - soft: Leadership, Communication, Team Management, etc.
   - tools: VS Code, Jira, Figma, Excel, SAP, etc.
   - languages: Turkish, English, German with proficiency levels
10. Return ONLY the JSON object, no explanations or markdown
11. PRESERVE all [PLACEHOLDER] tokens exactly — do not modify, translate, or expand them"""
