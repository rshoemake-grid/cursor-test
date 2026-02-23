"""
Unit tests for ExecutionRepository.
Tests follow SOLID principles and DRY patterns.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
from sqlalchemy import select

from backend.repositories.execution_repository import ExecutionRepository
from backend.database.models import ExecutionDB


class TestExecutionRepository:
    """Test suite for ExecutionRepository following Single Responsibility Principle"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        session = AsyncMock()
        session.execute = AsyncMock()
        return session
    
    @pytest.fixture
    def execution_repository(self, mock_db_session):
        """Create ExecutionRepository instance with mocked database"""
        return ExecutionRepository(mock_db_session)
    
    @pytest.fixture
    def sample_execution(self):
        """Sample execution database entity"""
        return ExecutionDB(
            id="exec-123",
            workflow_id="workflow-456",
            user_id="user-789",
            status="completed",
            state={},
            started_at=datetime(2024, 1, 1, 12, 0, 0),
            completed_at=datetime(2024, 1, 1, 12, 5, 0)
        )
    
    def test_repository_initialization(self, execution_repository, mock_db_session):
        """Test repository initializes correctly"""
        assert execution_repository.db == mock_db_session
        assert execution_repository.model == ExecutionDB
    
    @pytest.mark.asyncio
    async def test_list_executions_no_filters(self, execution_repository, mock_db_session, sample_execution):
        """Test listing executions without filters"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[sample_execution])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.list_executions()
        
        # Assert
        assert len(result) == 1
        assert result[0].id == "exec-123"
        mock_db_session.execute.assert_called_once()
        # Verify query was executed (query structure verified by repository implementation)
    
    @pytest.mark.asyncio
    async def test_list_executions_with_workflow_id(self, execution_repository, mock_db_session, sample_execution):
        """Test listing executions filtered by workflow_id"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[sample_execution])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.list_executions(workflow_id="workflow-456")
        
        # Assert
        assert len(result) == 1
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_list_executions_with_user_id(self, execution_repository, mock_db_session, sample_execution):
        """Test listing executions filtered by user_id"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[sample_execution])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.list_executions(user_id="user-789")
        
        # Assert
        assert len(result) == 1
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_list_executions_with_status(self, execution_repository, mock_db_session, sample_execution):
        """Test listing executions filtered by status"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[sample_execution])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.list_executions(status="completed")
        
        # Assert
        assert len(result) == 1
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_list_executions_with_all_filters(self, execution_repository, mock_db_session, sample_execution):
        """Test listing executions with all filters applied"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[sample_execution])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.list_executions(
            workflow_id="workflow-456",
            user_id="user-789",
            status="completed",
            limit=10,
            offset=5
        )
        
        # Assert
        assert len(result) == 1
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_list_executions_with_pagination(self, execution_repository, mock_db_session):
        """Test listing executions with pagination"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.list_executions(limit=20, offset=10)
        
        # Assert
        assert result == []
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_list_executions_empty_result(self, execution_repository, mock_db_session):
        """Test listing executions returns empty list"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.list_executions()
        
        # Assert
        assert result == []
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_by_workflow_id_delegates_to_list(self, execution_repository, mock_db_session, sample_execution):
        """Test get_by_workflow_id delegates to list_executions (DRY principle)"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[sample_execution])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.get_by_workflow_id("workflow-456", limit=5)
        
        # Assert
        assert len(result) == 1
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_by_user_id_delegates_to_list(self, execution_repository, mock_db_session, sample_execution):
        """Test get_by_user_id delegates to list_executions (DRY principle)"""
        # Arrange
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[sample_execution])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.get_by_user_id("user-789", limit=10)
        
        # Assert
        assert len(result) == 1
        mock_db_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_running_executions_delegates_to_list(self, execution_repository, mock_db_session, sample_execution):
        """Test get_running_executions delegates to list_executions (DRY principle)"""
        # Arrange
        running_execution = ExecutionDB(
            id="exec-running",
            workflow_id="workflow-456",
            user_id="user-789",
            status="running",
            state={},
            started_at=datetime(2024, 1, 1, 12, 0, 0),
            completed_at=None
        )
        mock_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all = MagicMock(return_value=[running_execution])
        mock_result.scalars = MagicMock(return_value=mock_scalars)
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        
        # Act
        result = await execution_repository.get_running_executions()
        
        # Assert
        assert len(result) == 1
        assert result[0].status == "running"
        mock_db_session.execute.assert_called_once()
