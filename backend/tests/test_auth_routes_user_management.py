"""Tests for auth routes user management"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.database.models import UserDB
from backend.database.db import get_db
from backend.auth import create_access_token


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    import bcrypt
    password = "test123"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password=hashed,
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.mark.asyncio
async def test_register_user_duplicate_email_different_username(db_session: AsyncSession, test_user: UserDB):
    """Test registration with duplicate email but different username"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "username": "differentuser",
                    "email": test_user.email,  # Duplicate email
                    "password": "password123"
                }
            )
            assert response.status_code == 400
            assert "email" in response.json()["detail"].lower() or "already" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_user_duplicate_username_different_email(db_session: AsyncSession, test_user: UserDB):
    """Test registration with duplicate username but different email"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "username": test_user.username,  # Duplicate username
                    "email": "different@example.com",
                    "password": "password123"
                }
            )
            assert response.status_code == 400
            assert "username" in response.json()["detail"].lower() or "already" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_with_remember_me(db_session: AsyncSession, test_user: UserDB):
    """Test login with remember_me flag"""
    from main import app
    from fastapi import Form
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Use JSON format (login_json endpoint)
            response = await client.post(
                "/api/auth/login",
                json={
                    "username": test_user.username,
                    "password": "test123",
                    "remember_me": True
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_without_remember_me(db_session: AsyncSession, test_user: UserDB):
    """Test login without remember_me flag"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Use JSON format (login_json endpoint)
            response = await client.post(
                "/api/auth/login",
                json={
                    "username": test_user.username,
                    "password": "test123",
                    "remember_me": False
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
    finally:
        app.dependency_overrides.clear()

