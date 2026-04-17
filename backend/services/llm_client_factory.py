"""
LLM Client Factory - SOLID Principles Refactoring
Extracts LLM client creation logic from routes into a factory with dependency injection
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import os
from openai import AsyncOpenAI

from .settings_service import ISettingsService
from .llm_provider import ProviderFactory
from ..utils.logger import get_logger

logger = get_logger(__name__)


class ILLMClientFactory(ABC):
    """Interface for LLM client factory"""
    
    @abstractmethod
    def create_client(
        self,
        user_id: Optional[str] = None,
        llm_config: Optional[Dict[str, Any]] = None,
    ) -> AsyncOpenAI:
        """
        Create an AsyncOpenAI client for the user
        
        Args:
            user_id: Optional user ID, None for anonymous user
            llm_config: Optional resolved provider config (e.g. workflow chat model); if None, uses active settings
            
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
    
    def create_client(
        self,
        user_id: Optional[str] = None,
        llm_config: Optional[Dict[str, Any]] = None,
    ) -> AsyncOpenAI:
        """Create LLM client using settings service and provider strategy"""
        if llm_config is None:
            llm_config = self.settings_service.get_active_llm_config(user_id)
        
        api_key = None
        base_url = None
        provider_type = "openai"
        
        if llm_config:
            api_key = llm_config.get("api_key") or llm_config.get("apiKey")
            base_url = llm_config.get("base_url")
            provider_type = llm_config.get("type", "openai")
            
            logger.info(f"Using LLM config from settings: type={provider_type}, model={llm_config.get('model')}")
            
            if api_key and self._is_placeholder_api_key(api_key):
                if str(provider_type).lower() == "gemini":
                    from ..utils.vertex_gemini import vertex_ai_configured

                    if vertex_ai_configured():
                        logger.info("Gemini placeholder API key ignored; using Vertex AI with ADC")
                        api_key = None
                    else:
                        raise ValueError(
                            "Invalid API key detected. Please go to Settings, add an LLM provider with a valid API key, "
                            "enable it, and click 'Sync Now'."
                        )
                else:
                    raise ValueError(
                        "Invalid API key detected. Please go to Settings, add an LLM provider with a valid API key, "
                        "enable it, and click 'Sync Now'."
                    )
        
        provider_type_lower = str(provider_type).lower() if provider_type else "openai"

        if not api_key:
            if provider_type_lower == "gemini":
                api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if not api_key:
                api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                logger.warning("Using API key from environment variable")

        if provider_type_lower == "gemini" and (not api_key or not str(api_key).strip()):
            from ..utils.vertex_gemini import create_vertex_async_openai_client, resolve_project_and_location
            from ..utils.vertex_gemini import vertex_openai_model_id

            model_for_vertex = ""
            if llm_config is not None and llm_config.get("model"):
                model_for_vertex = str(llm_config.get("model")).strip()

            try:
                project_id, location = resolve_project_and_location(
                    model_for_vertex if model_for_vertex else None
                )
            except RuntimeError as e:
                raise ValueError(
                    "Gemini API key not configured and Vertex AI is not available. "
                    "Set GEMINI_API_KEY or GOOGLE_API_KEY, or set GOOGLE_CLOUD_PROJECT (or GCP_PROJECT) "
                    "and run: gcloud auth application-default login"
                ) from e

            if llm_config is not None and llm_config.get("model"):
                llm_config["model"] = vertex_openai_model_id(model_for_vertex)
            logger.info(
                "Gemini: using Vertex AI OpenAI-compatible endpoint with ADC (project=%s location=%s)",
                project_id,
                location,
            )
            return create_vertex_async_openai_client(project_id, location)

        if not api_key:
            raise ValueError(
                "OpenAI API key not configured. Please go to Settings, add an LLM provider with a valid API key, "
                "enable it, and click 'Sync Now'."
            )
        
        provider = self.provider_factory.get_provider(provider_type_lower)
        config = {
            "api_key": api_key,
            "base_url": base_url,
        }
        
        return provider.create_client(config)

