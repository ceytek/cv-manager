"""
CV Text Anonymizer - KVKK Compliant
Detects and masks PII (Personally Identifiable Information) in CV text
before sending to external AI services. Restores real values after parsing.

Masked PII types:
  - Email addresses
  - Phone numbers (Turkish + international)
  - LinkedIn / GitHub / Portfolio URLs
  - TC Kimlik No (Turkish national ID)
  - Name (heuristic: first prominent line)
  - Birth dates
"""
import re
from typing import Dict, Any, List, Tuple
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

    # Phone: Turkish formats
    # Must start with 0 or +90 to avoid matching year ranges
    PHONE_TR_RE = re.compile(
        r'(?:'
        r'(?:\+90[\s\-.]?)?'                           # optional +90
        r'(?:\(?0\d{3}\)?[\s\-.]?)'                    # area code starting with 0: (0532) or 0532
        r'\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}'             # 123 45 67
        r')',
    )

    # Phone: +90 format without leading 0
    PHONE_90_RE = re.compile(
        r'\+90[\s\-.]?\d{3}[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}',
    )

    # Phone: International format (must start with +, not +90)
    PHONE_INTL_RE = re.compile(
        r'\+(?!90)\d{1,3}[\s\-.]?\(?\d{1,5}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{0,4}',
    )

    # LinkedIn URL variations
    LINKEDIN_RE = re.compile(
        r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[^\s,;)>\]]+',
        re.IGNORECASE,
    )

    # GitHub URL (with or without protocol/www)
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

    def _next_placeholder(self, category: str) -> str:
        """Generate next placeholder like [EMAIL_1], [PHONE_2], etc."""
        count = self._counters.get(category, 0) + 1
        self._counters[category] = count
        return f"[{category}_{count}]"

    def _mask(self, text: str, pattern: re.Pattern, category: str) -> str:
        """Find all matches for pattern and replace with placeholders."""
        # Re-find matches on current text (positions may have shifted from prior masks)
        matches = list(pattern.finditer(text))
        # Process in reverse order to preserve positions
        for match in reversed(matches):
            original = match.group(0).strip()
            if not original or len(original) < 3:
                continue
            # Skip if this region already contains a placeholder
            if _PLACEHOLDER_RE.search(match.group(0)):
                continue
            # Avoid duplicates - reuse placeholder for same value
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

    def _detect_name(self, text: str) -> str:
        """
        Heuristic name detection from CV text.
        The candidate's name is typically the first prominent non-empty line
        that is short (2-5 words), contains no digits, and no common keywords.
        """
        skip_keywords = {
            'cv', 'resume', 'özgeçmiş', 'curriculum', 'vitae', 'portfolio',
            'phone', 'email', 'tel', 'telefon', 'adres', 'address',
            'linkedin', 'github', 'http', 'www', '@', '.com',
            'kişisel', 'bilgiler', 'personal', 'information', 'profil',
            'summary', 'objective', 'about', 'hakkında', 'deneyim',
            'experience', 'eğitim', 'education', 'skills', 'beceriler',
        }

        lines = text.strip().split('\n')
        for line in lines[:10]:  # Check first 10 lines
            line = line.strip()
            if not line:
                continue
            # Skip if too short or too long
            words = line.split()
            if len(words) < 2 or len(words) > 5:
                continue
            # Skip lines with digits (phone, date, ID)
            if any(c.isdigit() for c in line):
                continue
            # Skip lines with common keywords
            lower = line.lower()
            if any(kw in lower for kw in skip_keywords):
                continue
            # Skip lines with special characters (URLs, emails)
            if any(c in line for c in ['@', '/', ':', '|', '(', ')']):
                continue
            # Good candidate for name
            return line

        return ""

    def anonymize(self, cv_text: str) -> Tuple[str, Dict[str, str]]:
        """
        Anonymize PII in CV text.

        Args:
            cv_text: Raw extracted CV text

        Returns:
            Tuple of (anonymized_text, mapping_dict)
            mapping_dict: { "[EMAIL_1]": "real@email.com", ... }
        """
        self._mapping = {}
        self._counters = {}

        text = cv_text

        # Order matters: mask URLs first (they contain other patterns),
        # then specific PII, phone last to avoid false positives
        text = self._mask(text, self.LINKEDIN_RE, "LINKEDIN")
        text = self._mask(text, self.GITHUB_RE, "GITHUB")
        text = self._mask(text, self.URL_RE, "URL")
        text = self._mask(text, self.EMAIL_RE, "EMAIL")
        text = self._mask(text, self.TC_KIMLIK_RE, "TC_KIMLIK")
        text = self._mask(text, self.BIRTH_DATE_RE, "BIRTH_DATE")
        text = self._mask(text, self.PHONE_90_RE, "PHONE")
        text = self._mask(text, self.PHONE_TR_RE, "PHONE")
        text = self._mask(text, self.PHONE_INTL_RE, "PHONE")

        # Name detection - do after other masks to avoid matching masked text
        name = self._detect_name(cv_text)  # Use original text for name detection
        if name:
            placeholder = self._next_placeholder("NAME")
            self._mapping[placeholder] = name
            # Replace all occurrences of the name in the already-masked text
            text = text.replace(name, placeholder)

        logger.info(
            f"Anonymizer: {len(self._mapping)} PII items masked: "
            f"{[k for k in self._mapping.keys()]}"
        )

        return text, dict(self._mapping)

    @staticmethod
    def deanonymize_parsed(parsed_data: Dict[str, Any], mapping: Dict[str, str]) -> Dict[str, Any]:
        """
        Restore real PII values in the parsed output from AI.

        Args:
            parsed_data: JSON dict returned by AI (contains placeholders)
            mapping: { "[EMAIL_1]": "real@email.com", ... }

        Returns:
            parsed_data with placeholders replaced by real values
        """
        if not mapping:
            return parsed_data

        def _replace_in_value(value):
            """Recursively replace placeholders in any value type."""
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

        # Also fill in personal fields from mapping if AI returned null
        personal = result.get('personal', {})
        if personal and isinstance(personal, dict):
            # Fill email from mapping if missing
            if not personal.get('email'):
                for ph, val in mapping.items():
                    if ph.startswith('[EMAIL_'):
                        personal['email'] = val
                        break

            # Fill phone from mapping if missing
            if not personal.get('phone'):
                for ph, val in mapping.items():
                    if ph.startswith('[PHONE_'):
                        personal['phone'] = val
                        break

            # Fill name from mapping if missing
            if not personal.get('name'):
                for ph, val in mapping.items():
                    if ph.startswith('[NAME_'):
                        personal['name'] = val
                        break

            # Fill linkedin from mapping if missing
            if not personal.get('linkedin'):
                for ph, val in mapping.items():
                    if ph.startswith('[LINKEDIN_'):
                        personal['linkedin'] = val
                        break

            # Fill github from mapping if missing
            if not personal.get('github'):
                for ph, val in mapping.items():
                    if ph.startswith('[GITHUB_'):
                        personal['github'] = val
                        break

            # Fill portfolio from mapping if missing
            if not personal.get('portfolio'):
                for ph, val in mapping.items():
                    if ph.startswith('[URL_'):
                        personal['portfolio'] = val
                        break

            result['personal'] = personal

        return result


# Global instance
cv_anonymizer = CVAnonymizer()
