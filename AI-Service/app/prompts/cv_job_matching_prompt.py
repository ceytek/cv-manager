"""
CV to Job Matching Prompt
Analyzes candidate CV against job requirements and provides detailed scoring.
"""

def get_cv_job_matching_prompt(job_data: dict, candidate_data: dict, language: str = "turkish") -> str:
    """
    Generate prompt for CV-to-Job matching analysis.
    
    Args:
        job_data: Dict containing job title, description, requirements, etc.
        candidate_data: Dict containing parsed CV data (personal info, experience, education, skills)
        language: Language for AI output ("english" or "turkish")
    
    Returns:
        Formatted prompt string for OpenAI
    """
    
    # Choose language-specific instructions
    if language == "english":
        language_instructions = """**ANALYSIS INSTRUCTIONS (LANGUAGE):**

- All narrative/free-text outputs MUST be written in English. Examples: summary, strengths, weaknesses,
  and all *reasoning* fields inside breakdown. Keep JSON keys and enum values (e.g., recommendation, status) in English
  exactly as specified below."""
        
        summary_field_description = '"summary": "<English: 2-3 sentence summary of the candidate\'s fit for this role>"'
    else:  # turkish (default)
        language_instructions = """**ANALYSIS INSTRUCTIONS (LANGUAGE):**

- All narrative/free-text outputs MUST be written in Turkish (Türkçe). Examples: summary, strengths, weaknesses,
  and all *reasoning* fields inside breakdown. Keep JSON keys and enum values (e.g., recommendation, status) in English
  exactly as specified below."""
        
        summary_field_description = '"summary": "<Türkçe: bu rol için adayın uygunluğuna dair 2-3 cümle özet>"'
    
    prompt = f"""You are an expert HR analyst and recruiter. Analyze the candidate's CV against the job requirements and provide a detailed matching score.

**JOB INFORMATION:**
Title: {job_data.get('title', 'N/A')}
Department: {job_data.get('department', 'N/A')}
Location: {job_data.get('location', 'N/A')}
Employment Type: {job_data.get('employment_type', 'N/A')}
Experience Level Required: {job_data.get('experience_level', 'N/A')}
Required Education: {job_data.get('required_education', 'N/A')}
Preferred Majors: {', '.join(job_data.get('preferred_majors', [])) if isinstance(job_data.get('preferred_majors'), list) else (job_data.get('preferred_majors') if job_data.get('preferred_majors') else 'N/A')}
Required Languages: {', '.join([f"{lang}: {level}" for lang, level in job_data.get('required_languages', {}).items()]) if isinstance(job_data.get('required_languages'), dict) else (job_data.get('required_languages') if job_data.get('required_languages') else 'N/A')}

**Job Description:**
{job_data.get('description_plain', job_data.get('description', 'N/A'))}

**Job Requirements:**
{job_data.get('requirements_plain', job_data.get('requirements', 'N/A'))}

**Keywords/Skills Required:**
{', '.join(job_data.get('keywords', [])) if isinstance(job_data.get('keywords'), list) and job_data.get('keywords') else (str(job_data.get('keywords')) if job_data.get('keywords') else 'N/A')}

---

**CANDIDATE CV INFORMATION:**
Name: {candidate_data.get('name', 'N/A')}
Email: {candidate_data.get('email', 'N/A')}
Phone: {candidate_data.get('phone', 'N/A')}
CV Language: {candidate_data.get('cv_language', 'N/A')}

**Parsed CV Data:**
{format_parsed_data(candidate_data.get('parsed_data', {}))}

---

{language_instructions}

**ANALYSIS INSTRUCTIONS:**

Analyze the candidate's qualifications against the job requirements and provide a comprehensive evaluation. Consider the following criteria:

1. **Experience Match (30 points):**
   - Years of relevant experience
   - Industry alignment
   - Role progression and responsibilities
   - Relevant project experience

2. **Education Match (20 points):**
   - Degree level vs. required education
   - Field of study relevance
   - Academic achievements
   - Certifications

3. **Skills Match (30 points):**
   - Technical skills alignment with job keywords
   - Proficiency levels
   - Relevant tools and technologies
   - Soft skills

4. **Language Requirements (10 points):**
    - Compare each required language (job.required_languages) with CV languages and their levels
    - Consider level sufficiency: Native > Fluent > Advanced > Intermediate > Basic (CEFR mapping: C2≈Native, C1≈Fluent, B2≈Advanced, B1≈Intermediate, A2/A1≈Basic)
    - Score should reflect both coverage (presence) and sufficiency (meets or exceeds required level)
    - Additional languages beyond requirements may add up to +1 bonus within this 10-point cap
    
    **CRITICAL - Turkish Language Native Speaker Rule (MUST APPLY):**
    - CHECK THE "CV Language" FIELD ABOVE. If cv_language = "TR":
      → This means the CV content is written in Turkish
      → The candidate is a NATIVE TURKISH SPEAKER (their mother tongue is Turkish)
      → For Turkish language requirement: candidate_level = "Native", status = "exceeds"
      → DO NOT mark Turkish as "missing" - it is IMPOSSIBLE for a Turkish CV writer to not know Turkish
      → Give FULL POINTS for Turkish language requirement
    - ONLY check Turkish from CV's language section if cv_language = "EN" (English CV)

5. **Overall Fit (10 points):**
   - Career trajectory alignment
    - Location compatibility (use the Location Match guidance below to inform this, but keep total weights within 100)
   - Cultural/department fit indicators
   - Motivation indicators from CV

6. **Location Match (auxiliary, report + guide fit):**
    - Normalize Turkish city names for both job.location and candidate.personal.location when available.
    - Estimate distance using city centers and classify proximity:
      - exact: same city or ≤ 30 km
      - near: 31–120 km
      - moderate: 121–300 km
      - far: > 300 km
    - Compute an auxiliary location_score on a 0–10 scale: exact=10, near=8, moderate=4, far=0.
    - Use this insight to justify the fit_score, but do NOT increase total points beyond 100.

**OUTPUT FORMAT:**
Respond with a valid JSON object with the following structure:

{{
  "overall_score": <integer 0-100>,
  "recommendation": "<one of: highly_recommended, recommended, maybe, not_recommended>",
  "breakdown": {{
    "experience_score": <integer 0-30>,
    "experience_reasoning": "<brief explanation>",
    "education_score": <integer 0-20>,
    "education_reasoning": "<brief explanation>",
    "skills_score": <integer 0-30>,
    "skills_reasoning": "<brief explanation>",
    "language_score": <integer 0-10>,
    "language_reasoning": "<brief explanation>",
        "location_score": <integer 0-10>,
        "location_reasoning": "<brief explanation of proximity impact>",
    "fit_score": <integer 0-10>,
    "fit_reasoning": "<brief explanation>"
  }},
    "language_matches": [
        {{"language": "English", "required_level": "Fluent", "candidate_level": "Advanced", "status": "meets"}},
        {{"language": "Turkish", "required_level": "Native", "candidate_level": "Native", "status": "exceeds"}}
    ],
    "location_match": {{"job_city": "istanbul", "candidate_city": "kocaeli", "distance_km": 35.2, "category": "near"}},
  "matched_skills": [<list of skills from CV that match job requirements>],
  "missing_skills": [<list of required skills not found in CV>],
  "additional_skills": [<list of bonus skills candidate has that weren't required>],
  "strengths": [<list of 3-5 key strengths>],
  "weaknesses": [<list of 2-3 areas of concern>],
    {summary_field_description}
}}

**IMPORTANT:**
- Be objective and fair in scoring
- Base scores on concrete evidence from the CV
- Consider both hard skills and soft skills
- Take into account career progression and growth potential
- Provide actionable insights in strengths and weaknesses
- Ensure all scores add up to the overall_score
- The overall_score should equal the sum of: experience_score + education_score + skills_score + language_score + fit_score (location_score is auxiliary and should not increase the total beyond 100)
- **TURKISH NATIVE SPEAKER RULE**: If "CV Language: TR" appears above, the candidate is a native Turkish speaker. For any Turkish language requirement, set candidate_level="Native" and status="exceeds". NEVER mark Turkish as "missing" for a Turkish CV.
- Return ONLY the JSON object, no additional text"""

    return prompt


