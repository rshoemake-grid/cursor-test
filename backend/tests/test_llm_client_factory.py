"""
Tests for LLMClientFactory - SOLID Principles Refactoring
Tests written first (TDD) before implementation
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from typing import Optional, Dict, Any

from backend.services.llm_client_factory import ILLMClientFactory, LLMClientFactory
from backend.services.settings_service import ISettingsService
from openai import AsyncOpenAI


class TestILLMClientFactory:
    """Test interface contract for ILLMClientFactory"""
    
    def test_interface_has_create_client(self):
        """ILLMClientFactory should have create_client method"""
        assert hasattr(ILLMClientFactory, 'create_client')
        assert callable(getattr(ILLMClientFactory, 'create_client', None))


class TestLLMClientFactory:
    """Test LLMClientFactory implementation"""
    
    @pytest.fixture
    def mock_settings_service(self):
        """Create mock settings service"""
        service = Mock(spec=ISettingsService)
        return service
    
    @pytest.fixture
    def factory(self, mock_settings_service):
        """Create LLMClientFactory instance"""
        return LLMClientFactory(mock_settings_service)
    
    @pytest.fixture
    def sample_config(self):
        """Create sample LLM config"""
        return {
            "type": "openai",
            "api_key": "sk-test-key-12345",
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4"
        }
    
    def test_create_client_uses_settings_service(self, factory, mock_settings_service, sample_config):
        """create_client should use settings service to get config"""
        mock_settings_service.get_active_llm_config.return_value = sample_config
        
        client = factory.create_client("user123")
        
        mock_settings_service.get_active_llm_config.assert_called_once_with("user123")
        assert isinstance(client, AsyncOpenAI)
    
    def test_create_client_returns_openai_client(self, factory, mock_settings_service, sample_config):
        """create_client should return AsyncOpenAI client"""
        mock_settings_service.get_active_llm_config.return_value = sample_config
        
        client = factory.create_client("user123")
        
        assert isinstance(client, AsyncOpenAI)
        assert client.api_key == "sk-test-key-12345"
    
    def test_create_client_handles_none_user_id(self, factory, mock_settings_service, sample_config):
        """create_client should handle None user_id (anonymous user)"""
        mock_settings_service.get_active_llm_config.return_value = sample_config
        
        client = factory.create_client(None)
        
        mock_settings_service.get_active_llm_config.assert_called_once_with(None)
        assert isinstance(client, AsyncOpenAI)
    
    def test_create_client_falls_back_to_env_when_no_config(self, factory, mock_settings_service):
        """create_client should fall back to environment variable when no config"""
        mock_settings_service.get_active_llm_config.return_value = None
        
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'sk-env-key-12345'}):
            client = factory.create_client("user123")
            
            assert isinstance(client, AsyncOpenAI)
            assert client.api_key == "sk-env-key-12345"
    
    def test_create_client_raises_when_no_config_and_no_env(self, factory, mock_settings_service):
        """create_client should raise ValueError when no config and no env var"""
        mock_settings_service.get_active_llm_config.return_value = None
        
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="OpenAI API key not configured"):
                factory.create_client("user123")
    
    def test_create_client_validates_api_key_placeholder(self, factory, mock_settings_service):
        """create_client should reject placeholder API keys"""
        config_with_placeholder = {
            "type": "openai",
            "api_key": "your-api-key-here",
            "model": "gpt-4"
        }
        mock_settings_service.get_active_llm_config.return_value = config_with_placeholder
        
        with pytest.raises(ValueError, match="Invalid API key"):
            factory.create_client("user123")
    
    def test_create_client_uses_provider_strategy(self, factory, mock_settings_service):
        """create_client should use provider strategy pattern"""
        anthropic_config = {
            "type": "anthropic",
            "api_key": "sk-ant-test-key",
            "base_url": "https://api.anthropic.com/v1",
            "model": "claude-3-opus-20240229"
        }
        mock_settings_service.get_active_llm_config.return_value = anthropic_config
        
        client = factory.create_client("user123")
        
        assert isinstance(client, AsyncOpenAI)
        assert str(client.base_url).rstrip('/') == "https://api.anthropic.com/v1"
    
    def test_create_client_handles_custom_base_url(self, factory, mock_settings_service):
        """create_client should handle custom base_url from config"""
        custom_config = {
            "type": "openai",
            "api_key": "sk-test-key",
            "base_url": "https://custom-api.example.com/v1",
            "model": "gpt-4"
        }
        mock_settings_service.get_active_llm_config.return_value = custom_config
        
        client = factory.create_client("user123")
        
        assert str(client.base_url).rstrip('/') == "https://custom-api.example.com/v1"
    
    def test_create_client_uses_default_base_url_when_not_in_config(self, factory, mock_settings_service):
        """create_client should use default base_url when not in config"""
        config_no_base_url = {
            "type": "openai",
            "api_key": "sk-test-key",
            "model": "gpt-4"
        }
        mock_settings_service.get_active_llm_config.return_value = config_no_base_url
        
        client = factory.create_client("user123")
        
        # OpenAIProvider should use default base_url
        assert str(client.base_url).rstrip('/') == "https://api.openai.com/v1"

