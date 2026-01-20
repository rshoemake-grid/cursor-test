"""Tests for marketplace API routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.database.models import WorkflowDB, UserDB, WorkflowLikeDB
from backend.database.db import get_db
from backend.auth import get_current_active_user, get_optional_user


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
async def public_workflow(db_session: AsyncSession, test_user: UserDB):
    """Create a public workflow"""
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Public Workflow",
        description="A public workflow",
        version="1.0.0",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id=test_user.id,
        is_public=True,
        category="automation",
        tags=["test"],
        likes_count=5,
        uses_count=10
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


@pytest.mark.asyncio
async def test_discover_workflows_empty(db_session: AsyncSession):
    """Test discovering workflows when none exist"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/marketplace/discover")
            assert response.status_code == 200
            assert response.json() == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_discover_workflows_with_data(db_session: AsyncSession, public_workflow: WorkflowDB):
    """Test discovering workflows with data"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/marketplace/discover")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "Public Workflow"
            assert data[0]["is_public"] is True
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_discover_workflows_filter_by_category(db_session: AsyncSession, public_workflow: WorkflowDB):
    """Test filtering workflows by category"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/marketplace/discover?category=automation")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            
            response = await client.get("/api/marketplace/discover?category=data_processing")
            assert response.status_code == 200
            assert len(response.json()) == 0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_discover_workflows_search(db_session: AsyncSession, public_workflow: WorkflowDB):
    """Test searching workflows"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/marketplace/discover?search=Public")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            
            response = await client.get("/api/marketplace/discover?search=nonexistent")
            assert response.status_code == 200
            assert len(response.json()) == 0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_discover_workflows_sort_by(db_session: AsyncSession, public_workflow: WorkflowDB):
    """Test sorting workflows"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/marketplace/discover?sort_by=popular")
            assert response.status_code == 200
            
            response = await client.get("/api/marketplace/discover?sort_by=recent")
            assert response.status_code == 200
            
            response = await client.get("/api/marketplace/discover?sort_by=likes")
            assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_like_workflow(db_session: AsyncSession, test_user: UserDB, public_workflow: WorkflowDB):
    """Test liking a workflow"""
    from main import app
    from backend.auth import create_access_token
    
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
                "/api/marketplace/like",
                json={"workflow_id": public_workflow.id},
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 201
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_like_workflow_requires_auth(db_session: AsyncSession, public_workflow: WorkflowDB):
    """Test that liking requires authentication"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/marketplace/like",
                json={"workflow_id": public_workflow.id}
            )
            assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_unlike_workflow(db_session: AsyncSession, test_user: UserDB, public_workflow: WorkflowDB):
    """Test unliking a workflow"""
    from main import app
    from backend.auth import create_access_token
    
    # Create existing like
    like = WorkflowLikeDB(
        id=str(uuid.uuid4()),
        workflow_id=public_workflow.id,
        user_id=test_user.id
    )
    db_session.add(like)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/api/marketplace/like/{public_workflow.id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 204
    finally:
        app.dependency_overrides.clear()

