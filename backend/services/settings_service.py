"""
Settings Service - SOLID Principles Refactoring
Extracts settings management logic from routes into a service layer
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from ..api.settings_routes import LLMSettings, LLMProvider

from ..utils.logger import get_logger

logger = get_logger(__name__)


class ISettingsService(ABC):
    """Interface for settings service operations"""
    
    @abstractmethod
    def get_active_llm_config(self, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get the first enabled LLM provider configuration for a user
        
        Args:
            user_id: User ID, or None for anonymous user
            
        Returns:
            Dict with 'type', 'api_key', 'base_url', 'model' keys, or None if not found
        """
        pass
    
    @abstractmethod
    def get_user_settings(self, user_id: Optional[str] = None) -> Optional[Any]:  # LLMSettings
        """
        Get full LLM settings (including iteration_limit) for a user
        
        Args:
            user_id: User ID, or None for anonymous user
            
        Returns:
            LLMSettings object if found, None otherwise
        """
        pass
    
    @abstractmethod
    def get_provider_for_model(self, model_name: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Find the provider that owns the given model name
        
        Args:
            model_name: Name of the model to find
            user_id: User ID, or None for anonymous user
            
        Returns:
            Dict with provider config, or None if not found
        """
        pass


class SettingsService(ISettingsService):
    """Implementation of settings service"""
    
    def __init__(self, cache: Optional[Dict[str, Any]] = None):
        """
        Initialize settings service
        
        Args:
            cache: Optional cache dictionary. If None, uses the global cache from settings_routes
        """
        self._cache = cache if cache is not None else self._get_global_cache()
    
    def _get_global_cache(self) -> Dict[str, Any]:
        """Get reference to global settings cache"""
        from ..api.settings_routes import _settings_cache
        return _settings_cache
    
    def _is_valid_api_key(self, api_key: str) -> bool:
        """Check if API key is not a placeholder"""
        from ..utils.settings_utils import is_valid_api_key
        return is_valid_api_key(api_key)
    
    def get_active_llm_config(self, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get the first enabled LLM provider for a user"""
        uid = user_id if user_id else "anonymous"
        
        logger.debug(f"Getting LLM config for user: {uid}, cache keys: {list(self._cache.keys())}")
        
        settings = self._cache.get(uid)
        
        if not settings:
            logger.warning(f"User {uid} not found in cache")
            return None
        
        # If default_model is set, try to find provider that has that model
        if settings.default_model:
            for provider in settings.providers:
                if provider.enabled and provider.apiKey and self._is_valid_api_key(provider.apiKey):
                    from ..utils.provider_utils import normalize_model_name, normalize_model_names
                    normalized_selected = normalize_model_name(settings.default_model)
                    normalized_provider_models = normalize_model_names(provider.models)
                    if normalized_selected in normalized_provider_models:
                        from ..utils.provider_utils import find_original_model_name, build_provider_config
                        original_model_name = find_original_model_name(
                            provider.models,
                            normalized_selected
                        ) or settings.default_model
                        config = build_provider_config(
                            provider.type,
                            provider.apiKey,
                            provider.baseUrl,
                            original_model_name
                        )
                        logger.info(f"Using provider {provider.name} with selected model {original_model_name} for user {uid}")
                        return config
        
        # Fallback to first enabled provider's defaultModel
        for provider in settings.providers:
            logger.debug(f"Checking provider {provider.name}: enabled={provider.enabled}, has_key={len(provider.apiKey) > 0}")
            if provider.enabled and provider.apiKey and self._is_valid_api_key(provider.apiKey):
                from ..utils.provider_utils import build_provider_config
                config = build_provider_config(
                    provider.type,
                    provider.apiKey,
                    provider.baseUrl,
                    provider.defaultModel
                )
                logger.info(f"Using provider {provider.name} with default model {provider.defaultModel} for user {uid}")
                return config
        
        logger.warning(f"No enabled provider with valid API key found for user {uid}")
        return None
    
    def get_user_settings(self, user_id: Optional[str] = None) -> Optional[Any]:  # LLMSettings
        """Get full LLM settings (including iteration_limit) for a user"""
        uid = user_id if user_id else "anonymous"
        
        # Try cache first
        if uid in self._cache:
            return self._cache[uid]
        elif user_id and "anonymous" in self._cache:
            # Fallback to anonymous settings if user not found
            return self._cache["anonymous"]
        
        logger.warning(f"User {uid} not found in cache")
        return None
    
    def get_provider_for_model(self, model_name: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Find the provider that owns the given model name"""
        uid = user_id if user_id else "anonymous"
        
        if uid not in self._cache:
            logger.warning(f"No settings found in cache for user '{uid}'")
            return None
        
        settings = self._cache[uid]
        
        logger.debug(f"Searching for provider for model '{model_name}' (user: {uid})")
        
        from ..utils.provider_utils import (
            normalize_model_name, normalize_model_names,
            find_original_model_name, build_provider_config
        )
        normalized_model_name = normalize_model_name(model_name)
        
        for provider in settings.providers:
            logger.debug(f"Checking provider '{provider.name}': enabled={provider.enabled}, has_key={bool(provider.apiKey)}")
            
            if provider.enabled and provider.apiKey and self._is_valid_api_key(provider.apiKey) and provider.models:
                normalized_provider_models = normalize_model_names(provider.models)
                if normalized_model_name in normalized_provider_models:
                    original_model_name = find_original_model_name(
                        provider.models,
                        normalized_model_name
                    ) or model_name
                    logger.info(f"Found provider '{provider.name}' for model '{model_name}' (matched: {original_model_name})")
                    return build_provider_config(
                        provider.type,
                        provider.apiKey,
                        provider.baseUrl,
                        original_model_name
                    )
        
        logger.warning(f"No provider found for model '{model_name}'")
        return None

