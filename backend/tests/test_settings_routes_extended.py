"""Extended tests for settings API routes"""
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
async def test_test_llm_connection_openai(db_session: AsyncSession, test_user: UserDB):
    """Test LLM connection test for OpenAI"""
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
    mock_response.json.return_value = {"choices": [{"message": {"content": "test"}}]}
    
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
                        "type": "openai",
                        "api_key": "sk-test-key-123456789012345678901234567890",
                        "model": "gpt-4",
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
async def test_test_llm_connection_anthropic(db_session: AsyncSession, test_user: UserDB):
    """Test LLM connection test for Anthropic"""
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
    mock_response.json.return_value = {"content": [{"text": "test"}]}
    
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
                        "type": "anthropic",
                        "api_key": "sk-test-key-123456789012345678901234567890",
                        "model": "claude-3-5-sonnet-20241022",
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
async def test_test_llm_connection_error(db_session: AsyncSession, test_user: UserDB):
    """Test LLM connection test with error"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock httpx response with error
    mock_response = AsyncMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"
    
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
                        "type": "openai",
                        "api_key": "invalid-key",
                        "model": "gpt-4",
                        "base_url": None
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "error"
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_user_settings(db_session: AsyncSession, test_user: UserDB):
    """Test getting user settings"""
    from main import app
    
    settings = SettingsDB(
        user_id=test_user.id,
        settings_data={
            "providers": [{
                "id": "test-provider",
                "name": "Test Provider",
                "type": "openai",
                "apiKey": "sk-test-key-123456789012345678901234567890",
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
            assert "providers" in data
    finally:
        app.dependency_overrides.clear()