def format_parsed_data(parsed_data: dict) -> str:
    """Format parsed CV data for prompt inclusion."""
    
    if not parsed_data:
        return "No structured data available"
    
    sections = []
    
    # Personal Info
    if parsed_data.get('personal'):
        personal = parsed_data['personal']
        sections.append(f"""**Personal Information:**
- Location: {personal.get('location', 'N/A')}
- LinkedIn: {personal.get('linkedin', 'N/A')}
- GitHub: {personal.get('github', 'N/A')}
- Website: {personal.get('website', 'N/A')}""")
    
    # Summary
    if parsed_data.get('summary'):
        sections.append(f"""**Professional Summary:**
{parsed_data['summary']}""")
    
    # Experience
    if parsed_data.get('experience'):
        exp_text = "**Work Experience:**\n"
        experiences = parsed_data['experience'] if isinstance(parsed_data['experience'], list) else [parsed_data['experience']]
        for i, exp in enumerate(experiences, 1):
            if isinstance(exp, dict):
                exp_text += f"\n{i}. {exp.get('title', 'N/A')} at {exp.get('company', 'N/A')}\n"
                exp_text += f"   Period: {exp.get('start_date', 'N/A')} - {exp.get('end_date', 'Present')}\n"
                if exp.get('description'):
                    exp_text += f"   Description: {exp['description']}\n"
            else:
                exp_text += f"\n{i}. {str(exp)}\n"
        sections.append(exp_text)
    
    # Education
    if parsed_data.get('education'):
        edu_text = "**Education:**\n"
        educations = parsed_data['education'] if isinstance(parsed_data['education'], list) else [parsed_data['education']]
        for i, edu in enumerate(educations, 1):
            if isinstance(edu, dict):
                edu_text += f"\n{i}. {edu.get('degree', 'N/A')} in {edu.get('field', 'N/A')}\n"
                edu_text += f"   Institution: {edu.get('institution', 'N/A')}\n"
                edu_text += f"   Year: {edu.get('graduation_year', 'N/A')}\n"
                if edu.get('gpa'):
                    edu_text += f"   GPA: {edu['gpa']}\n"
            else:
                edu_text += f"\n{i}. {str(edu)}\n"
        sections.append(edu_text)
    
    # Skills
    if parsed_data.get('skills'):
        skills = parsed_data['skills']
        skills_text = "**Skills:**\n"
        
        if skills.get('technical'):
            # Safely convert to strings
            tech_skills = [str(s) for s in skills['technical']] if isinstance(skills['technical'], list) else [str(skills['technical'])]
            skills_text += f"- Technical: {', '.join(tech_skills)}\n"
        if skills.get('languages'):
            # Safely convert to strings
            prog_langs = [str(s) for s in skills['languages']] if isinstance(skills['languages'], list) else [str(skills['languages'])]
            skills_text += f"- Programming Languages: {', '.join(prog_langs)}\n"
        if skills.get('frameworks'):
            # Safely convert to strings
            frameworks = [str(s) for s in skills['frameworks']] if isinstance(skills['frameworks'], list) else [str(skills['frameworks'])]
            skills_text += f"- Frameworks/Tools: {', '.join(frameworks)}\n"
        if skills.get('soft_skills'):
            # Safely convert to strings
            soft = [str(s) for s in skills['soft_skills']] if isinstance(skills['soft_skills'], list) else [str(skills['soft_skills'])]
            skills_text += f"- Soft Skills: {', '.join(soft)}\n"
        
        sections.append(skills_text)
    
    # Languages
    if parsed_data.get('languages'):
        lang_text = "**Languages:**\n"
        languages = parsed_data['languages']
        if isinstance(languages, dict):
            for lang, level in languages.items():
                lang_text += f"- {lang}: {level}\n"
        elif isinstance(languages, list):
            for lang in languages:
                if isinstance(lang, dict):
                    lang_text += f"- {lang.get('name', 'N/A')}: {lang.get('level', 'N/A')}\n"
                else:
                    lang_text += f"- {str(lang)}\n"
        else:
            lang_text += f"- {str(languages)}\n"
        sections.append(lang_text)
    
    # Certifications
    if parsed_data.get('certifications'):
        cert_text = "**Certifications:**\n"
        certifications = parsed_data['certifications'] if isinstance(parsed_data['certifications'], list) else [parsed_data['certifications']]
        for cert in certifications:
            if isinstance(cert, dict):
                cert_text += f"- {cert.get('name', 'N/A')}"
                if cert.get('issuer'):
                    cert_text += f" (Issued by: {cert['issuer']})"
                if cert.get('date'):
                    cert_text += f" - {cert['date']}"
                cert_text += "\n"
            else:
                cert_text += f"- {str(cert)}\n"
        sections.append(cert_text)
    
    # Projects
    if parsed_data.get('projects'):
        proj_text = "**Notable Projects:**\n"
        projects = parsed_data['projects'] if isinstance(parsed_data['projects'], list) else [parsed_data['projects']]
        for proj in projects:
            if isinstance(proj, dict):
                proj_text += f"- {proj.get('name', 'N/A')}: {proj.get('description', 'N/A')}\n"
            else:
                proj_text += f"- {str(proj)}\n"
        sections.append(proj_text)
    
    return "\n\n".join(sections)
