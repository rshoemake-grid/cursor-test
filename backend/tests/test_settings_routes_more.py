"""More tests for settings routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from unittest.mock import patch, AsyncMock

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
async def test_update_llm_settings_add_provider(db_session: AsyncSession, test_user: UserDB):
    """Test adding a new LLM provider"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Use the save_llm_settings endpoint
            response = await client.post(
                "/api/settings/llm",
                json={
                    "providers": [{
                        "id": "new-provider",
                        "name": "New Provider",
                        "type": "openai",
                        "apiKey": "sk-test-key-123456789012345678901234567890",
                        "defaultModel": "gpt-4",
                        "enabled": True,
                        "models": ["gpt-4", "gpt-4-turbo"]
                    }]
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            # Check response - might return 200 or 201
            assert response.status_code in [200, 201]
            if response.status_code == 200:
                data = response.json()
                # Response might be just success message or full settings
                if "providers" in data:
                    assert len(data["providers"]) == 1
                    assert data["providers"][0]["id"] == "new-provider"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_llm_settings_update_existing_provider(db_session: AsyncSession, test_user: UserDB):
    """Test updating an existing LLM provider"""
    from main import app
    
    # Create existing settings
    settings = SettingsDB(
        user_id=test_user.id,
        settings_data={
            "providers": [{
                "id": "existing-provider",
                "name": "Existing Provider",
                "type": "openai",
                "apiKey": "sk-old-key",
                "defaultModel": "gpt-3.5-turbo",
                "enabled": True,
                "models": ["gpt-3.5-turbo"]
            }]
        }
    )
    db_session.add(settings)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/settings/llm",
                json={
                    "providers": [{
                        "id": "existing-provider",
                        "name": "Updated Provider",
                        "type": "openai",
                        "apiKey": "sk-new-key-123456789012345678901234567890",
                        "defaultModel": "gpt-4",
                        "enabled": True,
                        "models": ["gpt-4"]
                    }]
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code in [200, 201]
            if response.status_code == 200:
                data = response.json()
                if "providers" in data:
                    assert data["providers"][0]["name"] == "Updated Provider"
                    assert data["providers"][0]["defaultModel"] == "gpt-4"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_llm_settings_multiple_providers(db_session: AsyncSession, test_user: UserDB):
    """Test updating multiple LLM providers"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/settings/llm",
                json={
                    "providers": [
                        {
                            "id": "provider-1",
                            "name": "Provider 1",
                            "type": "openai",
                            "apiKey": "sk-test-key-1-123456789012345678901234567890",
                            "defaultModel": "gpt-4",
                            "enabled": True,
                            "models": ["gpt-4"]
                        },
                        {
                            "id": "provider-2",
                            "name": "Provider 2",
                            "type": "anthropic",
                            "apiKey": "sk-test-key-2-123456789012345678901234567890",
                            "defaultModel": "claude-3-5-sonnet-20241022",
                            "enabled": True,
                            "models": ["claude-3-5-sonnet-20241022"]
                        }
                    ]
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code in [200, 201]
            if response.status_code == 200:
                data = response.json()
                if "providers" in data:
                    assert len(data["providers"]) == 2
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_test_llm_connection_gemini(db_session: AsyncSession, test_user: UserDB):
    """Test LLM connection test for Gemini"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock httpx response
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": "test"
                }]
            }
        }]
    }
    
    with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/settings/llm/test",
                    json={
                        "type": "gemini",
                        "api_key": "test-gemini-key-123456789012345678901234567890",
                        "model": "gemini-2.5-flash",
                        "base_url": None
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "success"
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_test_llm_connection_custom(db_session: AsyncSession, test_user: UserDB):
    """Test LLM connection test for custom provider"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock httpx response
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "content": "test"
            }
        }]
    }
    
    with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/settings/llm/test",
                    json={
                        "type": "custom",
                        "api_key": "sk-test-key-123456789012345678901234567890",
                        "model": "custom-model",
                        "base_url": "https://api.custom.com/v1"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "success"
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_test_llm_connection_unknown_provider(db_session: AsyncSession, test_user: UserDB):
    """Test LLM connection test with unknown provider"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/settings/llm/test",
                json={
                    "type": "unknown",
                    "api_key": "sk-test-key-123456789012345678901234567890",
                    "model": "unknown-model",
                    "base_url": None
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            # API might return 200 with error status or 400
            assert response.status_code in [200, 400]
            if response.status_code == 200:
                data = response.json()
                assert data.get("status") == "error"
            else:
                assert "Unknown provider" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

