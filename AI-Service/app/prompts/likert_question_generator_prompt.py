"""
Likert Question Generator Prompt
Generates Likert scale questions based on dimensions and settings.
"""

# Dimension definitions
DIMENSIONS = {
    "leadership": {
        "en": "Leadership - Decision making, taking initiative, guiding others, strategic thinking",
        "tr": "Liderlik - Karar verme, inisiyatif alma, başkalarına yol gösterme, stratejik düşünme"
    },
    "communication": {
        "en": "Communication - Verbal/written expression, active listening, clarity, persuasion",
        "tr": "İletişim - Sözlü/yazılı ifade, aktif dinleme, netlik, ikna"
    },
    "teamwork": {
        "en": "Teamwork - Collaboration, cooperation, supporting others, group harmony",
        "tr": "Takım Çalışması - İşbirliği, uyum, başkalarını destekleme, grup ahengi"
    },
    "problem_solving": {
        "en": "Problem Solving - Analytical thinking, creativity, logical approach, finding solutions",
        "tr": "Problem Çözme - Analitik düşünme, yaratıcılık, mantıksal yaklaşım, çözüm bulma"
    },
    "stress_management": {
        "en": "Stress Management - Working under pressure, emotional control, resilience, calmness",
        "tr": "Stres Yönetimi - Baskı altında çalışma, duygusal kontrol, dayanıklılık, sakinlik"
    },
    "adaptability": {
        "en": "Adaptability - Flexibility, openness to change, learning new skills, adjustment",
        "tr": "Adaptasyon - Esneklik, değişime açıklık, yeni beceriler öğrenme, uyum sağlama"
    },
    "motivation": {
        "en": "Motivation - Goal orientation, self-drive, ambition, persistence",
        "tr": "Motivasyon - Hedef odaklılık, içsel motivasyon, hırs, azim"
    },
    "integrity": {
        "en": "Integrity - Honesty, ethics, reliability, responsibility",
        "tr": "Dürüstlük - Doğruluk, etik, güvenilirlik, sorumluluk"
    },
    "mixed": {
        "en": "Mixed - Combination of various dimensions for comprehensive assessment",
        "tr": "Karışık - Kapsamlı değerlendirme için çeşitli boyutların kombinasyonu"
    }
}

# Direction definitions
DIRECTIONS = {
    "positive": {
        "en": "Positive statements where higher agreement indicates better fit",
        "tr": "Daha yüksek katılımın daha iyi uyumu gösterdiği pozitif ifadeler"
    },
    "negative": {
        "en": "Reverse-scored statements where higher agreement indicates worse fit (attention check)",
        "tr": "Daha yüksek katılımın daha kötü uyumu gösterdiği ters puanlanan ifadeler (dikkat testi)"
    },
    "mixed": {
        "en": "Mix of positive and negative statements (recommended for reliable assessment)",
        "tr": "Pozitif ve negatif ifadelerin karışımı (güvenilir değerlendirme için önerilen)"
    }
}

# Dimension badges for UI
DIMENSION_BADGES = {
    "leadership": {"icon": "👑", "label_tr": "Liderlik", "label_en": "Leadership", "color": "#F59E0B"},
    "communication": {"icon": "💬", "label_tr": "İletişim", "label_en": "Communication", "color": "#3B82F6"},
    "teamwork": {"icon": "👥", "label_tr": "Takım", "label_en": "Teamwork", "color": "#10B981"},
    "problem_solving": {"icon": "🧩", "label_tr": "Problem Çözme", "label_en": "Problem Solving", "color": "#8B5CF6"},
    "stress_management": {"icon": "⚡", "label_tr": "Stres", "label_en": "Stress", "color": "#EF4444"},
    "adaptability": {"icon": "🔄", "label_tr": "Adaptasyon", "label_en": "Adaptability", "color": "#06B6D4"},
    "motivation": {"icon": "🎯", "label_tr": "Motivasyon", "label_en": "Motivation", "color": "#EC4899"},
    "integrity": {"icon": "✓", "label_tr": "Dürüstlük", "label_en": "Integrity", "color": "#6366F1"},
}


