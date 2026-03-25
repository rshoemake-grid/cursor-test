"""
Tests for configuration management.
"""
import os
import pytest
from pathlib import Path
from backend.config import Settings, get_settings, _PROJECT_ROOT


def test_settings_defaults():
    """Test that settings have sensible defaults; SQLite file is absolute (cwd-independent)."""
    settings = Settings()
    assert settings.database_url.startswith("sqlite+aiosqlite:")
    assert settings.database_url.endswith("workflows.db")
    resolved_db = Path(_PROJECT_ROOT.resolve() / "workflows.db")
    assert resolved_db.as_posix() in settings.database_url.replace("\\", "/")
    assert settings.log_level == "INFO"
    assert settings.host == "0.0.0.0"
    assert settings.port == 8000


def test_settings_from_env(monkeypatch):
    """Test that settings can be loaded from environment variables"""
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")
    monkeypatch.setenv("PORT", "9000")
    
    # Clear cache to force reload
    get_settings.cache_clear()
    settings = get_settings()
    
    assert settings.database_url == "postgresql://test:test@localhost/test"
    assert settings.log_level == "DEBUG"
    assert settings.port == 9000


def test_settings_cors_origins():
    """Test CORS origins configuration"""
    settings = Settings()
    assert isinstance(settings.cors_origins, list)
    assert "*" in settings.cors_origins


def test_settings_execution_config():
    """Test execution-related settings"""
    settings = Settings()
    assert settings.execution_timeout > 0
    assert settings.max_concurrent_executions > 0


def test_settings_websocket_config():
    """Test WebSocket-related settings"""
    settings = Settings()
    assert settings.websocket_ping_interval > 0
    assert settings.websocket_timeout > 0



def test_settings_model_dump_safe_excludes_api_keys():
    """API keys must never appear in model_dump_safe (for logging/serialization)."""
    settings = Settings(
        openai_api_key="sk-secret-key",
        anthropic_api_key="sk-ant-secret",
        gemini_api_key="secret-gemini",
        dev_bootstrap_password="bootstrap-secret",
    )
    safe = settings.model_dump_safe()
    assert "openai_api_key" not in safe
    assert "anthropic_api_key" not in safe
    assert "gemini_api_key" not in safe
    assert "dev_bootstrap_password" not in safe
    assert "database_url" in safe


def test_settings_repr_excludes_api_keys():
    """repr(settings) must not expose API keys."""
    settings = Settings(
        openai_api_key="sk-secret-key",
        anthropic_api_key="sk-ant-secret",
        gemini_api_key="secret-gemini",
    )
    r = repr(settings)
    assert "sk-secret-key" not in r
    assert "sk-ant-secret" not in r
    assert "secret-gemini" not in r


def test_dev_bootstrap_password_not_in_repr():
    settings = Settings(dev_bootstrap_username="u", dev_bootstrap_password="secret-pass")
    assert "secret-pass" not in repr(settings)
