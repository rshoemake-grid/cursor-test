"""Tests for auth routes token endpoint (OAuth2 form login)"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from unittest.mock import patch

from backend.database.models import UserDB
from backend.database.db import get_db
from backend.auth import get_password_hash, verify_password


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
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_token_endpoint_success(db_session: AsyncSession, test_user: UserDB):
    """Test OAuth2 token endpoint successful login"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            # OAuth2 form data
            response = await client.post(
                "/api/auth/token",
                data={
                    "username": "testuser",
                    "password": "test123"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert "user" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_token_endpoint_invalid_credentials(db_session: AsyncSession, test_user: UserDB):
    """Test OAuth2 token endpoint with invalid credentials"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/token",
                data={
                    "username": "testuser",
                    "password": "wrongpassword"
                }
            )
            assert response.status_code == 401
            assert "Incorrect username or password" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_token_endpoint_inactive_user(db_session: AsyncSession, test_user: UserDB):
    """Test OAuth2 token endpoint with inactive user"""
    from main import app
    
    # Make user inactive
    test_user.is_active = False
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/token",
                data={
                    "username": "testuser",
                    "password": "test123"
                }
            )
            assert response.status_code == 400
            assert "Inactive user" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_token_endpoint_user_not_found(db_session: AsyncSession):
    """Test OAuth2 token endpoint with non-existent user"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/token",
                data={
                    "username": "nonexistent",
                    "password": "password"
                }
            )
            assert response.status_code == 401
            assert "Incorrect username or password" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

