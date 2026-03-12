"""
CV Parser Service
Extracts text from PDF/DOCX and parses with AI.
KVKK Compliant: PII is anonymized before sending to external AI.
"""
import PyPDF2
import docx
import logging
from io import BytesIO
from typing import Dict, Any, Optional
from app.services.openai_client import openai_client
from app.services.anonymizer import CVAnonymizer
from app.prompts.cv_parsing_prompt import SYSTEM_PROMPT, get_user_prompt

logger = logging.getLogger(__name__)


class CVParserService:
    """Service for parsing CV files with KVKK-compliant anonymization."""

    def __init__(self):
        self.anonymizer = CVAnonymizer()

    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> str:
        """
        Extract text from PDF file
        
        Args:
            file_content: PDF file bytes
            
        Returns:
            Extracted text
        """
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    @staticmethod
    def extract_text_from_docx(file_content: bytes) -> str:
        """
        Extract text from DOCX file
        
        Args:
            file_content: DOCX file bytes
            
        Returns:
            Extracted text
        """
        try:
            doc_file = BytesIO(file_content)
            doc = docx.Document(doc_file)
            
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text.strip()
        except Exception as e:
            raise Exception(f"Failed to extract text from DOCX: {str(e)}")
    
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> str:
        """
        Extract text from CV file based on extension
        
        Args:
            file_content: File bytes
            filename: Original filename with extension
            
        Returns:
            Extracted text
        """
        extension = filename.lower().split('.')[-1]
        
        if extension == 'pdf':
            return CVParserService.extract_text_from_pdf(file_content)
        elif extension in ['docx', 'doc']:
            return CVParserService.extract_text_from_docx(file_content)
        else:
            raise Exception(f"Unsupported file format: {extension}")
    
    async def parse_cv(self, cv_text: str) -> Dict[str, Any]:
        """
        Parse CV text using AI with KVKK-compliant anonymization.
        
        Pipeline:
          1. Anonymize PII in text (local regex)
          2. Send anonymized text to AI
          3. Restore real PII in parsed output
        
        Args:
            cv_text: Extracted CV text
            
        Returns:
            Structured CV data as JSON (with real PII restored)
        """
        try:
            # ── Step 1: Anonymize PII ──────────────────────────────
            anonymizer = CVAnonymizer()
            anonymized_text, pii_mapping = anonymizer.anonymize(cv_text)
            
            masked_count = len(pii_mapping)
            if masked_count > 0:
                logger.info(
                    f"KVKK Anonymizer: Masked {masked_count} PII items "
                    f"({', '.join(k.split('_')[0].strip('[') for k in pii_mapping.keys())})"
                )
            else:
                logger.info("KVKK Anonymizer: No PII detected in CV text")

            # ── Step 2: Send anonymized text to AI ─────────────────
            system_prompt = SYSTEM_PROMPT
            user_prompt = get_user_prompt(anonymized_text)
            
            parsed_data = await openai_client.get_structured_response(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                trace_name="cv_parsing",
                trace_metadata={
                    "text_length": len(cv_text),
                    "anonymized_text_length": len(anonymized_text),
                    "pii_items_masked": masked_count,
                }
            )
            
            # ── Step 3: Inject locally-extracted PII into output ──────
            # This OVERRIDES AI personal fields with our local regex values
            # Guarantees: no placeholder leaks + correct PII always
            parsed_data = anonymizer.inject_pii_into_parsed(parsed_data)
            logger.info(
                f"KVKK Anonymizer: Injected local PII into parsed output "
                f"(name={anonymizer.extracted_pii.get('name', 'N/A')})"
            )
            
            return parsed_data
            
        except Exception as e:
            raise Exception(f"CV parsing failed: {str(e)}")
    
    async def parse_cv_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Complete CV parsing pipeline: extract text + anonymize + parse with AI + restore PII
        
        Args:
            file_content: CV file bytes
            filename: Original filename
            
        Returns:
            Structured CV data
        """
        # Step 1: Extract text (local, no PII risk)
        cv_text = CVParserService.extract_text(file_content, filename)
        
        if not cv_text or len(cv_text) < 50:
            raise Exception("Extracted text is too short or empty")
        
        # Step 2: Parse with AI (anonymized)
        parsed_data = await self.parse_cv(cv_text)
        
        # Add metadata
        parsed_data['_metadata'] = {
            'filename': filename,
            'text_length': len(cv_text),
            'extracted_text': cv_text[:500],  # First 500 chars for reference
            'kvkk_anonymized': True,
        }
        
        return parsed_data


# Global service instance
cv_parser_service = CVParserService()
