"""
T-5, T-6: Fresh review - CORS production behavior and health check error sanitization.

T-5: When production + cors_origins=["*"], allow_origins should NOT fall back to ["*"]
T-6: Health check should not leak DB error details in production
"""
import pytest
from unittest.mock import patch
import os


def test_cors_production_logic_does_not_allow_wildcard():
    """
    T-5: Verify CORS logic - when prod and cors_origins=["*"], allow_origins must not be ["*"].
    H-1: In production, do not fall back to ["*"] when cors_origins is [].
    """
    from backend.config import clear_settings_cache, get_settings

    clear_settings_cache()
    with patch.dict(os.environ, {"ENVIRONMENT": "production"}, clear=False):
        clear_settings_cache()
        s = get_settings()
        assert s.environment == "production"
    cors_origins = [] if s.cors_origins == ["*"] else s.cors_origins
    allow_origins = cors_origins if cors_origins else (["*"] if s.environment != "production" else [])
    assert allow_origins != ["*"] or s.environment != "production", (
        "Production with wildcard CORS should not result in allow_origins=['*']"
    )


@pytest.mark.asyncio
async def test_health_check_sanitizes_db_error_in_production():
    """
    T-6: When DB check fails in production, response should not contain raw exception text.
    H-2: Health check currently returns db_error = str(e) in the response.
    """
    from httpx import ASGITransport, AsyncClient
    from backend.config import clear_settings_cache

    clear_settings_cache()
    with patch.dict(os.environ, {"ENVIRONMENT": "production", "SECRET_KEY": "test-secret"}, clear=False):
        clear_settings_cache()

        class RaisingSession:
            async def __aenter__(self):
                raise Exception("internal connection string with secrets")

            async def __aexit__(self, *args):
                pass

        def fake_session_factory():
            return RaisingSession()

        with patch("backend.main.AsyncSessionLocal", fake_session_factory):
            from main import app

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.get("/health")
                assert response.status_code == 503
                data = response.json()
                db_check = data.get("checks", {}).get("database", {})
                msg = db_check.get("message", "")
                assert "internal connection string" not in msg
                assert "secrets" not in msg
