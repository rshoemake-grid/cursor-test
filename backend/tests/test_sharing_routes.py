"""Tests for sharing API routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.database.models import WorkflowDB, UserDB, WorkflowShareDB
from backend.database.db import get_db
from backend.auth import get_current_active_user, create_access_token


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
async def other_user(db_session: AsyncSession):
    """Create another test user"""
    user = UserDB(
        id=str(uuid.uuid4()),
        username="otheruser",
        email="other@example.com",
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
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id=test_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


@pytest.mark.asyncio
async def test_share_workflow_success(db_session: AsyncSession, test_user: UserDB, other_user: UserDB, test_workflow: WorkflowDB):
    """Test successfully sharing a workflow"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/sharing/share",
                json={
                    "workflow_id": test_workflow.id,
                    "shared_with_username": other_user.username,
                    "permission": "view"
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 201
            data = response.json()
            assert data["workflow_id"] == test_workflow.id
            assert data["shared_with_user_id"] == other_user.id
            assert data["permission"] == "view"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_share_workflow_not_found(db_session: AsyncSession, test_user: UserDB, other_user: UserDB):
    """Test sharing a non-existent workflow"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/sharing/share",
                json={
                    "workflow_id": str(uuid.uuid4()),
                    "shared_with_username": other_user.username,
                    "permission": "view"
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_share_workflow_unauthorized(db_session: AsyncSession, other_user: UserDB, test_workflow: WorkflowDB):
    """Test sharing a workflow you don't own"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return other_user  # Not the owner
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": other_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/sharing/share",
                json={
                    "workflow_id": test_workflow.id,
                    "shared_with_username": "testuser",
                    "permission": "view"
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_share_workflow_user_not_found(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB):
    """Test sharing with non-existent user"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/sharing/share",
                json={
                    "workflow_id": test_workflow.id,
                    "shared_with_username": "nonexistent",
                    "permission": "view"
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_shared_workflows(db_session: AsyncSession, test_user: UserDB, other_user: UserDB, test_workflow: WorkflowDB):
    """Test getting workflows shared with user"""
    from main import app
    
    # Create a share
    share = WorkflowShareDB(
        id=str(uuid.uuid4()),
        workflow_id=test_workflow.id,
        shared_with_user_id=other_user.id,
        permission="read",
        shared_by=test_user.id
    )
    db_session.add(share)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return other_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": other_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/sharing/shared-with-me",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["workflow_id"] == test_workflow.id
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_shared_workflows_requires_auth(db_session: AsyncSession):
    """Test that getting shared workflows requires authentication"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/sharing/shared-with-me")
            assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()

