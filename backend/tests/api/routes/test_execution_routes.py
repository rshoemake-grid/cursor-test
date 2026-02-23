"""
Unit tests for execution API routes.
Tests follow SOLID principles and DRY patterns.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.api.routes.execution_routes import router
from backend.services.execution_service import ExecutionService
from backend.exceptions import ExecutionNotFoundError
from backend.models.schemas import ExecutionResponse, ExecutionStatus
from backend.database.models import UserDB


class TestExecutionRoutes:
    """Test suite for execution routes following Single Responsibility Principle"""
    
    @pytest.fixture
    def mock_execution_service(self):
        """Mock ExecutionService (Dependency Inversion Principle)"""
        service = AsyncMock(spec=ExecutionService)
        return service
    
    @pytest.fixture
    def sample_execution_response(self):
        """Sample execution response"""
        return ExecutionResponse(
            execution_id="exec-123",
            workflow_id="workflow-456",
            status=ExecutionStatus.COMPLETED,
            current_node=None,
            result={"output": "test"},
            error=None,
            started_at=datetime(2024, 1, 1, 12, 0, 0),
            completed_at=datetime(2024, 1, 1, 12, 5, 0),
            logs=[]
        )
    
    @pytest.fixture
    def mock_user(self):
        """Mock authenticated user"""
        user = MagicMock(spec=UserDB)
        user.id = "user-789"
        return user
    
    @pytest.mark.asyncio
    async def test_get_execution_success(self, mock_execution_service, sample_execution_response):
        """Test GET /executions/{execution_id} success"""
        # Arrange
        mock_execution_service.get_execution = AsyncMock(return_value=sample_execution_response)
        
        # Act
        from backend.api.routes.execution_routes import get_execution
        
        result = await get_execution(
            execution_id="exec-123",
            execution_service=mock_execution_service
        )
        
        # Assert
        assert result.execution_id == "exec-123"
        assert result.workflow_id == "workflow-456"
        assert result.status == ExecutionStatus.COMPLETED
        mock_execution_service.get_execution.assert_called_once_with("exec-123")
    
    @pytest.mark.asyncio
    async def test_get_execution_not_found(self, mock_execution_service):
        """Test GET /executions/{execution_id} returns 404 when not found"""
        # Arrange
        mock_execution_service.get_execution = AsyncMock(
            side_effect=ExecutionNotFoundError("exec-123")
        )
        
        # Act & Assert
        from backend.api.routes.execution_routes import get_execution
        
        with pytest.raises(HTTPException) as exc_info:
            await get_execution(
                execution_id="exec-123",
                execution_service=mock_execution_service
            )
        
        assert exc_info.value.status_code == 404
        assert "exec-123" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_list_executions_no_filters(self, mock_execution_service, sample_execution_response):
        """Test GET /executions without filters"""
        # Arrange
        mock_execution_service.list_executions = AsyncMock(return_value=[sample_execution_response])
        
        # Act
        from backend.api.routes.execution_routes import list_executions
        
        result = await list_executions(
            workflow_id=None,
            user_id=None,
            status=None,
            limit=None,
            offset=0,
            execution_service=mock_execution_service,
            current_user=None
        )
        
        # Assert
        assert len(result) == 1
        assert result[0].execution_id == "exec-123"
        mock_execution_service.list_executions.assert_called_once_with(
            workflow_id=None,
            user_id=None,
            status=None,
            limit=None,
            offset=0
        )
    
    @pytest.mark.asyncio
    async def test_list_executions_with_filters(self, mock_execution_service, sample_execution_response):
        """Test GET /executions with all filters"""
        # Arrange
        mock_execution_service.list_executions = AsyncMock(return_value=[sample_execution_response])
        
        # Act
        from backend.api.routes.execution_routes import list_executions
        
        result = await list_executions(
            workflow_id="workflow-456",
            user_id="user-789",
            status="completed",
            limit=10,
            offset=5,
            execution_service=mock_execution_service,
            current_user=None
        )
        
        # Assert
        assert len(result) == 1
        mock_execution_service.list_executions.assert_called_once_with(
            workflow_id="workflow-456",
            user_id="user-789",
            status="completed",
            limit=10,
            offset=5
        )
    
    @pytest.mark.asyncio
    async def test_list_executions_with_authenticated_user(self, mock_execution_service, mock_user, sample_execution_response):
        """Test GET /executions uses current user when user_id not provided"""
        # Arrange
        mock_execution_service.list_executions = AsyncMock(return_value=[sample_execution_response])
        
        # Act
        from backend.api.routes.execution_routes import list_executions
        
        result = await list_executions(
            workflow_id=None,
            user_id=None,  # Not provided
            status=None,
            limit=None,
            offset=0,
            execution_service=mock_execution_service,
            current_user=mock_user  # Authenticated user
        )
        
        # Assert
        # Should use current_user.id when user_id is None
        mock_execution_service.list_executions.assert_called_once_with(
            workflow_id=None,
            user_id="user-789",  # Should use current_user.id
            status=None,
            limit=None,
            offset=0
        )
    
    @pytest.mark.asyncio
    async def test_list_executions_empty_result(self, mock_execution_service):
        """Test GET /executions returns empty list"""
        # Arrange
        mock_execution_service.list_executions = AsyncMock(return_value=[])
        
        # Act
        from backend.api.routes.execution_routes import list_executions
        
        result = await list_executions(
            workflow_id=None,
            user_id=None,
            status=None,
            limit=None,
            offset=0,
            execution_service=mock_execution_service,
            current_user=None
        )
        
        # Assert
        assert result == []
        mock_execution_service.list_executions.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_list_workflow_executions(self, mock_execution_service, sample_execution_response):
        """Test GET /workflows/{workflow_id}/executions"""
        # Arrange
        mock_execution_service.list_executions = AsyncMock(return_value=[sample_execution_response])
        
        # Act
        from backend.api.routes.execution_routes import list_workflow_executions
        
        result = await list_workflow_executions(
            workflow_id="workflow-456",
            status=None,
            limit=None,
            offset=0,
            execution_service=mock_execution_service
        )
        
        # Assert
        assert len(result) == 1
        assert result[0].workflow_id == "workflow-456"
        mock_execution_service.list_executions.assert_called_once_with(
            workflow_id="workflow-456",
            status=None,
            limit=None,
            offset=0
        )
    
    @pytest.mark.asyncio
    async def test_list_workflow_executions_with_status_filter(self, mock_execution_service, sample_execution_response):
        """Test GET /workflows/{workflow_id}/executions with status filter"""
        # Arrange
        mock_execution_service.list_executions = AsyncMock(return_value=[sample_execution_response])
        
        # Act
        from backend.api.routes.execution_routes import list_workflow_executions
        
        result = await list_workflow_executions(
            workflow_id="workflow-456",
            status="completed",
            limit=10,
            offset=5,
            execution_service=mock_execution_service
        )
        
        # Assert
        assert len(result) == 1
        mock_execution_service.list_executions.assert_called_once_with(
            workflow_id="workflow-456",
            status="completed",
            limit=10,
            offset=5
        )
    
    @pytest.mark.asyncio
    async def test_list_user_executions(self, mock_execution_service, sample_execution_response):
        """Test GET /users/{user_id}/executions"""
        # Arrange
        mock_execution_service.list_executions = AsyncMock(return_value=[sample_execution_response])
        
        # Act
        from backend.api.routes.execution_routes import list_user_executions
        
        result = await list_user_executions(
            user_id="user-789",
            workflow_id=None,
            status=None,
            limit=None,
            offset=0,
            execution_service=mock_execution_service
        )
        
        # Assert
        assert len(result) == 1
        mock_execution_service.list_executions.assert_called_once_with(
            workflow_id=None,
            user_id="user-789",
            status=None,
            limit=None,
            offset=0
        )
    
    @pytest.mark.asyncio
    async def test_list_user_executions_with_filters(self, mock_execution_service, sample_execution_response):
        """Test GET /users/{user_id}/executions with filters"""
        # Arrange
        mock_execution_service.list_executions = AsyncMock(return_value=[sample_execution_response])
        
        # Act
        from backend.api.routes.execution_routes import list_user_executions
        
        result = await list_user_executions(
            user_id="user-789",
            workflow_id="workflow-456",
            status="completed",
            limit=20,
            offset=10,
            execution_service=mock_execution_service
        )
        
        # Assert
        assert len(result) == 1
        mock_execution_service.list_executions.assert_called_once_with(
            workflow_id="workflow-456",
            user_id="user-789",
            status="completed",
            limit=20,
            offset=10
        )
    
    @pytest.mark.asyncio
    async def test_list_running_executions(self, mock_execution_service, sample_execution_response):
        """Test GET /executions/running"""
        # Arrange
        running_response = ExecutionResponse(
            execution_id="exec-running",
            workflow_id="workflow-456",
            status=ExecutionStatus.RUNNING,
            current_node="node-1",
            result=None,
            error=None,
            started_at=datetime(2024, 1, 1, 12, 0, 0),
            completed_at=None,
            logs=[]
        )
        mock_execution_service.get_running_executions = AsyncMock(return_value=[running_response])
        
        # Act
        from backend.api.routes.execution_routes import list_running_executions
        
        result = await list_running_executions(
            execution_service=mock_execution_service
        )
        
        # Assert
        assert len(result) == 1
        assert result[0].status == ExecutionStatus.RUNNING
        mock_execution_service.get_running_executions.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_list_running_executions_empty(self, mock_execution_service):
        """Test GET /executions/running returns empty list"""
        # Arrange
        mock_execution_service.get_running_executions = AsyncMock(return_value=[])
        
        # Act
        from backend.api.routes.execution_routes import list_running_executions
        
        result = await list_running_executions(
            execution_service=mock_execution_service
        )
        
        # Assert
        assert result == []
        mock_execution_service.get_running_executions.assert_called_once()
