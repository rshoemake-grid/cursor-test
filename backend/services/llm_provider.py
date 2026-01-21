"""
LLM Provider Strategy Pattern - SOLID Principles Refactoring
Implements Open/Closed Principle - allows adding new providers without modifying existing code
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
from openai import AsyncOpenAI


class ILLMProvider(ABC):
    """Interface for LLM providers"""
    
    @abstractmethod
    def create_client(self, config: Dict[str, Any]) -> AsyncOpenAI:
        """
        Create an AsyncOpenAI client for the provider
        
        Args:
            config: Dictionary with 'api_key', 'base_url', 'model' keys
            
        Returns:
            AsyncOpenAI client instance configured for this provider
        """
        pass


class OpenAIProvider(ILLMProvider):
    """OpenAI provider implementation"""
    
    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    
    def create_client(self, config: Dict[str, Any]) -> AsyncOpenAI:
        """Create OpenAI client"""
        api_key = config.get("api_key")
        if not api_key:
            raise ValueError("api_key is required for OpenAI provider")
        
        base_url = config.get("base_url", self.DEFAULT_BASE_URL)
        
        return AsyncOpenAI(api_key=api_key, base_url=base_url)


class AnthropicProvider(ILLMProvider):
    """Anthropic provider implementation (uses OpenAI-compatible API)"""
    
    DEFAULT_BASE_URL = "https://api.anthropic.com/v1"
    
    def create_client(self, config: Dict[str, Any]) -> AsyncOpenAI:
        """Create Anthropic client (OpenAI-compatible)"""
        api_key = config.get("api_key")
        if not api_key:
            raise ValueError("api_key is required for Anthropic provider")
        
        base_url = config.get("base_url", self.DEFAULT_BASE_URL)
        
        return AsyncOpenAI(api_key=api_key, base_url=base_url)


class GeminiProvider(ILLMProvider):
    """Google Gemini provider implementation (uses OpenAI-compatible API)"""
    
    DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    
    def create_client(self, config: Dict[str, Any]) -> AsyncOpenAI:
        """Create Gemini client (OpenAI-compatible)"""
        api_key = config.get("api_key")
        if not api_key:
            raise ValueError("api_key is required for Gemini provider")
        
        base_url = config.get("base_url", self.DEFAULT_BASE_URL)
        
        return AsyncOpenAI(api_key=api_key, base_url=base_url)


class ProviderFactory:
    """Factory for creating provider instances (Strategy Pattern)"""
    
    def __init__(self):
        """Initialize factory with registered providers"""
        self._providers = {
            "openai": OpenAIProvider(),
            "anthropic": AnthropicProvider(),
            "gemini": GeminiProvider(),
            "custom": OpenAIProvider(),  # Custom providers use OpenAI-compatible format
        }
    
    def get_provider(self, provider_type: str) -> ILLMProvider:
        """
        Get provider instance for given type
        
        Args:
            provider_type: Provider type ('openai', 'anthropic', 'gemini', 'custom')
            
        Returns:
            ILLMProvider instance
            
        Raises:
            ValueError: If provider type is unknown
        """
        provider_type_lower = provider_type.lower()
        
        if provider_type_lower not in self._providers:
            raise ValueError(f"Unknown provider type: {provider_type}")
        
        return self._providers[provider_type_lower]
    
    def register_provider(self, provider_type: str, provider: ILLMProvider):
        """
        Register a new provider type (allows extension without modification)
        
        Args:
            provider_type: Provider type identifier
            provider: ILLMProvider instance
        """
        self._providers[provider_type.lower()] = provider

