"""
Shared utilities for provider configuration.
Eliminates code duplication across settings_routes.py and SettingsService.
"""
from typing import Dict, Any, Optional, List


def build_provider_config(
    provider_type: str,
    api_key: str,
    base_url: Optional[str],
    model: str
) -> Dict[str, Any]:
    """
    Build a provider configuration dictionary.
    
    Args:
        provider_type: Provider type (e.g., 'openai', 'anthropic')
        api_key: API key (will be stripped)
        base_url: Base URL (optional)
        model: Model name
        
    Returns:
        Dictionary with 'type', 'api_key', 'base_url', 'model' keys
    """
    return {
        "type": provider_type,
        "api_key": api_key.strip(),
        "base_url": base_url,
        "model": model
    }


def normalize_model_name(model_name: str) -> str:
    """
    Normalize model name for comparison (lowercase, strip whitespace).
    
    Args:
        model_name: Model name to normalize
        
    Returns:
        Normalized model name
    """
    return model_name.lower().strip()


def normalize_model_names(model_names: List[str]) -> List[str]:
    """
    Normalize a list of model names for comparison.
    
    Args:
        model_names: List of model names to normalize
        
    Returns:
        List of normalized model names
    """
    return [normalize_model_name(m) for m in model_names]


def find_original_model_name(
    provider_models: List[str],
    normalized_target: str
) -> Optional[str]:
    """
    Find the original model name (preserving case) from provider's models.
    
    Args:
        provider_models: List of model names from provider
        normalized_target: Normalized target model name to find
        
    Returns:
        Original model name with preserved case, or None if not found
    """
    for model in provider_models:
        if normalize_model_name(model) == normalized_target:
            return model
    return None

