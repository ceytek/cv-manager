"""
Interview Question Generator Prompt
Generates interview questions based on job description/context.
Supports question types, difficulty levels, and single question regeneration.
"""

# Question type definitions
QUESTION_TYPES = {
    "behavioral": {
        "en": "Behavioral questions (STAR method) - Ask about past experiences and how the candidate handled specific situations",
        "tr": "Davranışsal sorular (STAR metodu) - Adayın geçmiş deneyimlerini ve belirli durumları nasıl ele aldığını sor"
    },
    "situational": {
        "en": "Situational questions - Present hypothetical scenarios and ask how the candidate would respond",
        "tr": "Durumsal sorular - Varsayımsal senaryolar sun ve adayın nasıl tepki vereceğini sor"
    },
    "technical": {
        "en": "Technical/Professional competency questions - Test job-specific knowledge and skills",
        "tr": "Teknik/Mesleki yetkinlik soruları - İşe özgü bilgi ve becerileri test et"
    },
    "conceptual": {
        "en": "Conceptual/Theoretical questions - Test understanding of concepts, principles, and theories",
        "tr": "Kavramsal/Teorik sorular - Kavramların, ilkelerin ve teorilerin anlaşılmasını test et"
    },
    "mixed": {
        "en": "Mix of different question types for a comprehensive assessment",
        "tr": "Kapsamlı bir değerlendirme için farklı soru tiplerinin karışımı"
    }
}

# Difficulty level definitions
DIFFICULTY_LEVELS = {
    "entry": {
        "en": "Entry/Junior level - Basic questions suitable for candidates with 0-2 years experience",
        "tr": "Başlangıç/Junior seviye - 0-2 yıl deneyimli adaylar için uygun temel sorular"
    },
    "intermediate": {
        "en": "Intermediate/Mid-level - Moderate complexity for candidates with 2-5 years experience",
        "tr": "Orta seviye - 2-5 yıl deneyimli adaylar için orta karmaşıklıkta sorular"
    },
    "advanced": {
        "en": "Advanced/Senior level - Complex, in-depth questions for experienced professionals (5+ years)",
        "tr": "İleri/Senior seviye - Deneyimli profesyoneller için karmaşık, derinlemesine sorular (5+ yıl)"
    }
}

# Question type badges for UI
QUESTION_TYPE_BADGES = {
    "behavioral": {"icon": "🎭", "label_tr": "Davranışsal", "label_en": "Behavioral", "color": "#8B5CF6"},
    "situational": {"icon": "🎯", "label_tr": "Durumsal", "label_en": "Situational", "color": "#F59E0B"},
    "technical": {"icon": "⚙️", "label_tr": "Teknik", "label_en": "Technical", "color": "#3B82F6"},
    "conceptual": {"icon": "💡", "label_tr": "Kavramsal", "label_en": "Conceptual", "color": "#10B981"},
}


