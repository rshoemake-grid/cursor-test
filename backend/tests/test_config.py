"""
Tests for configuration management.
"""
import os
import pytest
from backend.config import Settings, get_settings


def test_settings_defaults():
    """Test that settings have sensible defaults"""
    settings = Settings()
    assert settings.database_url == "sqlite+aiosqlite:///./workflows.db"
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

