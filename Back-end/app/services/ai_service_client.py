"""
AI Service Client
HTTP client for communicating with AI-Service
"""
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings


class AIServiceClient:
    """Client for AI-Service HTTP API"""
    
    def __init__(self):
        # AI-Service runs on port 8001
        self.base_url = "http://localhost:8001"
        self.timeout = 60.0  # 60 seconds for AI processing
    
    async def parse_cv_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Parse CV file using AI-Service
        
        Args:
            file_content: CV file bytes
            filename: Original filename
            
        Returns:
            Parsed CV data as JSON
            
        Raises:
            Exception: If API call fails
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Create multipart form data
                files = {
                    'file': (filename, file_content, 'application/octet-stream')
                }
                
                response = await client.post(
                    f"{self.base_url}/parse-cv-file",
                    files=files
                )
                
                response.raise_for_status()
                result = response.json()
                
                if not result.get('success'):
                    error = result.get('error', 'Unknown error')
                    raise Exception(f"AI parsing failed: {error}")
                
                return result.get('data')
                
        except httpx.TimeoutException:
            raise Exception("AI-Service timeout - parsing took too long")
        except httpx.HTTPError as e:
            raise Exception(f"AI-Service HTTP error: {str(e)}")
        except Exception as e:
            raise Exception(f"AI-Service call failed: {str(e)}")
    
    async def parse_cv_text(self, cv_text: str) -> Dict[str, Any]:
        """
        Parse CV from text using AI-Service
        
        Args:
            cv_text: Extracted CV text
            
        Returns:
            Parsed CV data as JSON
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/parse-cv-text",
                    json={"cv_text": cv_text}
                )
                
                response.raise_for_status()
                result = response.json()
                
                if not result.get('success'):
                    error = result.get('error', 'Unknown error')
                    raise Exception(f"AI parsing failed: {error}")
                
                return result.get('data')
                
        except httpx.TimeoutException:
            raise Exception("AI-Service timeout")
        except httpx.HTTPError as e:
            raise Exception(f"AI-Service HTTP error: {str(e)}")
        except Exception as e:
            raise Exception(f"AI-Service call failed: {str(e)}")


# Global client instance
ai_service_client = AIServiceClient()
