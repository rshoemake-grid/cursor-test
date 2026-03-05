"""Tests for ExecutionBroadcaster"""
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime

from backend.engine.execution.execution_broadcaster import ExecutionBroadcaster
from backend.models.schemas import ExecutionState, ExecutionStatus, NodeState


@pytest.fixture
def execution_state():
    """Create execution state for tests"""
    return ExecutionState(
        execution_id="test-exec-1",
        workflow_id="workflow-1",
        status=ExecutionStatus.RUNNING,
        started_at=datetime.utcnow(),
    )


@pytest.mark.asyncio
async def test_broadcast_completion(execution_state):
    """Test broadcast_completion calls ws_manager"""
    execution_state.status = ExecutionStatus.COMPLETED
    execution_state.result = {"output": "done"}
    execution_state.completed_at = datetime.utcnow()

    broadcaster = ExecutionBroadcaster("test-exec-1", execution_state, stream_updates=True)

    with patch("backend.engine.execution.execution_broadcaster.ws_manager") as mock_ws:
        mock_ws.broadcast_completion = AsyncMock()
        await broadcaster.broadcast_completion()

        mock_ws.broadcast_completion.assert_called_once()
        call_args = mock_ws.broadcast_completion.call_args
        assert call_args[0][0] == "test-exec-1"
        assert call_args[0][1]["status"] == "completed"
        assert call_args[0][1]["result"] == {"output": "done"}


@pytest.mark.asyncio
async def test_broadcast_completion_no_stream(execution_state):
    """Test broadcast_completion does nothing when stream_updates=False"""
    broadcaster = ExecutionBroadcaster("test-exec-1", execution_state, stream_updates=False)

    with patch("backend.engine.execution.execution_broadcaster.ws_manager") as mock_ws:
        mock_ws.broadcast_completion = AsyncMock()
        await broadcaster.broadcast_completion()

        mock_ws.broadcast_completion.assert_not_called()


@pytest.mark.asyncio
async def test_broadcast_error(execution_state):
    """Test broadcast_error calls ws_manager"""
    broadcaster = ExecutionBroadcaster("test-exec-1", execution_state, stream_updates=True)

    with patch("backend.engine.execution.execution_broadcaster.ws_manager") as mock_ws:
        mock_ws.broadcast_error = AsyncMock()
        await broadcaster.broadcast_error("Something went wrong")

        mock_ws.broadcast_error.assert_called_once_with("test-exec-1", "Something went wrong")


@pytest.mark.asyncio
async def test_broadcast_node_update(execution_state):
    """Test broadcast_node_update calls ws_manager"""
    node_state = NodeState(
        node_id="node-1",
        status=ExecutionStatus.COMPLETED,
        output="result",
    )

    broadcaster = ExecutionBroadcaster("test-exec-1", execution_state, stream_updates=True)

    with patch("backend.engine.execution.execution_broadcaster.ws_manager") as mock_ws:
        mock_ws.broadcast_node_update = AsyncMock()
        await broadcaster.broadcast_node_update("node-1", node_state)

        mock_ws.broadcast_node_update.assert_called_once()
        assert mock_ws.broadcast_node_update.call_args[0][0] == "test-exec-1"
        assert mock_ws.broadcast_node_update.call_args[0][1] == "node-1"
