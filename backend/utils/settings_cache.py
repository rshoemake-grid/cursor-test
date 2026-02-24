"""
Settings Cache - Shared cache storage for LLM settings.
Extracted to eliminate dependency between settings_routes and settings_service (DIP compliance).
"""
from typing import Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from ..api.settings_routes import LLMSettings

# In-memory cache (for quick access, backed by database)
# This is the single source of truth for settings cache
_settings_cache: Dict[str, Any] = {}


def get_settings_cache() -> Dict[str, Any]:
    """
    Get reference to the global settings cache.
    
    Returns:
        Dictionary mapping user_id to LLMSettings objects
    """
    return _settings_cache


def clear_settings_cache() -> None:
    """
    Clear all settings from cache (useful for testing).
    """
    _settings_cache.clear()
