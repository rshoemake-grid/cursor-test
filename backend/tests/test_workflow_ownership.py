"""T-1: Workflow ownership tests - update/delete/publish reject when user != owner."""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.database.models import WorkflowDB, UserDB
from backend.database.db import get_db
from backend.auth import get_password_hash, create_access_token, get_current_active_user
from backend.services.workflow_service import WorkflowService
from backend.exceptions import WorkflowForbiddenError
from backend.models.schemas import WorkflowCreate, Node, NodeType, Edge


@pytest.fixture
async def user_a(db_session: AsyncSession):
    """Create user A (workflow owner)."""
    import bcrypt
    hashed = bcrypt.hashpw(b"pass123", bcrypt.gensalt()).decode("utf-8")
    u = UserDB(
        id=str(uuid.uuid4()),
        username="usera",
        email="a@test.com",
        hashed_password=hashed,
        is_active=True,
        is_admin=False,
    )
    db_session.add(u)
    await db_session.commit()
    return u


@pytest.fixture
async def user_b(db_session: AsyncSession):
    """Create user B (different user)."""
    import bcrypt
    hashed = bcrypt.hashpw(b"pass123", bcrypt.gensalt()).decode("utf-8")
    u = UserDB(
        id=str(uuid.uuid4()),
        username="userb",
        email="b@test.com",
        hashed_password=hashed,
        is_active=True,
        is_admin=False,
    )
    db_session.add(u)
    await db_session.commit()
    return u


@pytest.fixture
async def workflow_owned_by_a(db_session: AsyncSession, user_a: UserDB):
    """Workflow owned by user A."""
    w = WorkflowDB(
        id=str(uuid.uuid4()),
        name="A's Workflow",
        description="",
        version="1.0.0",
        definition={"nodes": [{"id": "start-1", "type": "start"}], "edges": [], "variables": {}},
        owner_id=user_a.id,
        is_public=False,
    )
    db_session.add(w)
    await db_session.commit()
    return w


@pytest.mark.asyncio
async def test_update_workflow_rejects_when_user_not_owner(db_session, user_a, user_b, workflow_owned_by_a):
    """User B cannot update workflow owned by user A."""
    service = WorkflowService(db_session)
    wc = WorkflowCreate(
        name="Hacked",
        description="",
        nodes=[Node(id="start-1", type=NodeType.START, name="S", position={"x": 0, "y": 0})],
        edges=[],
        variables={},
    )
    with pytest.raises(WorkflowForbiddenError):
        await service.update_workflow(workflow_owned_by_a.id, wc, user_id=user_b.id)


@pytest.mark.asyncio
async def test_delete_workflow_rejects_when_user_not_owner(db_session, user_a, user_b, workflow_owned_by_a):
    """User B cannot delete workflow owned by user A."""
    service = WorkflowService(db_session)
    with pytest.raises(WorkflowForbiddenError):
        await service.delete_workflow(workflow_owned_by_a.id, user_id=user_b.id)


@pytest.mark.asyncio
async def test_update_workflow_allows_owner(db_session, user_a, workflow_owned_by_a):
    """User A can update own workflow."""
    service = WorkflowService(db_session)
    wc = WorkflowCreate(
        name="Updated by owner",
        description="",
        nodes=[Node(id="start-1", type=NodeType.START, name="S", position={"x": 0, "y": 0})],
        edges=[],
        variables={},
    )
    updated = await service.update_workflow(workflow_owned_by_a.id, wc, user_id=user_a.id)
    assert updated.name == "Updated by owner"