def get_interview_question_generator_prompt(
    description: str,
    question_count: int,
    language: str = "tr",
    question_type: str = "mixed",
    difficulty: str = "intermediate"
) -> str:
    """
    Generate prompt for creating interview questions.
    
    Args:
        description: Job description or context for questions
        question_count: Number of questions to generate (1-15)
        language: Output language - "tr" for Turkish, "en" for English
        question_type: Type of questions - "behavioral", "situational", "technical", "conceptual", "mixed"
        difficulty: Difficulty level - "entry", "intermediate", "advanced"
    
    Returns:
        Formatted prompt string for OpenAI
    """
    
    # Get type and difficulty instructions
    type_instruction = QUESTION_TYPES.get(question_type, QUESTION_TYPES["mixed"])[language]
    difficulty_instruction = DIFFICULTY_LEVELS.get(difficulty, DIFFICULTY_LEVELS["intermediate"])[language]
    
    # Language-specific instructions
    if language == "en":
        language_instruction = "Generate all questions in ENGLISH."
        
        if question_type == "mixed":
            type_detail = """For mixed mode, distribute questions across different types:
- Include behavioral questions (past experiences)
- Include situational questions (hypothetical scenarios)  
- Include technical/professional competency questions (if relevant to the role)
- Include conceptual questions (theory and knowledge)
Mark each question with its type."""
        else:
            type_detail = f"All questions should be {question_type} type: {type_instruction}"
            
        difficulty_detail = f"""Difficulty Level: {difficulty.upper()}
{difficulty_instruction}
Adjust question complexity, depth, and expected answer sophistication accordingly."""

        output_instruction = """Return a JSON object with questions array. Each question should include:
- "text": The question text
- "type": Question type (behavioral/situational/technical/conceptual)"""

    else:  # Turkish (default)
        language_instruction = "Tüm soruları TÜRKÇE olarak oluştur."
        
        if question_type == "mixed":
            type_detail = """Karışık mod için soruları farklı tiplere dağıt:
- Davranışsal sorular ekle (geçmiş deneyimler)
- Durumsal sorular ekle (varsayımsal senaryolar)
- Teknik/mesleki yetkinlik soruları ekle (role uygunsa)
- Kavramsal sorular ekle (teori ve bilgi)
Her soruyu tipiyle işaretle."""
        else:
            type_labels = {"behavioral": "davranışsal", "situational": "durumsal", 
                         "technical": "teknik", "conceptual": "kavramsal"}
            type_detail = f"Tüm sorular {type_labels.get(question_type, question_type)} tipinde olmalı: {type_instruction}"
            
        difficulty_detail = f"""Zorluk Seviyesi: {difficulty.upper()}
{difficulty_instruction}
Soru karmaşıklığını, derinliğini ve beklenen cevap sofistikasyonunu buna göre ayarla."""

        output_instruction = """Sorular dizisi içeren bir JSON nesnesi döndür. Her soru şunları içermeli:
- "text": Soru metni
- "type": Soru tipi (behavioral/situational/technical/conceptual)"""

    # Validation instruction
    if language == "en":
        validation_instruction = """**CRITICAL VALIDATION:**
FIRST, analyze if the description is related to:
- A job position, role, or profession
- Business/corporate context
- Professional skills or competencies
- HR/recruitment related topic

If the description is:
- Nonsense, gibberish, or meaningless text
- About sports, entertainment, hobbies (unless job-related)
- About personal topics unrelated to work
- Too short or vague to understand (less than 3 meaningful words)
- Clearly not about a job/position/professional context

Then return this REJECTION response:
{"valid": false, "error": "The description must be about a job position, role, or professional context. Please provide a relevant job description."}

Only if the description is valid and job-related, proceed to generate questions."""
    else:
        validation_instruction = """**KRİTİK DOĞRULAMA:**
ÖNCE, açıklamanın şunlarla ilgili olup olmadığını analiz et:
- Bir iş pozisyonu, rol veya meslek
- İş/kurumsal bağlam
- Profesyonel beceriler veya yetkinlikler
- İK/işe alım ile ilgili konu

Eğer açıklama:
- Saçma, anlamsız veya manasız metin ise
- Sporla, eğlenceyle, hobilerle ilgiliyse (işle ilgili değilse)
- İşle alakasız kişisel konularla ilgiliyse
- Çok kısa veya belirsiz ise (3 anlamlı kelimeden az)
- Açıkça bir iş/pozisyon/profesyonel bağlamla ilgili değilse

O zaman bu RED yanıtını döndür:
{"valid": false, "error": "Açıklama bir iş pozisyonu, rol veya profesyonel bağlamla ilgili olmalıdır. Lütfen geçerli bir iş tanımı girin."}

Sadece açıklama geçerli ve işle ilgiliyse, soru üretmeye devam et."""

    prompt = f"""You are an expert HR interviewer and question designer. Generate professional interview questions.

{validation_instruction}

**CONTEXT/DESCRIPTION:**
{description}

**QUESTION TYPE:**
{type_detail}

**DIFFICULTY LEVEL:**
{difficulty_detail}

**REQUIREMENTS:**
- {language_instruction}
- Generate exactly {question_count} questions
- Questions should be open-ended and require detailed answers
- Questions should assess relevant skills, experience, and competencies
- Each question should be clear, professional, and appropriate
- Adjust complexity based on the difficulty level specified

**OUTPUT FORMAT (if description is valid):**
{output_instruction}

Return ONLY a valid JSON object:
For VALID job-related description:
{{
    "valid": true,
    "questions": [
        {{"text": "Question 1 text", "type": "behavioral"}},
        {{"text": "Question 2 text", "type": "situational"}},
        {{"text": "Question 3 text", "type": "technical"}}
    ]
}}

For INVALID/irrelevant description:
{{
    "valid": false,
    "error": "Error message explaining why description is invalid"
}}

**IMPORTANT:**
- Return ONLY the JSON object, no additional text or markdown
- ALWAYS check validity FIRST before generating questions
- Reject nonsense, random text, or non-job-related descriptions
- Ensure exactly {question_count} questions are generated (only if valid)
- Each question must have "text" and "type" fields
- For mixed mode, vary the question types
- For specific type mode, all questions should be that type"""

    return prompt


