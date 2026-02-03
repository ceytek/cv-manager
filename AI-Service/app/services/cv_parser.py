"""
CV Parser Service
Extracts text from PDF/DOCX and parses with OpenAI
"""
import PyPDF2
import docx
from io import BytesIO
from typing import Dict, Any, Optional
from app.services.openai_client import openai_client
from app.prompts.cv_parsing_prompt import SYSTEM_PROMPT, get_user_prompt


class CVParserService:
    """Service for parsing CV files"""
    
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
    
    @staticmethod
    async def parse_cv(cv_text: str) -> Dict[str, Any]:
        """
        Parse CV text using OpenAI
        
        Args:
            cv_text: Extracted CV text
            
        Returns:
            Structured CV data as JSON
        """
        try:
            # Generate prompts
            system_prompt = SYSTEM_PROMPT
            user_prompt = get_user_prompt(cv_text)
            
            # Call OpenAI with LangFuse tracing
            parsed_data = await openai_client.get_structured_response(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                trace_name="cv_parsing",
                trace_metadata={"text_length": len(cv_text)}
            )
            
            return parsed_data
            
        except Exception as e:
            raise Exception(f"CV parsing failed: {str(e)}")
    
    @staticmethod
    async def parse_cv_file(file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Complete CV parsing pipeline: extract text + parse with AI
        
        Args:
            file_content: CV file bytes
            filename: Original filename
            
        Returns:
            Structured CV data
        """
        # Step 1: Extract text
        cv_text = CVParserService.extract_text(file_content, filename)
        
        if not cv_text or len(cv_text) < 50:
            raise Exception("Extracted text is too short or empty")
        
        # Step 2: Parse with AI
        parsed_data = await CVParserService.parse_cv(cv_text)
        
        # Add metadata
        parsed_data['_metadata'] = {
            'filename': filename,
            'text_length': len(cv_text),
            'extracted_text': cv_text[:500]  # First 500 chars for reference
        }
        
        return parsed_data


# Global service instance
cv_parser_service = CVParserService()
