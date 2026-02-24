"""Tests for settings routes cache functionality"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from backend.database.models import UserDB, SettingsDB
from backend.database.db import get_db
from backend.auth import get_current_active_user, create_access_token
@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    return user
@pytest.mark.asyncio
async def test_get_llm_settings_from_cache(db_session: AsyncSession, test_user: UserDB):
    """Test getting LLM settings from cache"""
    from main import app
    from backend.utils.settings_cache import get_settings_cache
    # Pre-populate cache
    from backend.api.settings_routes import LLMSettings, LLMProvider
    get_settings_cache()[test_user.id] = LLMSettings(
        providers=[LLMProvider(
            id="cached-provider",
            name="Cached Provider",
            type="openai",
            apiKey="sk-cached-key-123456789012345678901234567890",
            defaultModel="gpt-4",
            enabled=True,
            models=["gpt-4"]
        )]
    )
    async def override_get_db():
        yield db_session
    async def override_get_user():
        return test_user
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    token = create_access_token(data={"sub": test_user.username})
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/settings/llm",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data["providers"]) == 1
            assert data["providers"][0]["id"] == "cached-provider"
    finally:
        app.dependency_overrides.clear()
        # Clean up cache
        if test_user.id in get_settings_cache():
            del get_settings_cache()[test_user.id]
@pytest.mark.asyncio
async def test_load_settings_into_cache(db_session: AsyncSession, test_user: UserDB):
    """Test loading settings into cache"""
    from main import app
    from backend.utils.settings_cache import get_settings_cache
    from backend.services.settings_service import SettingsService
    # Create settings in database
    settings = SettingsDB(
        user_id=test_user.id,
        settings_data={
            "providers": [{
                "id": "db-provider",
                "name": "DB Provider",
                "type": "openai",
                "apiKey": "sk-db-key-123456789012345678901234567890",
                "defaultModel": "gpt-4",
                "enabled": True,
                "models": ["gpt-4"]
            }]
        }
    )
    db_session.add(settings)
    await db_session.commit()
    async def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    try:
        # Clear cache first
        if test_user.id in get_settings_cache():
            del get_settings_cache()[test_user.id]
        # Load settings into cache
        await SettingsService().load_settings_into_cache(db_session)
        # Check cache was populated
        assert test_user.id in get_settings_cache()
        cached_settings = get_settings_cache()[test_user.id]
        assert len(cached_settings.providers) == 1
        assert cached_settings.providers[0].id == "db-provider"
    finally:
        app.dependency_overrides.clear()
        # Clean up cache
        if test_user.id in get_settings_cache():
            del get_settings_cache()[test_user.id]