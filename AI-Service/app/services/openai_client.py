"""
OpenAI Client Wrapper
Handles all OpenAI API calls with error handling
"""
from openai import OpenAI
from app.config import settings
import json
from typing import Dict, Any


class OpenAIClient:
    """Wrapper for OpenAI API calls"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.MODEL_NAME
        self.max_tokens = settings.MAX_TOKENS
        self.temperature = settings.TEMPERATURE
    
    async def get_structured_response(
        self, 
        system_prompt: str, 
        user_prompt: str
    ) -> Dict[str, Any]:
        """
        Get structured JSON response from OpenAI
        
        Args:
            system_prompt: System role instructions
            user_prompt: User message with data to process
            
        Returns:
            Parsed JSON response
            
        Raises:
            Exception: If API call fails or JSON parsing fails
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}  # Force JSON response
            )
            
            # Extract content
            content = response.choices[0].message.content
            
            # Parse JSON
            parsed_data = json.loads(content)
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse OpenAI response as JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"OpenAI API call failed: {str(e)}")
    
    def get_token_count(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        return len(text) // 4


# Global client instance
openai_client = OpenAIClient()


def get_openai_client() -> OpenAI:
    """Get the raw OpenAI client instance."""
    return openai_client.client

