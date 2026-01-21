"""Extended tests for auth routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime, timedelta

from backend.database.models import UserDB, PasswordResetTokenDB
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
async def test_get_current_user_success(db_session: AsyncSession, test_user: UserDB):
    """Test getting current user"""
    from main import app
    from backend.auth import get_current_active_user
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["username"] == test_user.username
            assert data["email"] == test_user.email
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(db_session: AsyncSession):
    """Test getting current user without token"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/auth/me")
            assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_reset_password_token_expired(db_session: AsyncSession, test_user: UserDB):
    """Test password reset with expired token"""
    from main import app
    
    # Create expired reset token
    reset_token = PasswordResetTokenDB(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        token="expired-token",
        expires_at=datetime.utcnow() - timedelta(hours=1)  # Expired
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
                    "token": "expired-token",
                    "new_password": "newpassword123"
                }
            )
            assert response.status_code == 400
            assert "expired" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_reset_password_invalid_token(db_session: AsyncSession):
    """Test password reset with invalid token"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/reset-password",
                json={
                    "token": "invalid-token",
                    "new_password": "newpassword123"
                }
            )
            assert response.status_code == 400
            assert "invalid" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
