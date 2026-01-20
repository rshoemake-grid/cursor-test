"""Tests for settings API routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from unittest.mock import patch, AsyncMock

from backend.database.models import SettingsDB, UserDB
from backend.database.db import get_db


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
async def test_save_llm_settings_requires_auth(db_session: AsyncSession):
    """Test that saving settings requires authentication"""
    from main import app
    
    settings_data = {
        "providers": [],
        "iteration_limit": 10
    }
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/settings/llm", json=settings_data)
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_save_and_get_llm_settings(db_session: AsyncSession, test_user: UserDB):
    """Test saving and retrieving LLM settings"""
    from main import app
    from backend.auth.auth import create_access_token, get_optional_user
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    token = create_access_token(data={"sub": test_user.id})
    
    settings_data = {
        "providers": [
            {
                "id": "test-provider",
                "name": "Test Provider",
                "type": "openai",
                "apiKey": "test-key",
                "baseUrl": None,
                "defaultModel": "gpt-4",
                "models": ["gpt-4", "gpt-3.5-turbo"],
                "enabled": True
            }
        ],
        "iteration_limit": 15,
        "default_model": "gpt-4"
    }
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Save settings
            response = await client.post(
                "/api/settings/llm",
                json=settings_data,
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            
            # Get settings
            response = await client.get(
                "/api/settings/llm",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data["providers"]) == 1
            assert data["iteration_limit"] == 15
            assert data["default_model"] == "gpt-4"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_llm_settings_requires_auth(db_session: AsyncSession):
    """Test that getting settings requires authentication"""
    from main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/settings/llm")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_llm_settings_empty(db_session: AsyncSession, test_user: UserDB):
    """Test getting settings when none exist"""
    from main import app
    from backend.auth.auth import create_access_token, get_optional_user
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    token = create_access_token(data={"sub": test_user.id})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/settings/llm",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["providers"] == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_test_llm_connection_openai():
    """Test LLM connection test endpoint for OpenAI"""
    from main import app
    
    test_request = {
        "type": "openai",
        "api_key": "test-key",
        "base_url": None,
        "model": "gpt-4"
    }
    
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = AsyncMock(return_value={"choices": [{"message": {"content": "Hello"}}]})
    mock_response.text = '{"choices": [{"message": {"content": "Hello"}}]}'
    
    async def mock_post(*args, **kwargs):
        return mock_response
    
    with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/settings/llm/test", json=test_request)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] in ["success", "error"]


@pytest.mark.asyncio
async def test_test_llm_connection_anthropic():
    """Test LLM connection test endpoint for Anthropic"""
    from main import app
    
    test_request = {
        "type": "anthropic",
        "api_key": "test-key",
        "base_url": None,
        "model": "claude-3-5-sonnet-20241022"
    }
    
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = AsyncMock(return_value={"content": [{"text": "Hello"}]})
    mock_response.text = '{"content": [{"text": "Hello"}]}'
    
    with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/settings/llm/test", json=test_request)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] in ["success", "error"]


@pytest.mark.asyncio
async def test_test_llm_connection_invalid_type():
    """Test LLM connection test with invalid provider type"""
    from main import app
    
    test_request = {
        "type": "invalid",
        "api_key": "test-key",
        "model": "test-model"
    }
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/settings/llm/test", json=test_request)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"

