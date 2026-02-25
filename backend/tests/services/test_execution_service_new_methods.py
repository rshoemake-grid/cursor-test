"""
Unit tests for new ExecutionService methods.
This file tests get_execution_logs and cancel_execution methods.
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.execution_service import ExecutionService
from backend.models.schemas import ExecutionStatus, ExecutionLogEntry, ExecutionLogsResponse
from backend.database.models import ExecutionDB
from backend.exceptions import ExecutionNotFoundError


@pytest.fixture
def mock_db():
    """Mock database session"""
    db = AsyncMock(spec=AsyncSession)
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


@pytest.fixture
def execution_service(mock_db):
    """Execution service instance"""
    return ExecutionService(mock_db)


@pytest.fixture
def mock_execution():
    """Mock execution database object"""
    execution = MagicMock(spec=ExecutionDB)
    execution.id = "exec-123"
    execution.workflow_id = "workflow-123"
    execution.status = ExecutionStatus.RUNNING
    execution.started_at = datetime(2026, 2, 23, 12, 0, 0)
    execution.completed_at = None
    execution.state = {
        "logs": [
            {
                "timestamp": "2026-02-23T12:00:00Z",
                "level": "INFO",
                "node_id": None,
                "message": "Workflow execution started"
            },
            {
                "timestamp": "2026-02-23T12:00:05Z",
                "level": "ERROR",
                "node_id": "node-1",
                "message": "Node execution failed"
            }
        ]
    }
    return execution


class TestGetExecutionLogs:
    """Tests for get_execution_logs method"""
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_success(self, execution_service, mock_db, mock_execution):
        """Test successfully retrieving execution logs"""
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123")
        
        assert isinstance(result, ExecutionLogsResponse)
        assert result.execution_id == "exec-123"
        assert result.total == 2
        assert len(result.logs) == 2


class TestCancelExecution:
    """Tests for cancel_execution method"""
    
    @pytest.mark.asyncio
    async def test_cancel_running_execution(self, execution_service, mock_db, mock_execution):
        """Test cancelling a running execution"""
        mock_execution.status = ExecutionStatus.RUNNING
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.cancel_execution("exec-123")
        
        assert result.status == ExecutionStatus.CANCELLED
        assert mock_execution.status == ExecutionStatus.CANCELLED

    @pytest.mark.asyncio
    async def test_get_execution_logs_not_found(self, execution_service, mock_db):
        """Test getting logs for non-existent execution"""
        execution_service.repository.get_by_id = AsyncMock(return_value=None)
        
        with pytest.raises(ExecutionNotFoundError):
            await execution_service.get_execution_logs("non-existent")
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_filter_by_level(self, execution_service, mock_db, mock_execution):
        """Test filtering logs by level"""
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123", level="ERROR")
        
        assert result.total == 1
        assert len(result.logs) == 1
        assert result.logs[0].level == "ERROR"
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_filter_by_node_id(self, execution_service, mock_db, mock_execution):
        """Test filtering logs by node_id"""
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123", node_id="node-1")
        
        assert result.total == 1
        assert len(result.logs) == 1
        assert result.logs[0].node_id == "node-1"
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_filter_by_both(self, execution_service, mock_db, mock_execution):
        """Test filtering logs by both level and node_id"""
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123", level="ERROR", node_id="node-1")
        
        assert result.total == 1
        assert len(result.logs) == 1
        assert result.logs[0].level == "ERROR"
        assert result.logs[0].node_id == "node-1"
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_pagination(self, execution_service, mock_db, mock_execution):
        """Test pagination of logs"""
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123", limit=1, offset=0)
        
        assert result.total == 2
        assert len(result.logs) == 1
        assert result.limit == 1
        assert result.offset == 0
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_empty_logs(self, execution_service, mock_db, mock_execution):
        """Test getting logs when execution has no logs"""
        mock_execution.state = {"logs": []}
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123")
        
        assert result.total == 0
        assert len(result.logs) == 0
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_no_state(self, execution_service, mock_db, mock_execution):
        """Test getting logs when execution has no state"""
        mock_execution.state = None
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123")
        
        assert result.total == 0
        assert len(result.logs) == 0
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_sorted_by_timestamp(self, execution_service, mock_db, mock_execution):
        """Test that logs are sorted by timestamp (newest first)"""
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123")
        
        timestamps = [log.timestamp for log in result.logs]
        assert timestamps == sorted(timestamps, reverse=True)
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_invalid_timestamp_handling(self, execution_service, mock_db, mock_execution):
        """Test handling of invalid timestamp formats"""
        mock_execution.state = {
            "logs": [
                {
                    "timestamp": "invalid-timestamp",
                    "level": "INFO",
                    "message": "Test message"
                }
            ]
        }
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123")
        
        assert result.total == 1
        assert isinstance(result.logs[0].timestamp, datetime)
    
    @pytest.mark.asyncio
    async def test_get_execution_logs_case_insensitive_level_filter(self, execution_service, mock_db, mock_execution):
        """Test that level filter is case insensitive"""
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.get_execution_logs("exec-123", level="error")
        
        assert result.total == 1
        assert result.logs[0].level == "ERROR"



    @pytest.mark.asyncio
    async def test_cancel_pending_execution(self, execution_service, mock_db, mock_execution):
        """Test cancelling a pending execution"""
        mock_execution.status = ExecutionStatus.PENDING
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        result = await execution_service.cancel_execution("exec-123")
        
        assert result.status == ExecutionStatus.CANCELLED
        assert mock_execution.status == ExecutionStatus.CANCELLED
    
    @pytest.mark.asyncio
    async def test_cancel_execution_not_found(self, execution_service, mock_db):
        """Test cancelling non-existent execution"""
        execution_service.repository.get_by_id = AsyncMock(return_value=None)
        
        with pytest.raises(ExecutionNotFoundError):
            await execution_service.cancel_execution("non-existent")
    
    @pytest.mark.asyncio
    async def test_cancel_completed_execution_fails(self, execution_service, mock_db, mock_execution):
        """Test that cancelling a completed execution raises ValueError"""
        mock_execution.status = ExecutionStatus.COMPLETED
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        with pytest.raises(ValueError, match="not in a cancellable state"):
            await execution_service.cancel_execution("exec-123")
    
    @pytest.mark.asyncio
    async def test_cancel_failed_execution_fails(self, execution_service, mock_db, mock_execution):
        """Test that cancelling a failed execution raises ValueError"""
        mock_execution.status = ExecutionStatus.FAILED
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        with pytest.raises(ValueError, match="not in a cancellable state"):
            await execution_service.cancel_execution("exec-123")
    
    @pytest.mark.asyncio
    async def test_cancel_adds_cancellation_log(self, execution_service, mock_db, mock_execution):
        """Test that cancellation adds a log entry"""
        mock_execution.status = ExecutionStatus.RUNNING
        mock_execution.state = {"logs": []}
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        await execution_service.cancel_execution("exec-123")
        
        assert len(mock_execution.state["logs"]) == 1
        log_entry = mock_execution.state["logs"][0]
        assert log_entry["level"] == "INFO"
        assert "cancelled" in log_entry["message"].lower()
    
    @pytest.mark.asyncio
    async def test_cancel_updates_state_status(self, execution_service, mock_db, mock_execution):
        """Test that cancellation updates state status"""
        mock_execution.status = ExecutionStatus.RUNNING
        mock_execution.state = {"status": "running", "logs": []}
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        await execution_service.cancel_execution("exec-123")
        
        assert mock_execution.state["status"] == ExecutionStatus.CANCELLED
    
    @pytest.mark.asyncio
    async def test_cancel_preserves_existing_logs(self, execution_service, mock_db, mock_execution):
        """Test that cancellation preserves existing logs"""
        mock_execution.status = ExecutionStatus.RUNNING
        mock_execution.state = {
            "logs": [
                {
                    "timestamp": "2026-02-23T12:00:00Z",
                    "level": "INFO",
                    "message": "Existing log"
                }
            ]
        }
        execution_service.repository.get_by_id = AsyncMock(return_value=mock_execution)
        
        await execution_service.cancel_execution("exec-123")
        
        assert len(mock_execution.state["logs"]) == 2
        assert "Existing log" in mock_execution.state["logs"][0]["message"]
