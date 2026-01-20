"""Tests for template API routes"""
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.database.models import WorkflowTemplateDB, UserDB
from backend.models.schemas import TemplateCategory, TemplateDifficulty
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
async def test_template(db_session: AsyncSession, test_user: UserDB):
    """Create a test template"""
    template = WorkflowTemplateDB(
        id=str(uuid.uuid4()),
        name="Test Template",
        description="A test template",
        category=TemplateCategory.AUTOMATION,
        tags=["test", "automation"],
        definition={"nodes": [], "edges": []},
        author_id=test_user.id,
        is_official=False,
        difficulty=TemplateDifficulty.BEGINNER,
        estimated_time=5
    )
    db_session.add(template)
    await db_session.commit()
    return template


@pytest.mark.asyncio
async def test_list_templates_empty(db_session: AsyncSession):
    """Test listing templates when none exist"""
    from main import app
    
    app.dependency_overrides[get_db] = lambda: db_session
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/templates/")
            assert response.status_code == 200
            assert response.json() == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_templates_with_data(db_session: AsyncSession, test_template: WorkflowTemplateDB, test_user: UserDB):
    """Test listing templates with data"""
    from main import app
    
    app.dependency_overrides[get_db] = lambda: db_session
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/templates/")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "Test Template"
            assert data[0]["author_name"] == test_user.username
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_templates_filter_by_category(db_session: AsyncSession, test_template: WorkflowTemplateDB, test_user: UserDB):
    """Test filtering templates by category"""
    from main import app
    
    app.dependency_overrides[get_db] = lambda: db_session
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/templates/?category=automation")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            
            response = await client.get("/api/templates/?category=data_processing")
            assert response.status_code == 200
            assert len(response.json()) == 0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_templates_search(db_session: AsyncSession, test_template: WorkflowTemplateDB, test_user: UserDB):
    """Test searching templates"""
    from main import app
    
    app.dependency_overrides[get_db] = lambda: db_session
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/templates/?search=test")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            
            response = await client.get("/api/templates/?search=nonexistent")
            assert response.status_code == 200
            assert len(response.json()) == 0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_template(db_session: AsyncSession, test_template: WorkflowTemplateDB, test_user: UserDB):
    """Test getting a specific template"""
    from main import app
    
    app.dependency_overrides[get_db] = lambda: db_session
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/templates/{test_template.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == test_template.id
            assert data["name"] == "Test Template"
            assert data["author_name"] == test_user.username
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_template_not_found(db_session: AsyncSession):
    """Test getting a non-existent template"""
    from main import app
    
    app.dependency_overrides[get_db] = lambda: db_session
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/templates/{uuid.uuid4()}")
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_categories():
    """Test listing template categories"""
    from main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/templates/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) > 0


@pytest.mark.asyncio
async def test_list_difficulties():
    """Test listing difficulty levels"""
    from main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/templates/difficulties")
        assert response.status_code == 200
        difficulties = response.json()
        assert isinstance(difficulties, list)
        assert len(difficulties) > 0

