"""
Settings Service - SOLID Principles Refactoring
Extracts settings management logic from routes into a service layer
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

if TYPE_CHECKING:
    from ..api.settings_routes import LLMSettings, LLMProvider

# Type alias for better type hints (DRY - avoid Optional[Any] with comments)
if TYPE_CHECKING:
    LLMSettingsType = LLMSettings
else:
    LLMSettingsType = Any

from ..utils.logger import get_logger
from ..utils.provider_utils import (
    normalize_model_name,
    normalize_model_names,
    find_original_model_name,
    build_provider_config
)
from ..utils.settings_utils import is_valid_api_key
from ..database.models import SettingsDB

logger = get_logger(__name__)

# Constants
ANONYMOUS_USER_ID = "anonymous"


class ISettingsService(ABC):
    """Interface for settings service operations"""
    
    @abstractmethod
    async def load_settings_into_cache(self, db: AsyncSession) -> None:
        """
        Load all settings from database into cache (called on server startup)
        
        Args:
            db: Database session
        """
        pass
    
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
    def get_user_settings(self, user_id: Optional[str] = None) -> Optional[LLMSettingsType]:
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
        """
        Get reference to global settings cache.
        
        Uses shared cache module to avoid dependency on settings_routes (DIP compliance).
        """
        from ..utils.settings_cache import get_settings_cache
        return get_settings_cache()
    
    def _normalize_user_id(self, user_id: Optional[str]) -> str:
        """
        Normalize user ID (DRY - single source of truth for anonymous handling).
        
        Args:
            user_id: User ID or None
            
        Returns:
            Normalized user ID string
        """
        return user_id if user_id else ANONYMOUS_USER_ID
    
    def _get_settings_from_cache(self, uid: str) -> Optional[LLMSettingsType]:
        """
        Get settings from cache with consistent error handling (DRY - extracted cache lookup).
        
        Args:
            uid: Normalized user ID
            
        Returns:
            Settings object if found, None otherwise
        """
        if uid not in self._cache:
            logger.warning(f"User {uid} not found in cache")
            return None
        return self._cache[uid]
    
    async def load_settings_into_cache(self, db: AsyncSession) -> None:
        """
        Load all settings from database into cache (called on server startup).
        
        Moved from settings_routes.py to follow SRP - settings management belongs in SettingsService.
        Refactored to extract parsing logic (DRY).
        
        Args:
            db: Database session
        """
        try:
            result = await db.execute(select(SettingsDB))
            all_settings = result.scalars().all()
            
            for settings_db in all_settings:
                if settings_db.settings_data:
                    self._parse_and_cache_settings(settings_db)
            
            logger.info(f"Loaded {len(self._cache)} user settings into cache")
        except Exception as e:
            logger.error(f"Failed to load settings into cache: {e}", exc_info=True)
    
    def _get_llm_settings_class(self):
        """
        Get LLMSettings class (DRY - extracted import to avoid duplication).
        
        Returns:
            LLMSettings class
        """
        from ..api.settings_routes import LLMSettings
        return LLMSettings
    
    def _parse_and_cache_settings(self, settings_db: Any) -> None:
        """
        Parse settings data and add to cache (DRY - extracted parsing logic).
        
        Args:
            settings_db: Settings database record
        """
        LLMSettings = self._get_llm_settings_class()
        settings = LLMSettings(**settings_db.settings_data)
        self._cache[settings_db.user_id] = settings
        logger.info(f"Loaded settings for user: {settings_db.user_id} ({len(settings.providers)} providers)")
    
    def _is_provider_enabled_and_valid(self, provider: Any) -> bool:
        """
        Check if provider is enabled and has valid API key (DRY).
        
        Args:
            provider: Provider object
            
        Returns:
            True if provider is enabled and has valid API key
        """
        return (
            provider.enabled and
            provider.apiKey and
            is_valid_api_key(provider.apiKey)
        )
    
    def _build_provider_config_with_logging(
        self,
        provider: Any,
        model_name: str,
        user_id: str,
        log_message: str
    ) -> Dict[str, Any]:
        """
        Build provider config and log (DRY - extracted config building with logging).
        
        Args:
            provider: Provider object
            model_name: Model name to use
            user_id: User ID for logging
            log_message: Log message template
            
        Returns:
            Provider config dictionary
        """
        config = build_provider_config(
            provider.type,
            provider.apiKey,
            provider.baseUrl,
            model_name
        )
        logger.info(log_message.format(provider=provider.name, model=model_name, user=user_id))
        return config
    
    def _find_provider_with_model(
        self,
        providers: List[Any],
        target_model: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find provider that has the specified model (DRY - reusable provider matching logic).
        
        Refactored to use extracted config building helper (DRY).
        
        Args:
            providers: List of provider objects
            target_model: Model name to find
            user_id: User ID for logging
            
        Returns:
            Provider config dict if found, None otherwise
        """
        normalized_target = normalize_model_name(target_model)
        
        for provider in providers:
            if not self._is_provider_enabled_and_valid(provider) or not provider.models:
                continue
            
            normalized_provider_models = normalize_model_names(provider.models)
            if normalized_target in normalized_provider_models:
                original_model_name = find_original_model_name(
                    provider.models,
                    normalized_target
                ) or target_model
                
                return self._build_provider_config_with_logging(
                    provider,
                    original_model_name,
                    user_id,
                    "Found provider '{provider}' with model '{model}' for user {user}"
                )
        
        return None
    
    def _get_first_enabled_provider(
        self,
        providers: List[Any],
        user_id: str,
        model_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get first enabled provider's config (DRY - reusable provider selection logic).
        
        Refactored to use extracted config building helper (DRY).
        
        Args:
            providers: List of provider objects
            user_id: User ID for logging
            model_name: Optional model name to use (defaults to provider's defaultModel)
            
        Returns:
            Provider config dict if found, None otherwise
        """
        for provider in providers:
            if not self._is_provider_enabled_and_valid(provider):
                logger.debug(f"Skipping provider {provider.name}: enabled={provider.enabled}, has_key={bool(provider.apiKey)}")
                continue
            
            model = model_name or provider.defaultModel
            return self._build_provider_config_with_logging(
                provider,
                model,
                user_id,
                "Using provider '{provider}' with model '{model}' for user {user}"
            )
        
        return None
    
    def get_active_llm_config(self, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get the first enabled LLM provider for a user.
        
        Refactored to use extracted helper methods (DRY).
        
        Args:
            user_id: User ID, or None for anonymous user
            
        Returns:
            Dict with 'type', 'api_key', 'base_url', 'model' keys, or None if not found
        """
        uid = self._normalize_user_id(user_id)
        
        logger.debug(f"Getting LLM config for user: {uid}, cache keys: {list(self._cache.keys())}")
        
        settings = self._get_settings_from_cache(uid)
        if not settings:
            return None
        
        # If default_model is set, try to find provider that has that model
        if settings.default_model:
            config = self._find_provider_with_model(
                settings.providers,
                settings.default_model,
                uid
            )
            if config:
                return config
        
        # Fallback to first enabled provider's defaultModel
        config = self._get_first_enabled_provider(settings.providers, uid)
        if not config:
            logger.warning(f"No enabled provider with valid API key found for user {uid}")
        
        return config
    
    def get_user_settings(self, user_id: Optional[str] = None) -> Optional[LLMSettingsType]:
        """
        Get full LLM settings (including iteration_limit) for a user.
        
        Refactored to use normalized user ID helper (DRY).
        Includes fallback to anonymous settings if user-specific settings not found.
        
        Args:
            user_id: User ID, or None for anonymous user
            
        Returns:
            LLMSettings object if found, None otherwise
        """
        uid = self._normalize_user_id(user_id)
        
        # Try cache first
        if uid in self._cache:
            return self._cache[uid]
        
        # Fallback to anonymous settings if user not found (only if user_id was provided)
        if user_id and ANONYMOUS_USER_ID in self._cache:
            logger.debug(f"User {uid} not found, falling back to anonymous settings")
            return self._cache[ANONYMOUS_USER_ID]
        
        logger.warning(f"User {uid} not found in cache")
        return None
    
    def get_provider_for_model(self, model_name: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Find the provider that owns the given model name.
        
        Refactored to use extracted helper methods (DRY).
        
        Args:
            model_name: Name of the model to find
            user_id: User ID, or None for anonymous user
            
        Returns:
            Dict with provider config, or None if not found
        """
        uid = self._normalize_user_id(user_id)
        
        settings = self._get_settings_from_cache(uid)
        if not settings:
            return None
        
        logger.debug(f"Searching for provider for model '{model_name}' (user: {uid})")
        
        return self._find_provider_with_model(settings.providers, model_name, uid)
