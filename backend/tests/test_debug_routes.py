"""Tests for debug API routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.database.models import WorkflowDB, UserDB
from backend.database.db import get_db


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
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
            "nodes": [
                {"id": "start-1", "type": "start"},
                {"id": "end-1", "type": "end"}
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "end-1"}
            ],
            "variables": {}
        },
        owner_id=test_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


@pytest.mark.asyncio
async def test_validate_workflow_success(db_session: AsyncSession, test_workflow: WorkflowDB):
    """Test validating a valid workflow"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/debug/workflow/{test_workflow.id}/validate")
            assert response.status_code == 200
            data = response.json()
            assert "issues" in data
            assert "warnings" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_validate_workflow_not_found(db_session: AsyncSession):
    """Test validating a non-existent workflow"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/debug/workflow/{uuid.uuid4()}/validate")
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_validate_workflow_missing_start(db_session: AsyncSession, test_user: UserDB):
    """Test validating workflow without start node"""
    from main import app
    
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Invalid Workflow",
        description="No start",
        version="1.0.0",
        definition={
            "nodes": [
                {"id": "end-1", "type": "end"}
            ],
            "edges": [],
            "variables": {}
        },
        owner_id=test_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/debug/workflow/{workflow.id}/validate")
            assert response.status_code == 200
            data = response.json()
            assert len(data["issues"]) > 0
            assert any(issue["type"] == "missing_start" for issue in data["issues"])
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_validate_workflow_orphan_nodes(db_session: AsyncSession, test_user: UserDB):
    """Test validating workflow with orphan nodes"""
    from main import app
    
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Orphan Workflow",
        description="Has orphan nodes",
        version="1.0.0",
        definition={
            "nodes": [
                {"id": "start-1", "type": "start"},
                {"id": "orphan-1", "type": "agent"},
                {"id": "end-1", "type": "end"}
            ],
            "edges": [
                {"id": "e1", "source": "start-1", "target": "end-1"}
            ],
            "variables": {}
        },
        owner_id=test_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/debug/workflow/{workflow.id}/validate")
            assert response.status_code == 200
            data = response.json()
            assert len(data["warnings"]) > 0
            assert any(w["type"] == "orphan_nodes" for w in data["warnings"])
    finally:
        app.dependency_overrides.clear()

