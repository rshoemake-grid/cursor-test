"""
Tests for LLM Provider Strategy Pattern - SOLID Principles Refactoring
Tests written first (TDD) before implementation
"""
import pytest
from unittest.mock import AsyncMock, Mock, patch, MagicMock
from typing import Dict, Any

from backend.services.llm_provider import ILLMProvider, OpenAIProvider, AnthropicProvider, GeminiProvider, ProviderFactory
from openai import AsyncOpenAI


class TestILLMProvider:
    """Test interface contract for ILLMProvider"""
    
    def test_interface_has_create_client(self):
        """ILLMProvider should have create_client method"""
        assert hasattr(ILLMProvider, 'create_client')
        assert callable(getattr(ILLMProvider, 'create_client', None))


class TestOpenAIProvider:
    """Test OpenAIProvider implementation"""
    
    @pytest.fixture
    def provider(self):
        """Create OpenAIProvider instance"""
        return OpenAIProvider()
    
    @pytest.fixture
    def config(self):
        """Create sample OpenAI config"""
        return {
            "type": "openai",
            "api_key": "sk-test-key-12345",
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4"
        }
    
    def test_create_client_returns_async_openai(self, provider, config):
        """create_client should return AsyncOpenAI instance"""
        client = provider.create_client(config)
        assert isinstance(client, AsyncOpenAI)
    
    def test_create_client_uses_api_key_from_config(self, provider, config):
        """create_client should use api_key from config"""
        client = provider.create_client(config)
        assert client.api_key == "sk-test-key-12345"
    
    def test_create_client_uses_base_url_from_config(self, provider, config):
        """create_client should use base_url from config"""
        client = provider.create_client(config)
        assert str(client.base_url).rstrip('/') == "https://api.openai.com/v1"
    
    def test_create_client_uses_default_base_url_when_not_provided(self, provider):
        """create_client should use default base_url when not in config"""
        config = {
            "type": "openai",
            "api_key": "sk-test-key",
            "model": "gpt-4"
        }
        client = provider.create_client(config)
        assert str(client.base_url).rstrip('/') == "https://api.openai.com/v1"
    
    def test_create_client_raises_on_missing_api_key(self, provider):
        """create_client should raise ValueError when api_key is missing"""
        config = {
            "type": "openai",
            "model": "gpt-4"
        }
        with pytest.raises(ValueError, match="api_key"):
            provider.create_client(config)


class TestAnthropicProvider:
    """Test AnthropicProvider implementation"""
    
    @pytest.fixture
    def provider(self):
        """Create AnthropicProvider instance"""
        return AnthropicProvider()
    
    @pytest.fixture
    def config(self):
        """Create sample Anthropic config"""
        return {
            "type": "anthropic",
            "api_key": "sk-ant-test-key-12345",
            "base_url": "https://api.anthropic.com/v1",
            "model": "claude-3-opus-20240229"
        }
    
    def test_create_client_returns_async_openai_compatible(self, provider, config):
        """create_client should return AsyncOpenAI instance (Anthropic uses OpenAI-compatible API)"""
        client = provider.create_client(config)
        assert isinstance(client, AsyncOpenAI)
    
    def test_create_client_uses_anthropic_base_url(self, provider, config):
        """create_client should use Anthropic base_url"""
        client = provider.create_client(config)
        assert str(client.base_url).rstrip('/') == "https://api.anthropic.com/v1"
    
    def test_create_client_uses_default_base_url_when_not_provided(self, provider):
        """create_client should use default Anthropic base_url when not in config"""
        config = {
            "type": "anthropic",
            "api_key": "sk-ant-test-key",
            "model": "claude-3-opus-20240229"
        }
        client = provider.create_client(config)
        assert str(client.base_url).rstrip('/') == "https://api.anthropic.com/v1"


class TestGeminiProvider:
    """Test GeminiProvider implementation"""
    
    @pytest.fixture
    def provider(self):
        """Create GeminiProvider instance"""
        return GeminiProvider()
    
    @pytest.fixture
    def config(self):
        """Create sample Gemini config"""
        return {
            "type": "gemini",
            "api_key": "test-gemini-key-12345",
            "base_url": "https://generativelanguage.googleapis.com/v1beta",
            "model": "gemini-pro"
        }
    
    def test_create_client_returns_async_openai_compatible(self, provider, config):
        """create_client should return AsyncOpenAI instance (Gemini uses OpenAI-compatible API)"""
        client = provider.create_client(config)
        assert isinstance(client, AsyncOpenAI)
    
    def test_create_client_uses_gemini_base_url(self, provider, config):
        """create_client should use Gemini base_url"""
        client = provider.create_client(config)
        assert str(client.base_url).rstrip('/') == "https://generativelanguage.googleapis.com/v1beta"
    
    def test_create_client_uses_default_base_url_when_not_provided(self, provider):
        """create_client should use default Gemini base_url when not in config"""
        config = {
            "type": "gemini",
            "api_key": "test-gemini-key",
            "model": "gemini-pro"
        }
        client = provider.create_client(config)
        assert str(client.base_url).rstrip('/') == "https://generativelanguage.googleapis.com/v1beta"


class TestProviderFactory:
    """Test ProviderFactory"""
    
    @pytest.fixture
    def factory(self):
        """Create ProviderFactory instance"""
        return ProviderFactory()
    
    def test_get_provider_returns_openai_provider(self, factory):
        """get_provider should return OpenAIProvider for 'openai' type"""
        provider = factory.get_provider("openai")
        assert isinstance(provider, OpenAIProvider)
    
    def test_get_provider_returns_anthropic_provider(self, factory):
        """get_provider should return AnthropicProvider for 'anthropic' type"""
        provider = factory.get_provider("anthropic")
        assert isinstance(provider, AnthropicProvider)
    
    def test_get_provider_returns_gemini_provider(self, factory):
        """get_provider should return GeminiProvider for 'gemini' type"""
        provider = factory.get_provider("gemini")
        assert isinstance(provider, GeminiProvider)
    
    def test_get_provider_raises_on_unknown_type(self, factory):
        """get_provider should raise ValueError for unknown provider type"""
        with pytest.raises(ValueError, match="Unknown provider type"):
            factory.get_provider("unknown-provider")
    
    def test_get_provider_case_insensitive(self, factory):
        """get_provider should handle case-insensitive provider types"""
        provider1 = factory.get_provider("OPENAI")
        provider2 = factory.get_provider("openai")
        assert isinstance(provider1, OpenAIProvider)
        assert isinstance(provider2, OpenAIProvider)
    
    def test_get_provider_custom_type(self, factory):
        """get_provider should return OpenAIProvider for 'custom' type (OpenAI-compatible)"""
        provider = factory.get_provider("custom")
        assert isinstance(provider, OpenAIProvider)  # Custom uses OpenAI-compatible format

