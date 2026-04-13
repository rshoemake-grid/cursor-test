"""Periodic DB snapshot while execution is RUNNING."""
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.models.schemas import (
    ExecutionLogEntry,
    ExecutionState,
    ExecutionStatus,
)
from backend.services.execution_orchestrator import ExecutionOrchestrator


@pytest.mark.asyncio
async def test_running_snapshot_loop_writes_db_while_running():
    db = MagicMock()
    settings = MagicMock()
    wf_service = MagicMock()
    orch = ExecutionOrchestrator(db, settings, wf_service)
    orch.update_execution_status = AsyncMock()

    started = datetime.now(timezone.utc)
    st = ExecutionState(
        execution_id="exec-hb",
        workflow_id="wf-1",
        status=ExecutionStatus.RUNNING,
        started_at=started,
    )
    st.logs.append(
        ExecutionLogEntry(
            timestamp=started,
            level="INFO",
            node_id=None,
            message="heartbeat-test",
        )
    )
    executor = MagicMock()
    executor.execution_state = st

    task = asyncio.create_task(
        orch._persist_running_execution_snapshot_loop(
            "exec-hb", executor, interval_sec=0.05
        )
    )
    await asyncio.sleep(0.13)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task

    assert orch.update_execution_status.await_count >= 1
    first = orch.update_execution_status.await_args_list[0].kwargs
    assert first["execution_id"] == "exec-hb"
    assert first["status"] == ExecutionStatus.RUNNING
    assert first["completed_at"] is None
    assert "logs" in first["state"]


@pytest.mark.asyncio
async def test_run_execution_cancels_heartbeat_in_finally(monkeypatch):
    db = MagicMock()
    settings = MagicMock()
    wf_service = MagicMock()
    orch = ExecutionOrchestrator(db, settings, wf_service)
    orch.update_execution_status = AsyncMock()

    started = datetime.now(timezone.utc)
    st = ExecutionState(
        execution_id="exec-done",
        workflow_id="wf-1",
        status=ExecutionStatus.COMPLETED,
        started_at=started,
        completed_at=started,
    )
    executor = MagicMock()
    executor.execution_state = st
    executor.execute = AsyncMock(return_value=st)

    monkeypatch.setenv("EXECUTION_STATE_PERSIST_INTERVAL_SEC", "0.05")
    try:
        await orch.run_execution_in_background(executor, "exec-done", {})
    finally:
        monkeypatch.delenv("EXECUTION_STATE_PERSIST_INTERVAL_SEC", raising=False)

    assert executor.execute.await_count == 1
    terminal_calls = [
        c
        for c in orch.update_execution_status.await_args_list
        if c.kwargs.get("status") == ExecutionStatus.COMPLETED
    ]
    assert len(terminal_calls) == 1