def get_single_question_regenerate_prompt(
    description: str,
    question_type: str,
    difficulty: str,
    language: str = "tr",
    existing_questions: list = None
) -> str:
    """
    Generate prompt for regenerating a single question.
    
    Args:
        description: Job description or context
        question_type: Type of question to generate
        difficulty: Difficulty level
        language: Output language
        existing_questions: List of existing questions to avoid repetition
    
    Returns:
        Formatted prompt string for OpenAI
    """
    
    type_instruction = QUESTION_TYPES.get(question_type, QUESTION_TYPES["behavioral"])[language]
    difficulty_instruction = DIFFICULTY_LEVELS.get(difficulty, DIFFICULTY_LEVELS["intermediate"])[language]
    
    # Build existing questions context to avoid repetition
    existing_context = ""
    if existing_questions and len(existing_questions) > 0:
        if language == "en":
            existing_context = f"""
**AVOID REPETITION - Existing questions (do NOT repeat similar themes):**
{chr(10).join(f'- {q}' for q in existing_questions)}
"""
        else:
            existing_context = f"""
**TEKRARDAN KAÇIN - Mevcut sorular (benzer temaları tekrarlama):**
{chr(10).join(f'- {q}' for q in existing_questions)}
"""

    if language == "en":
        prompt = f"""Generate ONE new interview question.

**CONTEXT:**
{description}

**QUESTION TYPE:** {question_type}
{type_instruction}

**DIFFICULTY:** {difficulty}
{difficulty_instruction}
{existing_context}
**REQUIREMENTS:**
- Generate in ENGLISH
- Create ONE question only
- Must be {question_type} type
- Match the {difficulty} difficulty level
- Be unique and different from existing questions

**OUTPUT FORMAT:**
Return ONLY a JSON object:
{{"text": "Your question here", "type": "{question_type}"}}"""
    else:
        type_labels = {"behavioral": "Davranışsal", "situational": "Durumsal", 
                      "technical": "Teknik", "conceptual": "Kavramsal"}
        prompt = f"""TEK BİR yeni mülakat sorusu oluştur.

**BAĞLAM:**
{description}

**SORU TİPİ:** {type_labels.get(question_type, question_type)}
{type_instruction}

**ZORLUK:** {difficulty}
{difficulty_instruction}
{existing_context}
**GEREKSINIMLER:**
- TÜRKÇE olarak oluştur
- Sadece BİR soru oluştur
- {type_labels.get(question_type, question_type)} tipinde olmalı
- {difficulty} zorluk seviyesine uygun olmalı
- Mevcut sorulardan farklı ve benzersiz olmalı

**ÇIKTI FORMATI:**
Sadece bir JSON nesnesi döndür:
{{"text": "Sorunuz burada", "type": "{question_type}"}}"""

    return prompt


def get_system_message(language: str = "tr") -> str:
    """Get system message for the AI model."""
    if language == "en":
        return (
            "You are an expert HR professional specializing in interview question design. "
            "You create thoughtful, probing questions that help assess candidates effectively. "
            "Always respond with valid JSON containing the questions."
        )
    else:
        return (
            "Sen mülakat sorusu tasarımında uzmanlaşmış bir İK profesyonelisin. "
            "Adayları etkili bir şekilde değerlendirmeye yardımcı olan düşünceli, araştırıcı sorular oluşturursun. "
            "Her zaman soruları içeren geçerli JSON ile yanıt ver."
        )
