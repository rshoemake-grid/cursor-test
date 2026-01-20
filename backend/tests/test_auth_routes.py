"""Tests for authentication API routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime, timedelta

from backend.database.models import UserDB, PasswordResetTokenDB
from backend.database.db import get_db
from backend.auth import get_password_hash, create_access_token


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    # Hash password directly to avoid bcrypt import issues
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
async def test_register_user_success(db_session: AsyncSession):
    """Test successful user registration"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "username": "newuser",
                    "email": "newuser@example.com",
                    "password": "pass123",
                    "full_name": "New User"
                }
            )
            assert response.status_code == 201
            data = response.json()
            assert data["username"] == "newuser"
            assert data["email"] == "newuser@example.com"
            assert data["is_active"] is True
            assert "id" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_user_duplicate_username(db_session: AsyncSession, test_user: UserDB):
    """Test registration with duplicate username"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "username": test_user.username,
                    "email": "different@example.com",
                    "password": "password123"
                }
            )
            assert response.status_code == 400
            assert "already registered" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_user_duplicate_email(db_session: AsyncSession, test_user: UserDB):
    """Test registration with duplicate email"""
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
                    "email": test_user.email,
                    "password": "password123"
                }
            )
            assert response.status_code == 400
            assert "already registered" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_success(db_session: AsyncSession, test_user: UserDB):
    """Test successful login"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
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
            assert data["token_type"] == "bearer"
            assert data["user"]["username"] == test_user.username
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_invalid_password(db_session: AsyncSession, test_user: UserDB):
    """Test login with invalid password"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/login",
                json={
                    "username": test_user.username,
                    "password": "wrongpassword",
                    "remember_me": False
                }
            )
            assert response.status_code == 401
            assert "Incorrect" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_inactive_user(db_session: AsyncSession):
    """Test login with inactive user"""
    from main import app
    import bcrypt
    
    password = "password"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    inactive_user = UserDB(
        id=str(uuid.uuid4()),
        username="inactive",
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
                "/api/auth/login",
                json={
                    "username": inactive_user.username,
                    "password": "password",
                    "remember_me": False
                }
            )
            assert response.status_code == 400
            assert "Inactive" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_login_remember_me(db_session: AsyncSession, test_user: UserDB):
    """Test login with remember_me option"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_get_current_user(db_session: AsyncSession, test_user: UserDB):
    """Test getting current user info"""
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
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_forgot_password(db_session: AsyncSession, test_user: UserDB):
    """Test forgot password request"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/forgot-password",
                json={"email": test_user.email}
            )
            assert response.status_code == 200
            assert "message" in response.json()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_reset_password(db_session: AsyncSession, test_user: UserDB):
    """Test password reset"""
    from main import app
    
    # Create reset token
    reset_token = PasswordResetTokenDB(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        token="test-reset-token",
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
                    "token": "test-reset-token",
                    "new_password": "newpassword123"
                }
            )
            assert response.status_code == 200
            assert "message" in response.json()
            
            # Verify password was changed
            await db_session.refresh(test_user)
            from backend.auth import verify_password
            assert verify_password("newpassword123", test_user.hashed_password)
    finally:
        app.dependency_overrides.clear()