def get_likert_question_generator_prompt(
    description: str,
    question_count: int,
    language: str = "tr",
    dimension: str = "mixed",
    direction: str = "mixed",
    scale_type: int = 5
) -> str:
    """
    Generate prompt for creating Likert scale questions.
    
    Args:
        description: Context or position description for questions
        question_count: Number of questions to generate (1-30)
        language: Output language - "tr" for Turkish, "en" for English
        dimension: Dimension to measure - leadership, communication, teamwork, etc.
        direction: Question direction - positive, negative, or mixed
        scale_type: Likert scale type (5 or 7 point)
    
    Returns:
        Formatted prompt string for OpenAI
    """
    
    # Get dimension instruction
    dimension_instruction = DIMENSIONS.get(dimension, DIMENSIONS["mixed"])[language]
    direction_instruction = DIRECTIONS.get(direction, DIRECTIONS["mixed"])[language]
    
    # Calculate positive/negative distribution for mixed mode
    if direction == "mixed":
        positive_count = int(question_count * 0.7)  # 70% positive
        negative_count = question_count - positive_count  # 30% negative
        direction_detail = f"Generate approximately {positive_count} positive and {negative_count} negative (reverse-scored) statements."
        direction_detail_tr = f"Yaklaşık {positive_count} pozitif ve {negative_count} negatif (ters puanlanan) ifade oluştur."
    elif direction == "positive":
        direction_detail = "All statements should be positive (higher agreement = better)."
        direction_detail_tr = "Tüm ifadeler pozitif olmalı (yüksek katılım = iyi)."
    else:  # negative
        direction_detail = "All statements should be negative/reverse-scored (higher agreement = worse)."
        direction_detail_tr = "Tüm ifadeler negatif/ters puanlanan olmalı (yüksek katılım = kötü)."
    
    # Dimension handling for mixed mode
    if dimension == "mixed":
        dimension_detail = "Distribute questions across multiple dimensions: leadership, communication, teamwork, problem solving, stress management, adaptability, motivation."
        dimension_detail_tr = "Soruları birden fazla boyuta dağıt: liderlik, iletişim, takım çalışması, problem çözme, stres yönetimi, adaptasyon, motivasyon."
    else:
        dimension_detail = f"All questions should measure the {dimension.replace('_', ' ')} dimension."
        dim_labels = {"leadership": "liderlik", "communication": "iletişim", "teamwork": "takım çalışması", 
                     "problem_solving": "problem çözme", "stress_management": "stres yönetimi",
                     "adaptability": "adaptasyon", "motivation": "motivasyon", "integrity": "dürüstlük"}
        dimension_detail_tr = f"Tüm sorular {dim_labels.get(dimension, dimension)} boyutunu ölçmeli."
    
    # Language-specific prompts
    if language == "en":
        scale_labels = "Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree" if scale_type == 5 else "Strongly Disagree, Disagree, Somewhat Disagree, Neutral, Somewhat Agree, Agree, Strongly Agree"
        
        prompt = f"""You are an expert psychometrician and HR assessment designer. Generate professional Likert scale statements for personality/competency assessment.

**CONTEXT/POSITION:**
{description}

**DIMENSION TO MEASURE:**
{dimension_instruction}
{dimension_detail}

**QUESTION DIRECTION:**
{direction_instruction}
{direction_detail}

**REQUIREMENTS:**
- Generate exactly {question_count} Likert statements in ENGLISH
- Scale type: {scale_type}-point Likert scale ({scale_labels})
- Statements should be first-person ("I...") or self-assessment format
- Each statement should be clear, concise, and unambiguous
- Avoid double-barreled questions (two concepts in one)
- Negative statements should be clearly identifiable for reverse scoring
- Statements should be professional and appropriate for workplace assessment

**OUTPUT FORMAT:**
Return a JSON object with questions array. Each question must have:
- "text": The statement text
- "dimension": The dimension being measured (leadership/communication/teamwork/problem_solving/stress_management/adaptability/motivation/integrity)
- "direction": Whether it's "positive" or "negative" (for reverse scoring)

Example:
{{
    "questions": [
        {{"text": "I take initiative in group projects.", "dimension": "leadership", "direction": "positive"}},
        {{"text": "I avoid making important decisions.", "dimension": "leadership", "direction": "negative"}}
    ]
}}

Return ONLY the JSON object, no additional text."""

    else:  # Turkish
        scale_labels = "Kesinlikle Katılmıyorum, Katılmıyorum, Kararsızım, Katılıyorum, Kesinlikle Katılıyorum" if scale_type == 5 else "Kesinlikle Katılmıyorum, Katılmıyorum, Biraz Katılmıyorum, Kararsızım, Biraz Katılıyorum, Katılıyorum, Kesinlikle Katılıyorum"
        
        prompt = f"""Sen uzman bir psikometrist ve İK değerlendirme tasarımcısısın. Kişilik/yetkinlik değerlendirmesi için profesyonel Likert ölçeği ifadeleri oluştur.

**BAĞLAM/POZİSYON:**
{description}

**ÖLÇÜLECECİ BOYUT:**
{dimension_instruction}
{dimension_detail_tr}

**SORU YÖNÜ:**
{direction_instruction}
{direction_detail_tr}

**GEREKSİNİMLER:**
- Tam olarak {question_count} Likert ifadesi oluştur, TÜRKÇE olarak
- Ölçek tipi: {scale_type}'li Likert ölçeği ({scale_labels})
- İfadeler birinci tekil şahıs ("Ben...") veya öz-değerlendirme formatında olmalı
- Her ifade açık, öz ve belirsiz olmamalı
- Çift anlamlı sorulardan kaçın (bir ifadede iki kavram)
- Negatif ifadeler ters puanlama için açıkça tanımlanabilir olmalı
- İfadeler profesyonel ve iş yeri değerlendirmesi için uygun olmalı

**ÇIKTI FORMATI:**
Sorular dizisi içeren bir JSON nesnesi döndür. Her soru şunları içermeli:
- "text": İfade metni
- "dimension": Ölçülen boyut (leadership/communication/teamwork/problem_solving/stress_management/adaptability/motivation/integrity)
- "direction": "positive" veya "negative" (ters puanlama için)

Örnek:
{{
    "questions": [
        {{"text": "Grup projelerinde inisiyatif alırım.", "dimension": "leadership", "direction": "positive"}},
        {{"text": "Önemli kararlar vermekten kaçınırım.", "dimension": "leadership", "direction": "negative"}}
    ]
}}

SADECE JSON nesnesini döndür, ek metin yok."""

    return prompt


