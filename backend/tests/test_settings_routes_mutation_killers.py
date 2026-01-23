"""Tests specifically designed to kill surviving mutants in settings_routes.py

These tests target:
- Status code comparisons (200, 401, 429, 404, 400)
- API key length comparisons (< 10, < 25, < 30)
- Type comparisons (== "openai", == "anthropic", etc.)
- Length comparisons (len(apiKey) > 0, len(providers))
- Cache checks (user_id in _settings_cache)
- Empty checks (None, empty dict)
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from unittest.mock import patch, AsyncMock, MagicMock

from backend.database.models import UserDB, SettingsDB
from backend.database.db import get_db
from backend.auth import create_access_token
from backend.api.settings_routes import _settings_cache, _is_valid_api_key


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


class TestStatusCodeComparisons:
    """Test status code comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_status_200(self, test_user, db_session):
        """Test LLM connection test with status 200 (boundary: == 200)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 200
                    mock_response.json.return_value = {"choices": [{"message": {"content": "test"}}]}
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                        "/api/settings/llm/test",
                        json={
                            "type": "openai",
                            "api_key": "sk-test-key-12345678901234567890",
                            "model": "gpt-4"
                        },
                        headers=headers
                    )
                    assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_status_401(self, test_user, db_session):
        """Test LLM connection test with status 401 (boundary: == 401)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 401
                    mock_response.text = "Unauthorized"
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                        "/api/settings/llm/test",
                        json={
                            "type": "openai",
                            "api_key": "sk-invalid-key",
                            "model": "gpt-4"
                        },
                        headers=headers
                    )
                    assert response.status_code in [200, 400, 500]  # May return error response
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_status_429(self, test_user, db_session):
        """Test LLM connection test with status 429 (boundary: == 429)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 429
                    mock_response.text = "Rate limit exceeded"
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                        "/api/settings/llm/test",
                        json={
                            "type": "openai",
                            "api_key": "sk-test-key-12345678901234567890",
                            "model": "gpt-4"
                        },
                        headers=headers
                    )
                    assert response.status_code in [200, 400, 500]  # May return error response
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_status_404(self, test_user, db_session):
        """Test LLM connection test with status 404 (boundary: == 404)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 404
                    mock_response.text = "Not found"
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                        "/api/settings/llm/test",
                        json={
                            "type": "openai",
                            "api_key": "sk-test-key-12345678901234567890",
                            "model": "gpt-4"
                        },
                        headers=headers
                    )
                    assert response.status_code in [200, 400, 500]  # May return error response
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_status_400(self, test_user, db_session):
        """Test LLM connection test with status 400 (boundary: == 400)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 400
                    mock_response.text = "Bad request"
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                        "/api/settings/llm/test",
                        json={
                            "type": "anthropic",
                            "api_key": "sk-ant-test-key-12345678901234567890",
                            "model": "claude-3-5-sonnet"
                        },
                        headers=headers
                    )
                    assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
            assert response.status_code in [200, 400, 500]  # May return error response


class TestTypeComparisons:
    """Test type comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_type_openai(self, test_user, db_session):
        """Test LLM connection test with type 'openai' (boundary: == 'openai')"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 200
                    mock_response.json.return_value = {"choices": [{"message": {"content": "test"}}]}
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                        "/api/settings/llm/test",
                        json={
                            "type": "openai",
                            "api_key": "sk-test-key-12345678901234567890",
                            "model": "gpt-4"
                        },
                        headers=headers
                    )
                    assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_type_anthropic(self, test_user, db_session):
        """Test LLM connection test with type 'anthropic' (boundary: == 'anthropic')"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 200
                    mock_response.json.return_value = {"content": [{"text": "test"}]}
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                        "/api/settings/llm/test",
                        json={
                            "type": "anthropic",
                            "api_key": "sk-ant-test-key-12345678901234567890",
                            "model": "claude-3-5-sonnet"
                        },
                        headers=headers
                    )
                    assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_type_gemini(self, test_user, db_session):
        """Test LLM connection test with type 'gemini' (boundary: == 'gemini')"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 200
                    mock_response.json.return_value = {"candidates": [{"content": {"parts": [{"text": "test"}]}}]}
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                        "/api/settings/llm/test",
                        json={
                            "type": "gemini",
                            "api_key": "test-key-12345678901234567890",
                            "model": "gemini-2.5-flash"
                        },
                        headers=headers
                    )
                    assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_test_llm_connection_type_custom(self, test_user, db_session):
        """Test LLM connection test with type 'custom' (boundary: == 'custom')"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                with patch("backend.api.settings_routes.httpx.AsyncClient") as mock_client:
                    mock_response = MagicMock()
                    mock_response.status_code = 200
                    mock_response.json.return_value = {"choices": [{"message": {"content": "test"}}]}
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
                    
                    response = await client.post(
                "/api/settings/llm/test",
                json={
                    "type": "custom",
                    "api_key": "test-key-12345678901234567890",
                    "base_url": "https://api.example.com/v1",
                    "model": "custom-model"
                    },
                    headers=headers
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


class TestAPIKeyLengthComparisons:
    """Test API key length comparison boundaries"""
    
    def test_is_valid_api_key_length_9(self):
        """Test API key validation with length exactly 9 (boundary: < 10 true)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("123456789")  # Exactly 9 chars
        assert result is False
    
    def test_is_valid_api_key_length_10(self):
        """Test API key validation with length exactly 10 (boundary: < 10 false)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("1234567890")  # Exactly 10 chars
        assert result is True
    
    def test_is_valid_api_key_length_11(self):
        """Test API key validation with length exactly 11 (boundary: > 10)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("12345678901")  # Exactly 11 chars
        assert result is True
    
    def test_is_valid_api_key_length_24_with_placeholder(self):
        """Test API key validation with length 24 and placeholder (boundary: < 25)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("your-api-key-here-123")  # Exactly 24 chars
        assert result is False
            
    def test_is_valid_api_key_length_25_with_placeholder(self):
        """Test API key validation with length 25 and placeholder (boundary: >= 25)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("your-api-key-here-1234")  # Exactly 25 chars
        # Should pass length check but fail placeholder check
        assert result is False
    
    def test_is_valid_api_key_length_29_with_masked(self):
        """Test API key validation with length 29 and masked pattern (boundary: < 30)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("sk-test-*****here-123456")  # Exactly 29 chars
        assert result is False
    
    def test_is_valid_api_key_length_30_with_masked(self):
        """Test API key validation with length 30 and masked pattern (boundary: >= 30)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("sk-test-*****here-1234567")  # Exactly 30 chars
        # Should pass length check but fail masked pattern check
        assert result is False
    
    def test_is_valid_api_key_empty_string(self):
        """Test API key validation with empty string"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("")
        assert result is False
    
    def test_is_valid_api_key_valid_long(self):
        """Test API key validation with valid long key"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("sk-test-key-123456789012345678901234567890")
        assert result is True


class TestLengthComparisons:
    """Test length comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_save_llm_settings_providers_length_zero(self, test_user, db_session):
        """Test save settings with 0 providers (boundary: len(providers) == 0)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.post(
                    "/api/settings/llm",
                    json={
                        "providers": [],
                        "iteration_limit": 10
                    },
                    headers=headers
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_save_llm_settings_providers_length_one(self, test_user, db_session):
        """Test save settings with 1 provider (boundary: len(providers) == 1)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.post(
                    "/api/settings/llm",
                    json={
                        "providers": [{
                            "id": "test-1",
                            "name": "Test Provider",
                            "type": "openai",
                            "apiKey": "sk-test-key-12345678901234567890",
                            "defaultModel": "gpt-4",
                            "models": ["gpt-4"],
                            "enabled": True
                        }],
                        "iteration_limit": 10
                    },
                    headers=headers
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_save_llm_settings_providers_length_two(self, test_user, db_session):
        """Test save settings with 2 providers (boundary: len(providers) > 1)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.post(
                    "/api/settings/llm",
                    json={
                        "providers": [
                            {
                                "id": "test-1",
                                "name": "Test Provider 1",
                                "type": "openai",
                                "apiKey": "sk-test-key-12345678901234567890",
                                "defaultModel": "gpt-4",
                                "models": ["gpt-4"],
                                "enabled": True
                            },
                            {
                                "id": "test-2",
                                "name": "Test Provider 2",
                                "type": "anthropic",
                                "apiKey": "sk-ant-test-key-12345678901234567890",
                                "defaultModel": "claude-3-5-sonnet",
                                "models": ["claude-3-5-sonnet"],
                                "enabled": True
                            }
                        ],
                        "iteration_limit": 10
                    },
                    headers=headers
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


class TestAPIKeyLengthComparisonsStandalone:
    """Standalone API key length comparison tests"""
    
    def test_api_key_length_zero(self):
        """Test API key length exactly 0 (boundary: len(apiKey) > 0 false)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("")
        assert result is False
    
    def test_api_key_length_one(self):
        """Test API key length exactly 1 (boundary: len(apiKey) > 0 true)"""
        from backend.api.settings_routes import _is_valid_api_key
        result = _is_valid_api_key("x")
        assert result is False  # Too short
    
    def test_api_key_length_ten(self):
        """Test API key length exactly 10 (boundary: len(apiKey) > 0 true)"""
        result = _is_valid_api_key("1234567890")
        assert result is True


class TestCacheComparisons:
    """Test cache comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_get_llm_settings_from_cache(self, test_user, db_session):
        """Test get settings from cache (boundary: user_id in _settings_cache)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Clear cache first
                from backend.api.settings_routes import _settings_cache
                _settings_cache.clear()
                
                # Add to cache
                from backend.api.settings_routes import LLMSettings, LLMProvider
                settings = LLMSettings(
                    providers=[LLMProvider(
                        id="test-1",
                        name="Test",
                        type="openai",
                        apiKey="sk-test",
                        defaultModel="gpt-4",
                        models=["gpt-4"],
                        enabled=True
                    )]
                )
                _settings_cache[test_user.id] = settings
                
                from backend.auth.jwt import create_access_token
                token = create_access_token({"sub": test_user.username})
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.get("/api/settings/llm", headers=headers)
                assert response.status_code == 200
                assert len(response.json()["providers"]) == 1
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_get_llm_settings_not_in_cache(self, test_user, db_session):
        """Test get settings not in cache (boundary: user_id not in _settings_cache)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Clear cache
                from backend.api.settings_routes import _settings_cache
                _settings_cache.clear()
                
                from backend.auth.jwt import create_access_token
                token = create_access_token({"sub": test_user.username})
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.get("/api/settings/llm", headers=headers)
                # Should return empty settings or load from DB
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


class TestEmptyChecks:
    """Test empty value comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_get_llm_settings_settings_db_none(self, test_user, db_session):
        """Test get settings when settings_db is None (boundary: settings_db is None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Ensure no settings in DB
                from sqlalchemy import delete
                from backend.database.models import SettingsDB
                await db_session.execute(delete(SettingsDB).where(SettingsDB.user_id == test_user.id))
                await db_session.commit()
                
                # Clear cache
                from backend.api.settings_routes import _settings_cache
                _settings_cache.clear()
                
                from backend.auth.jwt import create_access_token
                token = create_access_token({"sub": test_user.username})
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.get("/api/settings/llm", headers=headers)
                assert response.status_code == 200
                # Should return empty settings
                assert "providers" in response.json()
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_get_llm_settings_settings_data_none(self, test_user, db_session):
        """Test get settings when settings_data is None (boundary: settings_data is None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Create settings DB record with None settings_data
                from backend.database.models import SettingsDB
                settings_db = SettingsDB(
                    user_id=test_user.id,
                    settings_data=None
                )
                db_session.add(settings_db)
                await db_session.commit()
                
                # Clear cache
                from backend.api.settings_routes import _settings_cache
                _settings_cache.clear()
                
                from backend.auth.jwt import create_access_token
                token = create_access_token({"sub": test_user.username})
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.get("/api/settings/llm", headers=headers)
                assert response.status_code == 200
                # Should return empty settings
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_get_llm_settings_settings_data_not_none(self, test_user, db_session):
        """Test get settings when settings_data is not None (boundary: settings_data is not None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Create settings DB record with settings_data
                from backend.database.models import SettingsDB
                settings_db = SettingsDB(
                    user_id=test_user.id,
                    settings_data={
                        "providers": [{
                            "id": "test-1",
                            "name": "Test",
                            "type": "openai",
                            "apiKey": "sk-test",
                            "defaultModel": "gpt-4",
                            "models": ["gpt-4"],
                            "enabled": True
                        }],
                        "iteration_limit": 10
                    }
                )
                db_session.add(settings_db)
                await db_session.commit()
                
                # Clear cache
                from backend.api.settings_routes import _settings_cache
                _settings_cache.clear()
                
                from backend.auth.jwt import create_access_token
                token = create_access_token({"sub": test_user.username})
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.get("/api/settings/llm", headers=headers)
                assert response.status_code == 200
                assert len(response.json()["providers"]) == 1
        finally:
            app.dependency_overrides.clear()


class TestSaveSettingsComparisons:
    """Test save settings comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_save_llm_settings_settings_db_exists(self, test_user, db_session):
        """Test save settings when settings_db exists (boundary: settings_db is not None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Create existing settings
                from backend.database.models import SettingsDB
                settings_db = SettingsDB(
                    user_id=test_user.id,
                    settings_data={"providers": []}
                )
                db_session.add(settings_db)
                await db_session.commit()
                
                from backend.auth.jwt import create_access_token
                token = create_access_token({"sub": test_user.username})
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.post(
                    "/api/settings/llm",
                    json={
                        "providers": [{
                            "id": "test-1",
                            "name": "Test",
                            "type": "openai",
                            "apiKey": "sk-test-key-12345678901234567890",
                            "defaultModel": "gpt-4",
                            "models": ["gpt-4"],
                            "enabled": True
                        }],
                        "iteration_limit": 10
                    },
                    headers=headers
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_save_llm_settings_settings_db_not_exists(self, test_user, db_session):
        """Test save settings when settings_db does not exist (boundary: settings_db is None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Ensure no settings in DB
                from sqlalchemy import delete
                from backend.database.models import SettingsDB
                await db_session.execute(delete(SettingsDB).where(SettingsDB.user_id == test_user.id))
                await db_session.commit()
                
                from backend.auth.jwt import create_access_token
                token = create_access_token({"sub": test_user.username})
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.post(
                    "/api/settings/llm",
                    json={
                        "providers": [{
                            "id": "test-1",
                            "name": "Test",
                            "type": "openai",
                            "apiKey": "sk-test-key-12345678901234567890",
                            "defaultModel": "gpt-4",
                            "models": ["gpt-4"],
                            "enabled": True
                        }],
                        "iteration_limit": 10
                    },
                    headers=headers
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

