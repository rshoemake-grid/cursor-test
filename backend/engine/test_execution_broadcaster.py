"""ExecutionBroadcaster WebSocket payload behavior."""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest

from backend.engine.execution.execution_broadcaster import ExecutionBroadcaster
from backend.models.schemas import ExecutionState, ExecutionStatus


@pytest.mark.asyncio
async def test_broadcast_completion_includes_error_when_failed():
    started = datetime.now(timezone.utc)
    completed = datetime.now(timezone.utc)
    state = ExecutionState(
        execution_id="exec-1",
        workflow_id="wf-1",
        status=ExecutionStatus.FAILED,
        error="Pub/Sub permission denied",
        started_at=started,
        completed_at=completed,
    )
    broadcaster = ExecutionBroadcaster("exec-1", state, stream_updates=True)
    with patch(
        "backend.engine.execution.execution_broadcaster.ws_manager"
    ) as mock_ws:
        mock_ws.broadcast_completion = AsyncMock()
        await broadcaster.broadcast_completion()
        mock_ws.broadcast_completion.assert_awaited_once()
        _eid, payload = mock_ws.broadcast_completion.call_args[0]
        assert _eid == "exec-1"
        assert payload["status"] == "failed"
        assert payload["error"] == "Pub/Sub permission denied"


@pytest.mark.asyncio
async def test_broadcast_completion_omits_error_when_none():
    started = datetime.now(timezone.utc)
    completed = datetime.now(timezone.utc)
    state = ExecutionState(
        execution_id="exec-2",
        workflow_id="wf-1",
        status=ExecutionStatus.COMPLETED,
        error=None,
        started_at=started,
        completed_at=completed,
    )
    broadcaster = ExecutionBroadcaster("exec-2", state, stream_updates=True)
    with patch(
        "backend.engine.execution.execution_broadcaster.ws_manager"
    ) as mock_ws:
        mock_ws.broadcast_completion = AsyncMock()
        await broadcaster.broadcast_completion()
        _eid, payload = mock_ws.broadcast_completion.call_args[0]
        assert _eid == "exec-2"
        assert "error" not in payload


@pytest.mark.asyncio
async def test_broadcast_completion_failed_uses_fallback_when_error_blank():
    started = datetime.now(timezone.utc)
    completed = datetime.now(timezone.utc)
    state = ExecutionState(
        execution_id="exec-3",
        workflow_id="wf-1",
        status=ExecutionStatus.FAILED,
        error="   ",
        started_at=started,
        completed_at=completed,
    )
    broadcaster = ExecutionBroadcaster("exec-3", state, stream_updates=True)
    with patch(
        "backend.engine.execution.execution_broadcaster.ws_manager"
    ) as mock_ws:
        mock_ws.broadcast_completion = AsyncMock()
        await broadcaster.broadcast_completion()
        _eid, payload = mock_ws.broadcast_completion.call_args[0]
        assert payload["status"] == "failed"
        assert "error" in payload
        assert "no error message" in payload["error"].lower()


@pytest.mark.asyncio
async def test_broadcast_completion_failed_uses_fallback_when_error_none():
    started = datetime.now(timezone.utc)
    completed = datetime.now(timezone.utc)
    state = ExecutionState(
        execution_id="exec-4",
        workflow_id="wf-1",
        status=ExecutionStatus.FAILED,
        error=None,
        started_at=started,
        completed_at=completed,
    )
    broadcaster = ExecutionBroadcaster("exec-4", state, stream_updates=True)
    with patch(
        "backend.engine.execution.execution_broadcaster.ws_manager"
    ) as mock_ws:
        mock_ws.broadcast_completion = AsyncMock()
        await broadcaster.broadcast_completion()
        _eid, payload = mock_ws.broadcast_completion.call_args[0]
        assert payload["status"] == "failed"
        assert "error" in payload
        assert "no error message" in payload["error"].lower()
