"""
Tests for settings_service coverage gaps.
"""
import pytest
from unittest.mock import MagicMock, patch
from backend.services.settings_service import SettingsService
from backend.utils.settings_cache import get_settings_cache, clear_settings_cache


def test_get_active_llm_config_no_provider_found():
    """Test get_active_llm_config when no provider found (lines 290-291)"""
    cache = {}
    service = SettingsService(cache=cache)
    
    # Add settings but no providers
    from backend.api.settings_routes import LLMSettings, LLMProvider
    
    settings = LLMSettings(
        providers=[],
        iteration_limit=10,
        default_model=None
    )
    cache["test-user"] = settings
    
    result = service.get_active_llm_config("test-user")
    assert result is None


def test_get_user_settings_fallback_to_anonymous():
    """Test get_user_settings fallback to anonymous (lines 358-359)"""
    cache = {}
    service = SettingsService(cache=cache)
    
    from backend.api.settings_routes import LLMSettings, LLMProvider
    
    # Create anonymous settings
    anonymous_settings = LLMSettings(
        providers=[],
        iteration_limit=10,
        default_model=None
    )
    cache["anonymous"] = anonymous_settings
    
    # Try to get settings for a user that doesn't exist
    # Should fallback to anonymous
    result = service.get_user_settings("non-existent-user")
    assert result == anonymous_settings


def test_get_user_settings_no_fallback_when_user_id_none():
    """Test get_user_settings doesn't fallback when user_id is None"""
    cache = {}
    service = SettingsService(cache=cache)
    
    from backend.api.settings_routes import LLMSettings
    
    # Create anonymous settings
    anonymous_settings = LLMSettings(
        providers=[],
        iteration_limit=10,
        default_model=None
    )
    cache["anonymous"] = anonymous_settings
    
    # When user_id is None, should return anonymous directly (not fallback)
    result = service.get_user_settings(None)
    assert result == anonymous_settings
