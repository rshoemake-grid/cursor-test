"""
Configuration management for the workflow engine.
Uses Pydantic Settings for type-safe configuration with environment variable support.

API keys (openai_api_key, anthropic_api_key, gemini_api_key) are never logged or exposed.
Use model_dump(exclude={"openai_api_key", "anthropic_api_key", "gemini_api_key"}) when serializing.
"""
from pathlib import Path
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings
from typing_extensions import Self

from sqlalchemy.engine.url import make_url

# Repository root (parent of backend/). SQLite paths relative to CWD caused different DB files per launch.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _resolve_sqlite_url_if_relative(url_str: str) -> str:
    """Point relative SQLite file paths at project root so password/data persist regardless of process CWD."""
    try:
        u = make_url(url_str)
    except Exception:
        return url_str
    if not u.drivername.startswith("sqlite") or not u.database:
        return url_str
    p = Path(u.database)
    if p.is_absolute():
        return url_str
    abs_path = (_PROJECT_ROOT / p).resolve()
    return u.set(database=str(abs_path)).render_as_string(hide_password=False)


# Fields that must never be logged or serialized
_SENSITIVE_FIELDS = frozenset({
    "openai_api_key",
    "anthropic_api_key",
    "gemini_api_key",
    "dev_bootstrap_password",
})


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database (relative SQLite paths are resolved to _PROJECT_ROOT / file — see _normalize_sqlite_database_path)
    database_url: str = "sqlite+aiosqlite:///./workflows.db"

    # Development only: on startup, set this user's password (must run ENVIRONMENT=development)
    dev_bootstrap_username: Optional[str] = Field(default=None, description="DEV_BOOTSTRAP_USERNAME")
    dev_bootstrap_password: Optional[str] = Field(default=None, description="DEV_BOOTSTRAP_PASSWORD")
    
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

    @model_validator(mode="after")
    def _normalize_sqlite_database_path(self) -> Self:
        normalized = _resolve_sqlite_url_if_relative(self.database_url)
        if normalized != self.database_url:
            object.__setattr__(self, "database_url", normalized)
        return self

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

