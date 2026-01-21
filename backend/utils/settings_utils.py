"""
Shared utilities for settings validation.
Eliminates code duplication between settings_routes.py and SettingsService.
"""
from typing import Optional


def is_valid_api_key(api_key: Optional[str]) -> bool:
    """
    Check if API key is not a placeholder.
    
    Args:
        api_key: API key string to validate
        
    Returns:
        True if API key appears valid, False if it's a placeholder
    """
    if not api_key:
        return False
    
    # Trim whitespace
    api_key = api_key.strip()
    if not api_key:
        return False
    
    # If it's very short, it's likely a placeholder
    if len(api_key) < 10:
        return False
    
    api_key_lower = api_key.lower()
    
    # Only flag exact placeholder matches - be very conservative
    exact_placeholders = [
        "your-api-key-here",
        "your-api*****here",
        "sk-your-api-key-here",
        "sk-your-api*****here",
        "your-api-key",
        "api-key-here"
    ]
    
    # Check exact matches (case-insensitive)
    if api_key_lower in [p.lower() for p in exact_placeholders]:
        return False
    
    # Check if it's exactly a placeholder pattern (very short and contains placeholder text)
    # Only flag if it's clearly a placeholder, not if it's a real key that happens to contain these words
    if len(api_key) < 25 and ("your-api-key-here" in api_key_lower or "your-api*****here" in api_key_lower):
        return False
    
    # Check for masked placeholder pattern (short key with asterisks and "here")
    if len(api_key) < 30 and "*****here" in api_key:
        return False
    
    # If we get here, assume it's valid (connection test will catch real issues)
    return True

