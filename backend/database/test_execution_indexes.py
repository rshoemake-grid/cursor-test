"""Execution table indexes for list / Logs queries."""
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from backend.database.db import Base, _ensure_execution_list_indexes


@pytest.mark.asyncio
async def test_ensure_execution_list_indexes_on_sqlite():
    """Idempotent CREATE INDEX IF NOT EXISTS for composite list-query indexes."""
    import backend.database.models  # noqa: F401 — register models on Base.metadata

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_ensure_execution_list_indexes)

    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT name FROM sqlite_master WHERE type='index' "
                "AND tbl_name='executions' ORDER BY name"
            )
        )
        names = [row[0] for row in result.fetchall()]

    for expected in (
        "ix_executions_user_started_at",
        "ix_executions_workflow_started_at",
        "ix_executions_user_status_started_at",
    ):
        assert expected in names

    async with engine.begin() as conn:
        await conn.run_sync(_ensure_execution_list_indexes)
