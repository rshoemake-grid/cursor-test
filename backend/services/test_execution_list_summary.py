"""Execution list responses omit heavy log payloads; status filter supports CSV."""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.database.models import ExecutionDB
from backend.services.execution_service import ExecutionService


def _sample_execution():
    started = datetime.now(timezone.utc)
    return ExecutionDB(
        id="exec-1",
        workflow_id="wf-1",
        user_id="user-1",
        status="failed",
        state={
            "logs": [
                {
                    "level": "ERROR",
                    "message": "boom",
                    "timestamp": started.isoformat(),
                    "node_id": None,
                }
            ],
            "error": "failed for test",
            "current_node": "n1",
        },
        started_at=started,
        completed_at=started,
    )


@pytest.mark.asyncio
async def test_list_executions_uses_empty_logs_for_payload_size():
    ex = _sample_execution()
    mock_repo = MagicMock()
    mock_repo.list_executions = AsyncMock(return_value=[ex])
    mock_db = MagicMock()
    svc = ExecutionService(mock_db)
    svc.repository = mock_repo

    rows = await svc.list_executions(user_id="user-1", limit=10)
    assert len(rows) == 1
    assert rows[0].logs == []
    assert rows[0].status == "failed"
    assert rows[0].error == "failed for test"


@pytest.mark.asyncio
async def test_get_execution_still_returns_logs():
    ex = _sample_execution()
    mock_repo = MagicMock()
    mock_repo.get_by_id = AsyncMock(return_value=ex)
    mock_db = MagicMock()
    svc = ExecutionService(mock_db)
    svc.repository = mock_repo

    row = await svc.get_execution("exec-1")
    assert len(row.logs) == 1
    assert row.logs[0].message == "boom"


def _execution_running_column_failed_state():
    started = datetime.now(timezone.utc)
    return ExecutionDB(
        id="exec-lag",
        workflow_id="wf-1",
        user_id="user-1",
        status="running",
        state={
            "logs": [],
            "error": "node blew up",
            "status": "failed",
        },
        started_at=started,
        completed_at=started,
    )


@pytest.mark.asyncio
async def test_db_to_response_uses_state_terminal_when_column_running():
    ex = _execution_running_column_failed_state()
    mock_db = MagicMock()
    svc = ExecutionService(mock_db)
    row = svc._db_to_response(ex, include_logs=False)
    assert row.status == "failed"


def _execution_running_column_error_no_state_status():
    started = datetime.now(timezone.utc)
    return ExecutionDB(
        id="exec-inf",
        workflow_id="wf-1",
        user_id="user-1",
        status="running",
        state={"logs": [], "error": "oops"},
        started_at=started,
        completed_at=started,
    )


@pytest.mark.asyncio
async def test_db_to_response_infers_failed_when_completed_with_error():
    ex = _execution_running_column_error_no_state_status()
    mock_db = MagicMock()
    svc = ExecutionService(mock_db)
    row = svc._db_to_response(ex, include_logs=False)
    assert row.status == "failed"


@pytest.mark.asyncio
async def test_db_to_response_cancelled_column_round_trip():
    started = datetime.now(timezone.utc)
    ex = ExecutionDB(
        id="exec-can",
        workflow_id="wf-1",
        user_id="user-1",
        status="cancelled",
        state={"logs": [], "status": "cancelled"},
        started_at=started,
        completed_at=started,
    )
    mock_db = MagicMock()
    svc = ExecutionService(mock_db)
    row = svc._db_to_response(ex, include_logs=False)
    assert row.status == "cancelled"
