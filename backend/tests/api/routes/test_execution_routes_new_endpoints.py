"""
Unit tests for new execution route endpoints.
Tests GET /executions/{id}/logs, GET /executions/{id}/logs/download, POST /executions/{id}/cancel
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
from fastapi import HTTPException
from fastapi.responses import Response

from backend.models.schemas import ExecutionStatus, ExecutionLogsResponse, ExecutionLogEntry, ExecutionResponse
from backend.exceptions import ExecutionNotFoundError


@pytest.fixture
def mock_execution_service():
    """Mock execution service"""
    return MagicMock()


@pytest.fixture
def sample_logs_response():
    """Sample execution logs response"""
    return ExecutionLogsResponse(
        execution_id="exec-123",
        logs=[
            ExecutionLogEntry(
                timestamp=datetime(2026, 2, 23, 12, 0, 0),
                level="INFO",
                node_id=None,
                message="Workflow execution started"
            ),
            ExecutionLogEntry(
                timestamp=datetime(2026, 2, 23, 12, 0, 5),
                level="ERROR",
                node_id="node-1",
                message="Node execution failed"
            )
        ],
        total=2,
        limit=1000,
        offset=0
    )


@pytest.fixture
def sample_execution_response():
    """Sample execution response"""
    return ExecutionResponse(
        execution_id="exec-123",
        workflow_id="workflow-456",
        status=ExecutionStatus.CANCELLED,
        current_node=None,
        result=None,
        error=None,
        started_at=datetime(2026, 2, 23, 12, 0, 0),
        completed_at=datetime(2026, 2, 23, 12, 0, 10),
        logs=[]
    )


class TestGetExecutionLogsEndpoint:
    """Tests for GET /executions/{execution_id}/logs endpoint"""
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_endpoint_success(self, mock_execution_service, sample_logs_response):
        """Test successful retrieval of execution logs"""
        mock_execution_service.get_execution_logs = AsyncMock(return_value=sample_logs_response)
        
        from backend.api.routes.execution_routes import get_execution_logs
        
        result = await get_execution_logs(
            execution_id="exec-123",
            level=None,
            node_id=None,
            limit=1000,
            offset=0,
            execution_service=mock_execution_service
        )
        
        assert isinstance(result, ExecutionLogsResponse)
        assert result.execution_id == "exec-123"
        assert result.total == 2
        assert len(result.logs) == 2
        mock_execution_service.get_execution_logs.assert_called_once_with(
            execution_id="exec-123",
            level=None,
            node_id=None,
            limit=1000,
            offset=0
        )
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_endpoint_not_found(self, mock_execution_service):
        """Test 404 when execution not found"""
        mock_execution_service.get_execution_logs = AsyncMock(
            side_effect=ExecutionNotFoundError("exec-123")
        )
        
        from backend.api.routes.execution_routes import get_execution_logs
        
        with pytest.raises(HTTPException) as exc_info:
            await get_execution_logs(
                execution_id="exec-123",
                level=None,
                node_id=None,
                limit=1000,
                offset=0,
                execution_service=mock_execution_service
            )
        
        assert exc_info.value.status_code == 404
        assert "exec-123" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_endpoint_with_filters(self, mock_execution_service, sample_logs_response):
        """Test logs endpoint with filters"""
        filtered_logs = ExecutionLogsResponse(
            execution_id="exec-123",
            logs=[sample_logs_response.logs[1]],
            total=1,
            limit=1000,
            offset=0
        )
        mock_execution_service.get_execution_logs = AsyncMock(return_value=filtered_logs)
        
        from backend.api.routes.execution_routes import get_execution_logs
        
        result = await get_execution_logs(
            execution_id="exec-123",
            level="ERROR",
            node_id="node-1",
            limit=1000,
            offset=0,
            execution_service=mock_execution_service
        )
        
        assert result.total == 1
        assert result.logs[0].level == "ERROR"
        mock_execution_service.get_execution_logs.assert_called_once_with(
            execution_id="exec-123",
            level="ERROR",
            node_id="node-1",
            limit=1000,
            offset=0
        )
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_endpoint_pagination(self, mock_execution_service, sample_logs_response):
        """Test logs endpoint with pagination"""
        mock_execution_service.get_execution_logs = AsyncMock(return_value=sample_logs_response)
        
        from backend.api.routes.execution_routes import get_execution_logs
        
        await get_execution_logs(
            execution_id="exec-123",
            level=None,
            node_id=None,
            limit=50,
            offset=10,
            execution_service=mock_execution_service
        )
        
        mock_execution_service.get_execution_logs.assert_called_once_with(
            execution_id="exec-123",
            level=None,
            node_id=None,
            limit=50,
            offset=10
        )


class TestDownloadExecutionLogsEndpoint:
    """Tests for GET /executions/{execution_id}/logs/download endpoint"""
    
    @pytest.mark.asyncio
    async def test_download_logs_text_format(self, mock_execution_service, sample_logs_response):
        """Test downloading logs in text format"""
        mock_execution_service.get_execution_logs = AsyncMock(return_value=sample_logs_response)
        
        from backend.api.routes.execution_routes import download_execution_logs
        
        result = await download_execution_logs(
            execution_id="exec-123",
            format="text",
            level=None,
            node_id=None,
            execution_service=mock_execution_service
        )
        
        assert isinstance(result, Response)
        assert result.media_type == "text/plain"
        assert "execution_exec-123_logs.txt" in result.headers["Content-Disposition"]
        assert b"Execution Logs for exec-123" in result.body
        assert b"Workflow execution started" in result.body
    
    @pytest.mark.asyncio
    async def test_download_logs_json_format(self, mock_execution_service, sample_logs_response):
        """Test downloading logs in JSON format"""
        mock_execution_service.get_execution_logs = AsyncMock(return_value=sample_logs_response)
        
        from backend.api.routes.execution_routes import download_execution_logs
        
        result = await download_execution_logs(
            execution_id="exec-123",
            format="json",
            level=None,
            node_id=None,
            execution_service=mock_execution_service
        )
        
        assert isinstance(result, Response)
        assert result.media_type == "application/json"
        assert "execution_exec-123_logs.json" in result.headers["Content-Disposition"]
        import json
        content = json.loads(result.body.decode())
        assert content["execution_id"] == "exec-123"
        assert len(content["logs"]) == 2
    
    @pytest.mark.asyncio
    async def test_download_logs_with_filters(self, mock_execution_service, sample_logs_response):
        """Test downloading filtered logs"""
        filtered_logs = ExecutionLogsResponse(
            execution_id="exec-123",
            logs=[sample_logs_response.logs[1]],
            total=1,
            limit=100000,
            offset=0
        )
        mock_execution_service.get_execution_logs = AsyncMock(return_value=filtered_logs)
        
        from backend.api.routes.execution_routes import download_execution_logs
        
        result = await download_execution_logs(
            execution_id="exec-123",
            format="text",
            level="ERROR",
            node_id="node-1",
            execution_service=mock_execution_service
        )
        
        mock_execution_service.get_execution_logs.assert_called_once_with(
            execution_id="exec-123",
            level="ERROR",
            node_id="node-1",
            limit=100000,
            offset=0
        )
        assert b"ERROR" in result.body
    
    @pytest.mark.asyncio
    async def test_download_logs_not_found(self, mock_execution_service):
        """Test 404 when execution not found"""
        mock_execution_service.get_execution_logs = AsyncMock(
            side_effect=ExecutionNotFoundError("exec-123")
        )
        
        from backend.api.routes.execution_routes import download_execution_logs
        
        with pytest.raises(HTTPException) as exc_info:
            await download_execution_logs(
                execution_id="exec-123",
                format="text",
                level=None,
                node_id=None,
                execution_service=mock_execution_service
            )
        
        assert exc_info.value.status_code == 404


class TestCancelExecutionEndpoint:
    """Tests for POST /executions/{execution_id}/cancel endpoint"""
    
    @pytest.mark.asyncio
    async def test_cancel_execution_endpoint_success(self, mock_execution_service, sample_execution_response):
        """Test successful cancellation"""
        sample_execution_response.status = ExecutionStatus.CANCELLED
        mock_execution_service.cancel_execution = AsyncMock(return_value=sample_execution_response)
        
        from backend.api.routes.execution_routes import cancel_execution
        
        result = await cancel_execution(
            execution_id="exec-123",
            execution_service=mock_execution_service
        )
        
        assert isinstance(result, ExecutionResponse)
        assert result.status == ExecutionStatus.CANCELLED
        assert result.execution_id == "exec-123"
        mock_execution_service.cancel_execution.assert_called_once_with("exec-123")
    
    @pytest.mark.asyncio
    async def test_cancel_execution_endpoint_not_found(self, mock_execution_service):
        """Test 404 when execution not found"""
        mock_execution_service.cancel_execution = AsyncMock(
            side_effect=ExecutionNotFoundError("exec-123")
        )
        
        from backend.api.routes.execution_routes import cancel_execution
        
        with pytest.raises(HTTPException) as exc_info:
            await cancel_execution(
                execution_id="exec-123",
                execution_service=mock_execution_service
            )
        
        assert exc_info.value.status_code == 404
        assert "exec-123" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_cancel_execution_endpoint_not_cancellable(self, mock_execution_service):
        """Test 400 when execution is not cancellable"""
        mock_execution_service.cancel_execution = AsyncMock(
            side_effect=ValueError("Execution exec-123 is not in a cancellable state")
        )
        
        from backend.api.routes.execution_routes import cancel_execution
        
        with pytest.raises(HTTPException) as exc_info:
            await cancel_execution(
                execution_id="exec-123",
                execution_service=mock_execution_service
            )
        
        assert exc_info.value.status_code == 400
        assert "not in a cancellable state" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_cancel_execution_endpoint_response_format(self, mock_execution_service, sample_execution_response):
        """Test response format validation"""
        mock_execution_service.cancel_execution = AsyncMock(return_value=sample_execution_response)
        
        from backend.api.routes.execution_routes import cancel_execution
        
        result = await cancel_execution(
            execution_id="exec-123",
            execution_service=mock_execution_service
        )
        
        assert hasattr(result, "execution_id")
        assert hasattr(result, "status")
        assert hasattr(result, "workflow_id")
        assert hasattr(result, "started_at")
        assert hasattr(result, "completed_at")
