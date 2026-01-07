"""
Configuration management for the workflow engine.
Uses Pydantic Settings for type-safe configuration with environment variable support.
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./workflows.db"
    
    # API Keys (fallback if not in settings)
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    
    # Logging
    log_level: str = "INFO"
    log_file: Optional[str] = "app.log"
    
    # CORS
    cors_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # Execution
    execution_timeout: int = 300  # seconds
    max_concurrent_executions: int = 10
    
    # WebSocket
    websocket_ping_interval: int = 20  # seconds
    websocket_timeout: int = 60  # seconds
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()

