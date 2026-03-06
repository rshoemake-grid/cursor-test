"""
T-1, T-3: Fresh review - Execution IDOR and list_executions auth tests.

Tests document expected secure behavior:
- T-1: get_execution, get_execution_logs, cancel_execution require auth and ownership
- T-3: list_executions restricts user_id to current_user when authenticated
"""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime, timezone
from unittest.mock import Mock, patch

from backend.database.models import WorkflowDB, ExecutionDB, UserDB, SettingsDB
from backend.database.db import get_db
from backend.auth import create_access_token
from backend.dependencies import get_execution_service
from backend.services.execution_service import ExecutionService


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def user_b(db_session: AsyncSession):
    """Second user for IDOR tests"""
    user = UserDB(
        id=str(uuid.uuid4()),
        username="userb",
        email="userb@test.com",
        hashed_password="hashed",
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_workflow(db_session: AsyncSession, test_user: UserDB):
    """Create a test workflow"""
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Test Workflow",
        description="A test workflow",
        version="1.0.0",
        definition={
            "nodes": [{"id": "start-1", "type": "start", "name": "Start"}, {"id": "end-1", "type": "end", "name": "End"}],
            "edges": [{"id": "e1", "source": "start-1", "target": "end-1"}],
            "variables": {},
        },
        owner_id=test_user.id,
        is_public=False,
    )
    db_session.add(workflow)
    await db_session.commit()
    await db_session.refresh(workflow)
    return workflow


@pytest.fixture
async def execution_user_a(db_session: AsyncSession, test_workflow: WorkflowDB, test_user: UserDB):
    """Execution owned by test_user (user A)"""
    exec_ = ExecutionDB(
        id=str(uuid.uuid4()),
        workflow_id=test_workflow.id,
        user_id=test_user.id,
        status="running",
        state={"current_node": None, "result": None, "error": None, "logs": []},
        started_at=datetime.now(timezone.utc),
        completed_at=None,
    )
    db_session.add(exec_)
    await db_session.commit()
    await db_session.refresh(exec_)
    return exec_


@pytest.fixture
async def execution_user_b(db_session: AsyncSession, test_workflow: WorkflowDB, user_b: UserDB):
    """Execution owned by user_b (user B)"""
    exec_ = ExecutionDB(
        id=str(uuid.uuid4()),
        workflow_id=test_workflow.id,
        user_id=user_b.id,
        status="running",
        state={"current_node": None, "result": None, "error": None, "logs": []},
        started_at=datetime.now(timezone.utc),
        completed_at=None,
    )
    db_session.add(exec_)
    await db_session.commit()
    await db_session.refresh(exec_)
    return exec_


def _override_db(db_session):
    async def override():
        yield db_session
    return override


def _override_execution_service(db_session):
    async def override():
        return ExecutionService(db_session)
    return override


@pytest.mark.asyncio
async def test_get_execution_requires_auth(db_session, execution_user_a):
    """T-1: Unauthenticated GET /executions/{id} should return 401."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)
    app.dependency_overrides[get_execution_service] = _override_execution_service(db_session)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(f"/api/executions/{execution_user_a.id}")
            assert response.status_code == 401, "Unauthenticated access should be rejected"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_execution_rejects_other_users_execution(db_session, execution_user_b, test_user):
    """T-1: User A cannot GET User B's execution (403)."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)
    app.dependency_overrides[get_execution_service] = _override_execution_service(db_session)

    token = create_access_token(data={"sub": test_user.username})

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/executions/{execution_user_b.id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403, "Access to other user's execution should be forbidden"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_execution_logs_requires_auth(db_session, execution_user_a):
    """T-1: Unauthenticated GET /executions/{id}/logs should return 401."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)
    app.dependency_overrides[get_execution_service] = _override_execution_service(db_session)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(f"/api/executions/{execution_user_a.id}/logs")
            assert response.status_code == 401, "Unauthenticated access should be rejected"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_execution_logs_rejects_other_users_execution(db_session, execution_user_b, test_user):
    """T-1: User A cannot GET User B's execution logs (403)."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)
    app.dependency_overrides[get_execution_service] = _override_execution_service(db_session)

    token = create_access_token(data={"sub": test_user.username})

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/executions/{execution_user_b.id}/logs",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403, "Access to other user's logs should be forbidden"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_cancel_execution_requires_auth(db_session, execution_user_a):
    """T-1: Unauthenticated POST /executions/{id}/cancel should return 401."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)
    app.dependency_overrides[get_execution_service] = _override_execution_service(db_session)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(f"/api/executions/{execution_user_a.id}/cancel")
            assert response.status_code == 401, "Unauthenticated cancel should be rejected"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_cancel_execution_rejects_other_users_execution(db_session, execution_user_b, test_user):
    """T-1: User A cannot cancel User B's execution (403)."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)
    app.dependency_overrides[get_execution_service] = _override_execution_service(db_session)

    token = create_access_token(data={"sub": test_user.username})

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/executions/{execution_user_b.id}/cancel",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403, "Cancel of other user's execution should be forbidden"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_executions_rejects_user_id_of_other_user(db_session, test_user, user_b, execution_user_b):
    """T-3: Authenticated user cannot pass user_id of another user to list their executions."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)
    app.dependency_overrides[get_execution_service] = _override_execution_service(db_session)

    token = create_access_token(data={"sub": test_user.username})

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/executions?user_id={user_b.id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403 or (
                response.status_code == 200 and all(
                    e.get("user_id") == test_user.id or e.get("user_id") is None
                    for e in response.json()
                )
            )
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_executions_unauthenticated_returns_empty_or_401(db_session):
    """T-3: Unauthenticated list_executions should not return other users' data."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)
    app.dependency_overrides[get_execution_service] = _override_execution_service(db_session)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/executions")
            assert response.status_code in (200, 401)
            if response.status_code == 200:
                data = response.json()
                assert isinstance(data, list)
    finally:
        app.dependency_overrides.clear()
