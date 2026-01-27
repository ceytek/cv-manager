"""
Interview Question Generator Prompt
Generates interview questions based on job description/context.
"""


def get_interview_question_generator_prompt(
    description: str,
    question_count: int,
    language: str = "tr"
) -> str:
    """
    Generate prompt for creating interview questions.
    
    Args:
        description: Job description or context for questions
        question_count: Number of questions to generate (1-15)
        language: Output language - "tr" for Turkish, "en" for English
    
    Returns:
        Formatted prompt string for OpenAI
    """
    
    # Language-specific instructions
    if language == "en":
        language_instruction = """Generate all questions in ENGLISH.
Even if the description is in another language, the questions MUST be in English."""
        example_questions = """Example format:
1. Can you describe your experience with [relevant skill]?
2. How would you handle [relevant situation]?
3. What strategies do you use for [relevant task]?"""
    else:  # Turkish (default)
        language_instruction = """Tüm soruları TÜRKÇE olarak oluştur.
Açıklama başka bir dilde olsa bile, sorular mutlaka Türkçe olmalıdır."""
        example_questions = """Örnek format:
1. [İlgili beceri] konusundaki deneyiminizi anlatır mısınız?
2. [İlgili durum] ile karşılaştığınızda nasıl bir yaklaşım sergilersiniz?
3. [İlgili görev] için hangi stratejileri kullanırsınız?"""

    prompt = f"""You are an expert HR interviewer and question designer. Generate professional interview questions based on the provided context.

**CONTEXT/DESCRIPTION:**
{description}

**REQUIREMENTS:**
- Generate exactly {question_count} interview questions
- {language_instruction}
- Questions should be open-ended and require detailed answers
- Questions should assess relevant skills, experience, and competencies
- Mix different question types: behavioral, situational, technical (if applicable), and motivational
- Questions should be professional and appropriate for a job interview
- Each question should be clear and concise

{example_questions}

**OUTPUT FORMAT:**
Return ONLY a JSON object with the following structure:
{{
    "questions": [
        "Question 1 text here",
        "Question 2 text here",
        "Question 3 text here"
    ]
}}

**IMPORTANT:**
- Return ONLY the JSON object, no additional text or markdown
- Ensure exactly {question_count} questions are generated
- Each question should be a complete, standalone question
- Do not number the questions in the text (just include them as array items)
- Questions should flow naturally and cover different aspects of the role/topic"""

    return prompt


def get_system_message(language: str = "tr") -> str:
    """Get system message for the AI model."""
    if language == "en":
        return (
            "You are an expert HR professional specializing in interview question design. "
            "You create thoughtful, probing questions that help assess candidates effectively. "
            "Always respond with valid JSON containing the questions array."
        )
    else:
        return (
            "Sen mülakat sorusu tasarımında uzmanlaşmış bir İK profesyonelisin. "
            "Adayları etkili bir şekilde değerlendirmeye yardımcı olan düşünceli, araştırıcı sorular oluşturursun. "
            "Her zaman sorular dizisini içeren geçerli JSON ile yanıt ver."
        )
