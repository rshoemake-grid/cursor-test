"""
Additional tests for debug_routes.py coverage gaps
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from backend.api.debug_routes import get_execution_history, get_workflow_stats
from backend.database.models import ExecutionDB
from backend.models.schemas import ExecutionStatus


@pytest.mark.asyncio
async def test_get_execution_history_with_status(db_session):
    """Test get_execution_history with status filter"""
    workflow_id = "workflow-123"
    execution = ExecutionDB(
        id="exec-1",
        workflow_id=workflow_id,
        status=ExecutionStatus.COMPLETED.value,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [execution]
        mock_execute.return_value = mock_result
        
        result = await get_execution_history(
            workflow_id=workflow_id,
            limit=10,
            status=ExecutionStatus.COMPLETED.value,
            db=db_session
        )
        
        assert len(result) == 1
        assert result[0]["execution_id"] == execution.id


@pytest.mark.asyncio
async def test_get_workflow_stats_no_executions(db_session):
    """Test get_workflow_stats with no executions"""
    workflow_id = "workflow-123"
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_execute.return_value = mock_result
        
        result = await get_workflow_stats(workflow_id=workflow_id, db=db_session)
        
        assert result["total_executions"] == 0
        assert result["success_count"] == 0
        assert result["average_duration_seconds"] is None
