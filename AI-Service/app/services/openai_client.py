"""
OpenAI Client Wrapper
Handles all OpenAI API calls with error handling
Supports optional LangFuse integration for observability
"""
from openai import OpenAI
from app.config import settings
import json
from typing import Dict, Any, Optional

# LangFuse integration (optional)
langfuse_client = None
if settings.LANGFUSE_ENABLED and settings.LANGFUSE_SECRET_KEY and settings.LANGFUSE_PUBLIC_KEY:
    try:
        from langfuse import Langfuse
        from langfuse.openai import openai as langfuse_openai
        langfuse_client = Langfuse(
            secret_key=settings.LANGFUSE_SECRET_KEY,
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            host=settings.LANGFUSE_HOST
        )
        print("✅ LangFuse observability enabled")
    except ImportError:
        print("⚠️ LangFuse package not installed, running without observability")
    except Exception as e:
        print(f"⚠️ LangFuse initialization failed: {e}")
else:
    print("ℹ️ LangFuse disabled or not configured")


class OpenAIClient:
    """Wrapper for OpenAI API calls with optional LangFuse tracing"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.MODEL_NAME
        self.max_tokens = settings.MAX_TOKENS
        self.temperature = settings.TEMPERATURE
        self.langfuse = langfuse_client
    
    async def get_structured_response(
        self, 
        system_prompt: str, 
        user_prompt: str,
        trace_name: Optional[str] = None,
        trace_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get structured JSON response from OpenAI
        
        Args:
            system_prompt: System role instructions
            user_prompt: User message with data to process
            trace_name: Optional name for LangFuse trace (e.g., "cv_parsing", "job_matching")
            trace_metadata: Optional metadata for LangFuse trace
            
        Returns:
            Parsed JSON response
            
        Raises:
            Exception: If API call fails or JSON parsing fails
        """
        trace = None
        generation = None
        
        try:
            # Start LangFuse trace if enabled
            if self.langfuse and trace_name:
                trace = self.langfuse.trace(
                    name=trace_name,
                    metadata=trace_metadata or {}
                )
                generation = trace.generation(
                    name=f"{trace_name}_generation",
                    model=self.model,
                    input={
                        "system_prompt": system_prompt[:500] + "..." if len(system_prompt) > 500 else system_prompt,
                        "user_prompt": user_prompt[:500] + "..." if len(user_prompt) > 500 else user_prompt
                    }
                )
            
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
            
            # Log to LangFuse if enabled
            if generation:
                generation.end(
                    output=content[:1000] + "..." if len(content) > 1000 else content,
                    usage={
                        "input": response.usage.prompt_tokens if response.usage else 0,
                        "output": response.usage.completion_tokens if response.usage else 0,
                        "total": response.usage.total_tokens if response.usage else 0
                    }
                )
            
            if trace:
                trace.update(status_message="success")
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            if trace:
                trace.update(status_message=f"JSON parse error: {str(e)}")
            raise Exception(f"Failed to parse OpenAI response as JSON: {str(e)}")
        except Exception as e:
            if trace:
                trace.update(status_message=f"Error: {str(e)}")
            raise Exception(f"OpenAI API call failed: {str(e)}")
        finally:
            # Flush LangFuse events
            if self.langfuse:
                try:
                    self.langfuse.flush()
                except:
                    pass
    
    def get_token_count(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        return len(text) // 4


# Global client instance
openai_client = OpenAIClient()


def get_openai_client() -> OpenAI:
    """Get the raw OpenAI client instance."""
    return openai_client.client