def get_single_likert_question_regenerate_prompt(
    description: str,
    dimension: str,
    direction: str,
    language: str = "tr",
    existing_questions: list = None
) -> str:
    """
    Generate prompt for regenerating a single Likert question.
    
    Args:
        description: Context or position description
        dimension: Dimension to measure
        direction: Question direction (positive/negative)
        language: Output language
        existing_questions: List of existing questions to avoid repetition
    
    Returns:
        Formatted prompt string for OpenAI
    """
    
    dimension_label = DIMENSIONS.get(dimension, DIMENSIONS["leadership"])[language]
    
    # Build existing questions context
    existing_context = ""
    if existing_questions and len(existing_questions) > 0:
        if language == "en":
            existing_context = f"""
**AVOID REPETITION - Existing statements (do NOT repeat similar themes):**
{chr(10).join(f'- {q}' for q in existing_questions)}
"""
        else:
            existing_context = f"""
**TEKRARDAN KAÇIN - Mevcut ifadeler (benzer temaları tekrarlama):**
{chr(10).join(f'- {q}' for q in existing_questions)}
"""

    if language == "en":
        direction_text = "positive (higher agreement = better)" if direction == "positive" else "negative/reverse-scored (higher agreement = worse)"
        prompt = f"""Generate ONE new Likert scale statement.

**CONTEXT:**
{description}

**DIMENSION:** {dimension.replace('_', ' ').title()}
{dimension_label}

**DIRECTION:** {direction_text}
{existing_context}
**REQUIREMENTS:**
- Generate in ENGLISH
- Create ONE statement only
- Must measure {dimension.replace('_', ' ')} dimension
- Must be {direction} direction
- Be unique and different from existing statements

**OUTPUT FORMAT:**
Return ONLY a JSON object:
{{"text": "Your statement here", "dimension": "{dimension}", "direction": "{direction}"}}"""
    else:
        direction_text = "pozitif (yüksek katılım = iyi)" if direction == "positive" else "negatif/ters puanlanan (yüksek katılım = kötü)"
        dim_labels = {"leadership": "Liderlik", "communication": "İletişim", "teamwork": "Takım Çalışması", 
                     "problem_solving": "Problem Çözme", "stress_management": "Stres Yönetimi",
                     "adaptability": "Adaptasyon", "motivation": "Motivasyon", "integrity": "Dürüstlük"}
        prompt = f"""TEK BİR yeni Likert ölçeği ifadesi oluştur.

**BAĞLAM:**
{description}

**BOYUT:** {dim_labels.get(dimension, dimension)}
{dimension_label}

**YÖN:** {direction_text}
{existing_context}
**GEREKSİNİMLER:**
- TÜRKÇE olarak oluştur
- Sadece BİR ifade oluştur
- {dim_labels.get(dimension, dimension)} boyutunu ölçmeli
- {direction_text} olmalı
- Mevcut ifadelerden farklı ve benzersiz olmalı

**ÇIKTI FORMATI:**
Sadece bir JSON nesnesi döndür:
{{"text": "İfadeniz burada", "dimension": "{dimension}", "direction": "{direction}"}}"""

    return prompt


def get_system_message(language: str = "tr") -> str:
    """Get system message for the AI model."""
    if language == "en":
        return (
            "You are an expert psychometrician specializing in personality and competency assessments. "
            "You create reliable, valid Likert scale statements that accurately measure psychological constructs. "
            "Always respond with valid JSON containing the questions."
        )
    else:
        return (
            "Sen kişilik ve yetkinlik değerlendirmelerinde uzmanlaşmış bir psikometristsin. "
            "Psikolojik yapıları doğru bir şekilde ölçen güvenilir, geçerli Likert ölçeği ifadeleri oluşturursun. "
            "Her zaman soruları içeren geçerli JSON ile yanıt ver."
        )
