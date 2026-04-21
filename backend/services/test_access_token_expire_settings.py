"""Settings validation for JWT access token lifetime."""
import pytest
from pydantic import ValidationError

from backend.config import Settings, clear_settings_cache


def test_access_token_expire_minutes_defaults_and_minimum():
    clear_settings_cache()
    s = Settings()
    assert s.access_token_expire_minutes == 30
    clear_settings_cache()


def test_access_token_expire_minutes_accepts_twenty():
    clear_settings_cache()
    s = Settings(access_token_expire_minutes=20)
    assert s.access_token_expire_minutes == 20
    clear_settings_cache()


def test_access_token_expire_minutes_rejects_below_twenty():
    clear_settings_cache()
    with pytest.raises(ValidationError):
        Settings(access_token_expire_minutes=19)
    clear_settings_cache()
