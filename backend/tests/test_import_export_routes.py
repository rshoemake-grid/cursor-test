"""Tests for import/export API routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import json

from backend.database.models import WorkflowDB, UserDB
from backend.database.db import get_db
from backend.auth import get_optional_user, create_access_token


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
            "nodes": [{"id": "start-1", "type": "start"}],
            "edges": [],
            "variables": {}
        },
        owner_id=test_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


@pytest.mark.asyncio
async def test_export_workflow_success(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB):
    """Test exporting a workflow"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/api/import-export/export/{test_workflow.id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "workflow" in data
            assert data["workflow"]["id"] == test_workflow.id
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_export_workflow_not_found(db_session: AsyncSession, test_user: UserDB):
    """Test exporting a non-existent workflow"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/api/import-export/export/{uuid.uuid4()}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_export_workflow_unauthorized(db_session: AsyncSession, test_user: UserDB):
    """Test exporting a workflow you don't own"""
    from main import app
    
    other_user = UserDB(
        id=str(uuid.uuid4()),
        username="otheruser",
        email="other@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_admin=False
    )
    db_session.add(other_user)
    
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Private Workflow",
        description="Private",
        version="1.0.0",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id=other_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/api/import-export/export/{workflow.id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_workflow_success(db_session: AsyncSession, test_user: UserDB):
    """Test importing a workflow"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    import_data = {
        "name": "Imported Workflow",
        "description": "Imported",
        "definition": {
            "nodes": [{"id": "start-1", "type": "start"}],
            "edges": [],
            "variables": {}
        }
    }
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/import-export/import",
                json=import_data,
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Imported Workflow"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_workflow_invalid_definition(db_session: AsyncSession, test_user: UserDB):
    """Test importing workflow with invalid definition"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    import_data = {
        "name": "Invalid Workflow",
        "definition": {"invalid": "data"}  # Missing nodes/edges
    }
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/import-export/import",
                json=import_data,
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()

