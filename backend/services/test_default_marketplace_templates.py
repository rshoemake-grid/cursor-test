"""Idempotent marketplace template seeding."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import backend.database.models  # noqa: F401 — register metadata tables
from backend.database.db import Base
from backend.database.models import WorkflowDB, WorkflowTemplateDB
from backend.services.default_marketplace_templates import (
    BUNDLED_TEMPLATE_COUNT,
    ensure_default_marketplace_templates,
    ensure_default_marketplace_workflows,
)


@pytest.mark.asyncio
async def test_ensure_default_marketplace_templates_inserts_once():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        n = await ensure_default_marketplace_templates(db)
        assert n == BUNDLED_TEMPLATE_COUNT

    async with Session() as db:
        n2 = await ensure_default_marketplace_templates(db)
        assert n2 == 0

    async with Session() as db:
        from sqlalchemy import func, select

        result = await db.execute(select(func.count(WorkflowTemplateDB.id)))
        assert result.scalar() == BUNDLED_TEMPLATE_COUNT

    await engine.dispose()


@pytest.mark.asyncio
async def test_ensure_default_marketplace_workflows_inserts_once():
    from sqlalchemy import func, or_, select

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        n = await ensure_default_marketplace_workflows(db)
        assert n == BUNDLED_TEMPLATE_COUNT

    async with Session() as db:
        n2 = await ensure_default_marketplace_workflows(db)
        assert n2 == 0

    async with Session() as db:
        result = await db.execute(
            select(func.count(WorkflowDB.id)).where(
                or_(
                    WorkflowDB.is_public == True,
                    WorkflowDB.is_template == True,
                )
            )
        )
        assert result.scalar() == BUNDLED_TEMPLATE_COUNT

    await engine.dispose()
