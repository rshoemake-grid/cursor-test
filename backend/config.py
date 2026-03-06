"""
Configuration management for the workflow engine.
Uses Pydantic Settings for type-safe configuration with environment variable support.

API keys (openai_api_key, anthropic_api_key, gemini_api_key) are never logged or exposed.
Use model_dump(exclude={"openai_api_key", "anthropic_api_key", "gemini_api_key"}) when serializing.
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache


# Fields that must never be logged or serialized
_SENSITIVE_FIELDS = frozenset({"openai_api_key", "anthropic_api_key", "gemini_api_key"})


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
    
    # CORS - Production-ready configuration
    # Set CORS_ORIGINS environment variable in production (comma-separated list)
    # Example: CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
    # Defaults to ["*"] for development, but should be restricted in production
    cors_origins: List[str] = ["*"]  # Restrict to specific domains in production
    cors_allow_credentials: bool = True
    
    # Environment
    environment: str = "development"  # Set to "production" in production
    
    # API Configuration
    api_version: str = "v1"  # API version for Apigee compatibility
    max_request_size: int = 10 * 1024 * 1024  # 10MB max request body size
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True  # P3-6: Set reload=False in production via env (ENVIRONMENT=production)
    
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

    def model_dump_safe(self, **kwargs):
        """Dump settings excluding API keys. Use when logging or serializing."""
        return self.model_dump(exclude=_SENSITIVE_FIELDS, **kwargs)

    def __repr__(self) -> str:
        """Avoid exposing API keys in repr/logs."""
        safe = self.model_dump_safe()
        return f"Settings({', '.join(f'{k}={v!r}' for k, v in safe.items())})"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


def clear_settings_cache() -> None:
    """P2-10: Clear settings cache for tests. Call in conftest or before tests that need fresh env."""
    get_settings.cache_clear()


# Global settings instance
settings = get_settings()

