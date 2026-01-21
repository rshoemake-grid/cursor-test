"""Tests for auth routes password reset functionality"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime, timedelta

from backend.database.models import UserDB, PasswordResetTokenDB
from backend.database.db import get_db


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
async def test_forgot_password_user_not_found(db_session: AsyncSession):
    """Test forgot password with non-existent email"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/forgot-password",
                json={"email": "nonexistent@example.com"}
            )
            # Should return 200 even if user not found (security best practice)
            assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_forgot_password_inactive_user(db_session: AsyncSession):
    """Test forgot password with inactive user"""
    from main import app
    
    import bcrypt
    password = "test123"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    inactive_user = UserDB(
        id=str(uuid.uuid4()),
        username="inactiveuser",
        email="inactive@example.com",
        hashed_password=hashed,
        is_active=False,
        is_admin=False
    )
    db_session.add(inactive_user)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/forgot-password",
                json={"email": "inactive@example.com"}
            )
            # Should return 200 even if user inactive (security best practice)
            assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_reset_password_token_not_found(db_session: AsyncSession):
    """Test password reset with non-existent token"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/reset-password",
                json={
                    "token": "non-existent-token",
                    "new_password": "newpassword123"
                }
            )
            assert response.status_code == 400
            assert "invalid" in response.json()["detail"].lower() or "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_reset_password_user_not_found(db_session: AsyncSession):
    """Test password reset with token for deleted user"""
    from main import app
    
    # Create token for non-existent user
    reset_token = PasswordResetTokenDB(
        id=str(uuid.uuid4()),
        user_id=str(uuid.uuid4()),  # Non-existent user ID
        token="orphan-token",
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db_session.add(reset_token)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/reset-password",
                json={
                    "token": "orphan-token",
                    "new_password": "newpassword123"
                }
            )
            # Could be 400 or 404 depending on implementation
            assert response.status_code in [400, 404]
    finally:
        app.dependency_overrides.clear()

