"""
Configuration for AI Service
Loads environment variables and OpenAI settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """AI Service Configuration"""
    
    # OpenAI Configuration
    OPENAI_API_KEY: str
    MODEL_NAME: str = "gpt-4o-mini"
    MAX_TOKENS: int = 2000
    TEMPERATURE: float = 0.3
    
    # Service Configuration
    AI_SERVICE_PORT: int = 8001
    
    # LangFuse Configuration (Optional - for AI observability)
    LANGFUSE_ENABLED: bool = False
    LANGFUSE_SECRET_KEY: Optional[str] = None
    LANGFUSE_PUBLIC_KEY: Optional[str] = None
    LANGFUSE_HOST: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
