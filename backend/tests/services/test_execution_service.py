"""
Unit tests for ExecutionService.
Tests follow SOLID principles and DRY patterns.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from backend.services.execution_service import ExecutionService
from backend.repositories.execution_repository import ExecutionRepository
from backend.exceptions import ExecutionNotFoundError
from backend.database.models import ExecutionDB


class TestExecutionService:
    """Test suite for ExecutionService following Single Responsibility Principle"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        return AsyncMock()
    
    @pytest.fixture
    def execution_service(self, mock_db_session):
        """Create ExecutionService instance with mocked dependencies"""
        return ExecutionService(mock_db_session)
    
    @pytest.fixture
    def sample_execution(self):
        """Sample execution database entity"""
        return ExecutionDB(
            id="exec-123",
            workflow_id="workflow-456",
            user_id="user-789",
            status="completed",
            state={
                "current_node": None,
                "result": {"output": "test"},
                "error": None,
                "logs": []
            },
            started_at=datetime(2024, 1, 1, 12, 0, 0),
            completed_at=datetime(2024, 1, 1, 12, 5, 0)
        )
    
    @pytest.mark.asyncio
    async def test_get_execution_success(self, execution_service, sample_execution):
        """Test successful execution retrieval"""
        # Arrange
        execution_service.repository.get_by_id = AsyncMock(return_value=sample_execution)
        
        # Act
        result = await execution_service.get_execution("exec-123")
        
        # Assert
        assert result.execution_id == "exec-123"
        assert result.workflow_id == "workflow-456"
        assert result.status == "completed"
        assert result.result == {"output": "test"}
        execution_service.repository.get_by_id.assert_called_once_with("exec-123")
    
    @pytest.mark.asyncio
    async def test_get_execution_not_found(self, execution_service):
        """Test execution not found raises ExecutionNotFoundError"""
        # Arrange
        execution_service.repository.get_by_id = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(ExecutionNotFoundError) as exc_info:
            await execution_service.get_execution("non-existent")
        
        assert "non-existent" in str(exc_info.value)
        execution_service.repository.get_by_id.assert_called_once_with("non-existent")
    
    @pytest.mark.asyncio
    async def test_list_executions_no_filters(self, execution_service, sample_execution):
        """Test listing executions without filters"""
        # Arrange
        executions = [sample_execution]
        execution_service.repository.list_executions = AsyncMock(return_value=executions)
        
        # Act
        result = await execution_service.list_executions()
        
        # Assert
        assert len(result) == 1
        assert result[0].execution_id == "exec-123"
        execution_service.repository.list_executions.assert_called_once_with(
            workflow_id=None,
            user_id=None,
            status=None,
            limit=None,
            offset=0
        )
    
    @pytest.mark.asyncio
    async def test_list_executions_with_filters(self, execution_service, sample_execution):
        """Test listing executions with all filters"""
        # Arrange
        executions = [sample_execution]
        execution_service.repository.list_executions = AsyncMock(return_value=executions)
        
        # Act
        result = await execution_service.list_executions(
            workflow_id="workflow-456",
            user_id="user-789",
            status="completed",
            limit=10,
            offset=5
        )
        
        # Assert
        assert len(result) == 1
        execution_service.repository.list_executions.assert_called_once_with(
            workflow_id="workflow-456",
            user_id="user-789",
            status="completed",
            limit=10,
            offset=5
        )
    
    @pytest.mark.asyncio
    async def test_list_executions_empty_result(self, execution_service):
        """Test listing executions returns empty list when no results"""
        # Arrange
        execution_service.repository.list_executions = AsyncMock(return_value=[])
        
        # Act
        result = await execution_service.list_executions()
        
        # Assert
        assert result == []
        execution_service.repository.list_executions.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_executions_by_workflow(self, execution_service, sample_execution):
        """Test getting executions by workflow ID"""
        # Arrange
        executions = [sample_execution]
        execution_service.repository.get_by_workflow_id = AsyncMock(return_value=executions)
        
        # Act
        result = await execution_service.get_executions_by_workflow("workflow-456", limit=5)
        
        # Assert
        assert len(result) == 1
        assert result[0].workflow_id == "workflow-456"
        execution_service.repository.get_by_workflow_id.assert_called_once_with("workflow-456", limit=5)
    
    @pytest.mark.asyncio
    async def test_get_executions_by_user(self, execution_service, sample_execution):
        """Test getting executions by user ID"""
        # Arrange
        executions = [sample_execution]
        execution_service.repository.get_by_user_id = AsyncMock(return_value=executions)
        
        # Act
        result = await execution_service.get_executions_by_user("user-789", limit=10)
        
        # Assert
        assert len(result) == 1
        # Note: ExecutionResponse doesn't include user_id field
        execution_service.repository.get_by_user_id.assert_called_once_with("user-789", limit=10)
    
    @pytest.mark.asyncio
    async def test_get_running_executions(self, execution_service, sample_execution):
        """Test getting running executions"""
        # Arrange
        running_execution = ExecutionDB(
            id="exec-running",
            workflow_id="workflow-456",
            user_id="user-789",
            status="running",
            state={"current_node": "node-1"},
            started_at=datetime(2024, 1, 1, 12, 0, 0),
            completed_at=None
        )
        executions = [running_execution]
        execution_service.repository.get_running_executions = AsyncMock(return_value=executions)
        
        # Act
        result = await execution_service.get_running_executions()
        
        # Assert
        assert len(result) == 1
        assert result[0].status == "running"
        execution_service.repository.get_running_executions.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_db_to_response_conversion(self, execution_service, sample_execution):
        """Test database to response model conversion (DRY - tests helper method)"""
        # Act
        result = execution_service._db_to_response(sample_execution)
        
        # Assert
        assert result.execution_id == sample_execution.id
        assert result.workflow_id == sample_execution.workflow_id
        assert result.status == sample_execution.status
        assert result.result == sample_execution.state["result"]
        assert result.started_at == sample_execution.started_at
        assert result.completed_at == sample_execution.completed_at
    
    @pytest.mark.asyncio
    async def test_db_to_response_with_none_state(self, execution_service):
        """Test conversion handles None state gracefully"""
        # Arrange
        execution = ExecutionDB(
            id="exec-123",
            workflow_id="workflow-456",
            user_id="user-789",
            status="running",
            state=None,
            started_at=datetime(2024, 1, 1, 12, 0, 0),
            completed_at=None
        )
        
        # Act
        result = execution_service._db_to_response(execution)
        
        # Assert
        assert result.execution_id == "exec-123"
        assert result.current_node is None
        assert result.result is None
        assert result.logs == []
    
    @pytest.mark.asyncio
    async def test_db_to_response_with_missing_started_at(self, execution_service):
        """Test conversion handles missing started_at"""
        # Arrange
        execution = ExecutionDB(
            id="exec-123",
            workflow_id="workflow-456",
            user_id="user-789",
            status="running",
            state={},
            started_at=None,
            completed_at=None
        )
        
        # Act
        result = execution_service._db_to_response(execution)
        
        # Assert
        assert result.execution_id == "exec-123"
        assert result.started_at is not None  # Should default to current time
