"""
Unit tests for SettingsService.load_settings_into_cache method.
Tests the refactored settings loading logic moved from settings_routes.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.services.settings_service import SettingsService
from backend.api.settings_routes import LLMSettings


@pytest.fixture
def mock_db():
    """Mock database session"""
    db = AsyncMock()
    return db


@pytest.fixture
def mock_cache():
    """Mock cache dictionary"""
    return {}


@pytest.fixture
def settings_service(mock_cache):
    """Create SettingsService with mock cache"""
    return SettingsService(cache=mock_cache)


class TestLoadSettingsIntoCache:
    """Tests for load_settings_into_cache method"""
    
    @pytest.mark.asyncio
    async def test_load_settings_success(self, settings_service, mock_db, mock_cache):
        """Test successfully loading settings into cache"""
        settings_db = MagicMock()
        settings_db.user_id = "user-1"
        settings_db.settings_data = {
            "providers": [],
            "iteration_limit": 10
        }
        
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [settings_db]
        mock_db.execute.return_value = mock_result
        
        await settings_service.load_settings_into_cache(mock_db)
        
        assert "user-1" in mock_cache
        assert isinstance(mock_cache["user-1"], LLMSettings)
    
    @pytest.mark.asyncio
    async def test_load_settings_empty_database(self, settings_service, mock_db, mock_cache):
        """Test loading when database is empty"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result
        
        await settings_service.load_settings_into_cache(mock_db)
        
        assert len(mock_cache) == 0
    
    @pytest.mark.asyncio
    async def test_load_settings_skips_null_settings_data(self, settings_service, mock_db, mock_cache):
        """Test that settings with null settings_data are skipped"""
        settings_db = MagicMock()
        settings_db.user_id = "user-1"
        settings_db.settings_data = None
        
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [settings_db]
        mock_db.execute.return_value = mock_result
        
        await settings_service.load_settings_into_cache(mock_db)
        
        assert "user-1" not in mock_cache
    
    @pytest.mark.asyncio
    async def test_load_settings_handles_exception(self, settings_service, mock_db, mock_cache):
        """Test that exceptions are caught and logged"""
        mock_db.execute.side_effect = Exception("Database error")
        
        # Should not raise exception
        await settings_service.load_settings_into_cache(mock_db)
        
        assert len(mock_cache) == 0
    
    @pytest.mark.asyncio
    async def test_load_settings_multiple_users(self, settings_service, mock_db, mock_cache):
        """Test loading settings for multiple users"""
        settings_db_1 = MagicMock()
        settings_db_1.user_id = "user-1"
        settings_db_1.settings_data = {"providers": [], "iteration_limit": 10}
        
        settings_db_2 = MagicMock()
        settings_db_2.user_id = "user-2"
        settings_db_2.settings_data = {"providers": [], "iteration_limit": 20}
        
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [settings_db_1, settings_db_2]
        mock_db.execute.return_value = mock_result
        
        await settings_service.load_settings_into_cache(mock_db)
        
        assert len(mock_cache) == 2
        assert "user-1" in mock_cache
        assert "user-2" in mock_cache
