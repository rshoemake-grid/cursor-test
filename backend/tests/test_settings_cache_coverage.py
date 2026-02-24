"""
Tests for settings_cache coverage gaps.
"""
from backend.utils.settings_cache import get_settings_cache, clear_settings_cache


def test_clear_settings_cache():
    """Test clear_settings_cache function (line 29)"""
    cache = get_settings_cache()
    
    # Add some data
    cache["test-user"] = {"test": "data"}
    assert len(cache) > 0
    
    # Clear cache
    clear_settings_cache()
    
    # Verify cache is empty
    assert len(cache) == 0
