"""
Tests for SettingsService - SOLID Principles Refactoring
Tests written first (TDD) before implementation
"""
import pytest
from unittest.mock import AsyncMock, Mock, patch, MagicMock
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.settings_service import ISettingsService, SettingsService
from backend.api.settings_routes import LLMSettings, LLMProvider


class TestISettingsService:
    """Test interface contract for ISettingsService"""
    
    def test_interface_has_get_active_llm_config(self):
        """ISettingsService should have get_active_llm_config method"""
        assert hasattr(ISettingsService, 'get_active_llm_config')
        assert callable(getattr(ISettingsService, 'get_active_llm_config', None))
    
    def test_interface_has_get_user_settings(self):
        """ISettingsService should have get_user_settings method"""
        assert hasattr(ISettingsService, 'get_user_settings')
        assert callable(getattr(ISettingsService, 'get_user_settings', None))
    
    def test_interface_has_get_provider_for_model(self):
        """ISettingsService should have get_provider_for_model method"""
        assert hasattr(ISettingsService, 'get_provider_for_model')
        assert callable(getattr(ISettingsService, 'get_provider_for_model', None))


class TestSettingsService:
    """Test SettingsService implementation"""
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session"""
        return AsyncMock(spec=AsyncSession)
    
    @pytest.fixture
    def mock_cache(self):
        """Create a mock settings cache"""
        return {}
    
    @pytest.fixture
    def sample_provider(self):
        """Create a sample LLM provider"""
        return LLMProvider(
            id="test-provider-1",
            name="Test Provider",
            type="openai",
            apiKey="sk-test-key-12345",
            baseUrl="https://api.openai.com/v1",
            defaultModel="gpt-4",
            models=["gpt-4", "gpt-3.5-turbo"],
            enabled=True
        )
    
    @pytest.fixture
    def sample_settings(self, sample_provider):
        """Create sample LLM settings"""
        return LLMSettings(
            providers=[sample_provider],
            iteration_limit=10,
            default_model="gpt-4"
        )
    
    @pytest.mark.asyncio
    async def test_get_active_llm_config_returns_config_when_provider_exists(self, mock_db, sample_settings):
        """get_active_llm_config should return config dict when provider exists in cache"""
        # Arrange
        cache = {"user123": sample_settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_active_llm_config("user123")
        
        # Assert
        assert config is not None
        assert config["type"] == "openai"
        assert config["api_key"] == "sk-test-key-12345"
        assert config["model"] == "gpt-4"
        assert config["base_url"] == "https://api.openai.com/v1"
    
    @pytest.mark.asyncio
    async def test_get_active_llm_config_returns_none_when_no_settings(self, mock_db):
        """get_active_llm_config should return None when no settings exist"""
        # Arrange
        cache = {}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_active_llm_config("user123")
        
        # Assert
        assert config is None
    
    @pytest.mark.asyncio
    async def test_get_active_llm_config_uses_default_model_when_set(self, mock_db, sample_provider):
        """get_active_llm_config should use default_model when specified"""
        # Arrange
        settings = LLMSettings(
            providers=[sample_provider],
            iteration_limit=10,
            default_model="gpt-3.5-turbo"  # Different from defaultModel
        )
        cache = {"user123": settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_active_llm_config("user123")
        
        # Assert
        assert config is not None
        assert config["model"] == "gpt-3.5-turbo"
    
    @pytest.mark.asyncio
    async def test_get_active_llm_config_skips_disabled_providers(self, mock_db, sample_provider):
        """get_active_llm_config should skip disabled providers"""
        # Arrange
        disabled_provider = LLMProvider(
            id="disabled-provider",
            name="Disabled Provider",
            type="openai",
            apiKey="sk-test-key",
            defaultModel="gpt-4",
            models=["gpt-4"],
            enabled=False  # Disabled
        )
        settings = LLMSettings(providers=[disabled_provider])
        cache = {"user123": settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_active_llm_config("user123")
        
        # Assert
        assert config is None
    
    @pytest.mark.asyncio
    async def test_get_active_llm_config_skips_invalid_api_keys(self, mock_db, sample_provider):
        """get_active_llm_config should skip providers with invalid API keys"""
        # Arrange
        invalid_provider = LLMProvider(
            id="invalid-provider",
            name="Invalid Provider",
            type="openai",
            apiKey="your-api-key-here",  # Placeholder
            defaultModel="gpt-4",
            models=["gpt-4"],
            enabled=True
        )
        settings = LLMSettings(providers=[invalid_provider])
        cache = {"user123": settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_active_llm_config("user123")
        
        # Assert
        assert config is None
    
    @pytest.mark.asyncio
    async def test_get_active_llm_config_anonymous_user(self, mock_db, sample_settings):
        """get_active_llm_config should handle anonymous user (None user_id)"""
        # Arrange
        cache = {"anonymous": sample_settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_active_llm_config(None)
        
        # Assert
        assert config is not None
        assert config["type"] == "openai"
    
    @pytest.mark.asyncio
    async def test_get_user_settings_returns_settings_when_exists(self, mock_db, sample_settings):
        """get_user_settings should return settings when they exist in cache"""
        # Arrange
        cache = {"user123": sample_settings}
        service = SettingsService(cache=cache)
        
        # Act
        settings = service.get_user_settings("user123")
        
        # Assert
        assert settings is not None
        assert settings.iteration_limit == 10
        assert len(settings.providers) == 1
    
    @pytest.mark.asyncio
    async def test_get_user_settings_returns_none_when_not_exists(self, mock_db):
        """get_user_settings should return None when settings don't exist"""
        # Arrange
        cache = {}
        service = SettingsService(cache=cache)
        
        # Act
        settings = service.get_user_settings("user123")
        
        # Assert
        assert settings is None
    
    @pytest.mark.asyncio
    async def test_get_provider_for_model_returns_provider_when_model_exists(self, mock_db, sample_settings):
        """get_provider_for_model should return provider config when model exists"""
        # Arrange
        cache = {"user123": sample_settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_provider_for_model("gpt-4", "user123")
        
        # Assert
        assert config is not None
        assert config["type"] == "openai"
        assert config["model"] == "gpt-4"
    
    @pytest.mark.asyncio
    async def test_get_provider_for_model_case_insensitive(self, mock_db, sample_settings):
        """get_provider_for_model should match models case-insensitively"""
        # Arrange
        cache = {"user123": sample_settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_provider_for_model("GPT-4", "user123")  # Uppercase
        
        # Assert
        assert config is not None
        assert config["model"] == "gpt-4"  # Should return original case
    
    @pytest.mark.asyncio
    async def test_get_provider_for_model_returns_none_when_model_not_found(self, mock_db, sample_settings):
        """get_provider_for_model should return None when model doesn't exist"""
        # Arrange
        cache = {"user123": sample_settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_provider_for_model("non-existent-model", "user123")
        
        # Assert
        assert config is None
    
    @pytest.mark.asyncio
    async def test_get_provider_for_model_skips_disabled_providers(self, mock_db, sample_provider):
        """get_provider_for_model should skip disabled providers"""
        # Arrange
        disabled_provider = LLMProvider(
            id="disabled-provider",
            name="Disabled Provider",
            type="openai",
            apiKey="sk-test-key",
            defaultModel="gpt-4",
            models=["gpt-4"],
            enabled=False
        )
        settings = LLMSettings(providers=[disabled_provider])
        cache = {"user123": settings}
        service = SettingsService(cache=cache)
        
        # Act
        config = service.get_provider_for_model("gpt-4", "user123")
        
        # Assert
        assert config is None

