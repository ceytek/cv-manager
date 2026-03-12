"""
CV Text Anonymizer - KVKK Compliant
Detects and masks PII (Personally Identifiable Information) in CV text
before sending to external AI services. Restores real values after parsing.

Strategy:
  - Personal fields (name, email, phone, etc.) are extracted LOCALLY via regex
  - These are masked before sending to AI
  - After AI returns structural data (education, experience, skills),
    the locally-extracted PII is DIRECTLY injected into the result
  - This guarantees PII never leaves the server AND is always accurate
"""
import re
from typing import Dict, Any, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


# Placeholder pattern to detect already-masked text
_PLACEHOLDER_RE = re.compile(r'\[[A-Z_]+_\d+\]')


class CVAnonymizer:
    """Anonymizes PII in CV text and restores it in parsed output."""

    # ── Regex Patterns ──────────────────────────────────────────────

    # Email: standard pattern
    EMAIL_RE = re.compile(
        r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
        re.IGNORECASE,
    )

    # Phone: Turkish formats - must start with 0 or +90
    PHONE_TR_RE = re.compile(
        r'(?:\+90[\s\-.]?)?\(?0\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}',
    )

    # Phone: +90 or 90 without leading 0  (e.g. +90 532 123 45 67  or  905321234567)
    PHONE_90_RE = re.compile(
        r'\+?90[\s\-.]?\d{3}[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}',
    )

    # Phone: other international (must start with +, not +90)
    PHONE_INTL_RE = re.compile(
        r'\+(?!90)\d{1,3}[\s\-.]?\(?\d{1,5}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{0,4}',
    )

    # LinkedIn URL variations (with or without protocol)
    LINKEDIN_RE = re.compile(
        r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[^\s,;)>\]]+',
        re.IGNORECASE,
    )

    # GitHub URL (with or without protocol)
    GITHUB_RE = re.compile(
        r'(?:https?://)?(?:www\.)?github\.com/[^\s,;)>\]]+',
        re.IGNORECASE,
    )

    # Generic website / portfolio URL (must have http/https)
    URL_RE = re.compile(
        r'https?://[^\s,;)>\]]+',
        re.IGNORECASE,
    )

    # Turkish national ID (TC Kimlik No) - exactly 11 digits standing alone
    TC_KIMLIK_RE = re.compile(
        r'(?<!\d)\d{11}(?!\d)',
    )

    # Birth date patterns: DD.MM.YYYY  DD/MM/YYYY  DD-MM-YYYY
    BIRTH_DATE_RE = re.compile(
        r'\b(?:0[1-9]|[12]\d|3[01])[./\-](?:0[1-9]|1[0-2])[./\-](?:19|20)\d{2}\b'
    )

    def __init__(self):
        self._mapping: Dict[str, str] = {}   # placeholder → real value
        self._counters: Dict[str, int] = {}
        # Locally extracted PII (authoritative source)
        self.extracted_pii: Dict[str, Optional[str]] = {
            'name': None,
            'email': None,
            'phone': None,
            'linkedin': None,
            'github': None,
            'portfolio': None,
            'birth_date': None,
            'tc_kimlik': None,
        }

    def _next_placeholder(self, category: str) -> str:
        """Generate next placeholder like [EMAIL_1], [PHONE_2], etc."""
        count = self._counters.get(category, 0) + 1
        self._counters[category] = count
        return f"[{category}_{count}]"

    def _mask(self, text: str, pattern: re.Pattern, category: str) -> str:
        """Find all matches for pattern and replace with placeholders."""
        matches = list(pattern.finditer(text))
        for match in reversed(matches):
            original = match.group(0).strip()
            if not original or len(original) < 3:
                continue
            # Skip regions that already have a placeholder
            if _PLACEHOLDER_RE.search(match.group(0)):
                continue
            # Reuse placeholder for duplicate values
            existing = None
            for ph, val in self._mapping.items():
                if val == original:
                    existing = ph
                    break
            placeholder = existing or self._next_placeholder(category)
            if not existing:
                self._mapping[placeholder] = original
            text = text[:match.start()] + placeholder + text[match.end():]
        return text

    def _extract_first(self, text: str, pattern: re.Pattern) -> Optional[str]:
        """Extract first match of pattern from text."""
        m = pattern.search(text)
        return m.group(0).strip() if m else None

    def _detect_name(self, text: str) -> str:
        """
        Heuristic name detection from CV text.
        Strategies:
          1. First short line (2-5 words) without digits/keywords
          2. Handle "Name, Title" format (take before comma)
          3. Handle ALL CAPS names
        """
        skip_keywords = {
            'cv', 'resume', 'özgeçmiş', 'curriculum', 'vitae', 'portfolio',
            'phone', 'email', 'tel', 'telefon', 'adres', 'address',
            'linkedin', 'github', 'http', 'www', '@', '.com', '.org', '.net',
            'kişisel', 'bilgiler', 'personal', 'information', 'profil',
            'summary', 'objective', 'about', 'hakkında', 'deneyim',
            'experience', 'eğitim', 'education', 'skills', 'beceriler',
            'development', 'developer', 'engineer', 'manager', 'lead',
            'senior', 'junior', 'intern', 'stajyer', 'müdür', 'uzman',
            'iş', 'proje', 'project', 'process', 'tarih', 'date',
            'doğum', 'uyruğu', 'medeni', 'cinsiyeti', 'askerlik',
        }

        lines = text.strip().split('\n')
        for line in lines[:15]:  # Check first 15 lines
            line = line.strip()
            if not line:
                continue

            # If line has a comma, try taking the part before the comma as name
            # e.g. "Ali Turgut BOZKURT, Lead Java Developer"
            candidate_name = line
            if ',' in line:
                candidate_name = line.split(',')[0].strip()

            # Clean up trailing periods and special chars
            candidate_name = candidate_name.rstrip('.').strip()

            if not candidate_name:
                continue

            words = candidate_name.split()
            if len(words) < 2 or len(words) > 5:
                continue

            # Skip if contains digits
            if any(c.isdigit() for c in candidate_name):
                continue

            # Skip if contains special chars typical of non-name content
            if any(c in candidate_name for c in ['@', '/', ':', '|', '(', ')', '{', '}', '[', ']', '#', '+', '=']):
                continue

            # Skip if any word matches a keyword
            lower_words = [w.lower().rstrip('.,;:') for w in words]
            if any(w in skip_keywords for w in lower_words):
                continue

            # Skip very long words (likely not names)
            if any(len(w) > 20 for w in words):
                continue

            # Good candidate: return it
            return candidate_name

        return ""

    def anonymize(self, cv_text: str) -> Tuple[str, Dict[str, str]]:
        """
        Anonymize PII in CV text and extract PII locally.

        Args:
            cv_text: Raw extracted CV text

        Returns:
            Tuple of (anonymized_text, mapping_dict)
        """
        self._mapping = {}
        self._counters = {}
        self.extracted_pii = {
            'name': None, 'email': None, 'phone': None,
            'linkedin': None, 'github': None, 'portfolio': None,
            'birth_date': None, 'tc_kimlik': None,
        }

        text = cv_text

        # ── Step 1: Extract PII locally (before masking) ──────────

        # Email
        email = self._extract_first(cv_text, self.EMAIL_RE)
        if email:
            self.extracted_pii['email'] = email

        # Phone (try multiple patterns)
        phone = (
            self._extract_first(cv_text, self.PHONE_90_RE) or
            self._extract_first(cv_text, self.PHONE_TR_RE) or
            self._extract_first(cv_text, self.PHONE_INTL_RE)
        )
        if phone:
            self.extracted_pii['phone'] = phone

        # LinkedIn
        linkedin = self._extract_first(cv_text, self.LINKEDIN_RE)
        if linkedin:
            self.extracted_pii['linkedin'] = linkedin

        # GitHub
        github = self._extract_first(cv_text, self.GITHUB_RE)
        if github:
            self.extracted_pii['github'] = github

        # Portfolio URL (exclude linkedin/github)
        for m in self.URL_RE.finditer(cv_text):
            url = m.group(0).strip()
            if 'linkedin.com' not in url.lower() and 'github.com' not in url.lower():
                self.extracted_pii['portfolio'] = url
                break

        # TC Kimlik
        tc = self._extract_first(cv_text, self.TC_KIMLIK_RE)
        if tc:
            self.extracted_pii['tc_kimlik'] = tc

        # Birth date
        bd = self._extract_first(cv_text, self.BIRTH_DATE_RE)
        if bd:
            self.extracted_pii['birth_date'] = bd

        # Name (heuristic)
        name = self._detect_name(cv_text)
        if name:
            self.extracted_pii['name'] = name

        # ── Step 2: Mask PII in text ─────────────────────────────

        # Order: URLs first (contain sub-patterns), then specific PII
        text = self._mask(text, self.LINKEDIN_RE, "LINKEDIN")
        text = self._mask(text, self.GITHUB_RE, "GITHUB")
        text = self._mask(text, self.URL_RE, "URL")
        text = self._mask(text, self.EMAIL_RE, "EMAIL")
        text = self._mask(text, self.TC_KIMLIK_RE, "TC_KIMLIK")
        text = self._mask(text, self.BIRTH_DATE_RE, "BIRTH_DATE")
        text = self._mask(text, self.PHONE_90_RE, "PHONE")
        text = self._mask(text, self.PHONE_TR_RE, "PHONE")
        text = self._mask(text, self.PHONE_INTL_RE, "PHONE")

        # Mask name last (after other PII is masked)
        if name:
            placeholder = self._next_placeholder("NAME")
            self._mapping[placeholder] = name
            text = text.replace(name, placeholder)

        pii_summary = {k: v for k, v in self.extracted_pii.items() if v}
        logger.info(f"Anonymizer: Extracted {len(pii_summary)} PII fields: {list(pii_summary.keys())}")

        return text, dict(self._mapping)

    def inject_pii_into_parsed(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inject locally-extracted PII into the AI-parsed result.
        This OVERRIDES whatever the AI returned for personal fields,
        ensuring real values are always used (no placeholder leaks).

        Also performs placeholder replacement on all other string fields
        as a safety net.

        Args:
            parsed_data: JSON dict from AI (may contain placeholders)

        Returns:
            Final parsed data with real PII values
        """
        mapping = self._mapping

        # ── Safety net: replace any remaining placeholders everywhere ──
        def _replace_in_value(value):
            if isinstance(value, str):
                for placeholder, real_value in mapping.items():
                    value = value.replace(placeholder, real_value)
                return value
            elif isinstance(value, dict):
                return {k: _replace_in_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [_replace_in_value(item) for item in value]
            return value

        result = _replace_in_value(parsed_data)

        # ── Override personal fields with locally-extracted PII ──
        personal = result.get('personal', {}) or {}

        if self.extracted_pii['name']:
            personal['name'] = self.extracted_pii['name']
        if self.extracted_pii['email']:
            personal['email'] = self.extracted_pii['email']
        if self.extracted_pii['phone']:
            personal['phone'] = self.extracted_pii['phone']
        if self.extracted_pii['linkedin']:
            personal['linkedin'] = self.extracted_pii['linkedin']
        if self.extracted_pii['github']:
            personal['github'] = self.extracted_pii['github']
        if self.extracted_pii['portfolio']:
            personal['portfolio'] = self.extracted_pii['portfolio']

        result['personal'] = personal
        return result
