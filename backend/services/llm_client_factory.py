"""
LLM Client Factory - SOLID Principles Refactoring
Extracts LLM client creation logic from routes into a factory with dependency injection
"""
from abc import ABC, abstractmethod
from typing import Optional
import os
from openai import AsyncOpenAI

from .settings_service import ISettingsService
from .llm_provider import ProviderFactory
from ..utils.logger import get_logger

logger = get_logger(__name__)


class ILLMClientFactory(ABC):
    """Interface for LLM client factory"""
    
    @abstractmethod
    def create_client(self, user_id: Optional[str] = None) -> AsyncOpenAI:
        """
        Create an AsyncOpenAI client for the user
        
        Args:
            user_id: Optional user ID, None for anonymous user
            
        Returns:
            AsyncOpenAI client instance
            
        Raises:
            ValueError: If API key is not configured
        """
        pass


class LLMClientFactory(ILLMClientFactory):
    """Implementation of LLM client factory"""
    
    def __init__(self, settings_service: ISettingsService, provider_factory: Optional[ProviderFactory] = None):
        """
        Initialize LLM client factory
        
        Args:
            settings_service: Settings service for retrieving LLM configuration
            provider_factory: Optional provider factory (creates default if not provided)
        """
        self.settings_service = settings_service
        self.provider_factory = provider_factory or ProviderFactory()
    
    def _is_placeholder_api_key(self, api_key: str) -> bool:
        """Check if API key is a placeholder"""
        from ..utils.settings_utils import is_valid_api_key
        return not is_valid_api_key(api_key)
    
    def create_client(self, user_id: Optional[str] = None) -> AsyncOpenAI:
        """Create LLM client using settings service and provider strategy"""
        # Try to get config from settings service
        llm_config = self.settings_service.get_active_llm_config(user_id)
        
        api_key = None
        base_url = None
        provider_type = "openai"
        
        if llm_config:
            api_key = llm_config.get("api_key")
            base_url = llm_config.get("base_url")
            provider_type = llm_config.get("type", "openai")
            
            logger.info(f"Using LLM config from settings: type={provider_type}, model={llm_config.get('model')}")
            
            # Validate API key is not a placeholder
            if api_key and self._is_placeholder_api_key(api_key):
                raise ValueError(
                    "Invalid API key detected. Please go to Settings, add an LLM provider with a valid API key, "
                    "enable it, and click 'Sync Now'."
                )
        
        # Fallback to environment variable
        if not api_key:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                logger.warning("Using API key from environment variable")
        
        if not api_key:
            raise ValueError(
                "OpenAI API key not configured. Please go to Settings, add an LLM provider with a valid API key, "
                "enable it, and click 'Sync Now'."
            )
        
        # Use provider strategy to create client
        provider = self.provider_factory.get_provider(provider_type)
        config = {
            "api_key": api_key,
            "base_url": base_url,
        }
        
        return provider.create_client(config)

