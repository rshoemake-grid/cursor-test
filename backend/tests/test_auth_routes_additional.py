"""
Additional tests for auth_routes.py - covering more paths
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from backend.api.auth_routes import (
    register_user,
    login,
    login_json,
    reset_password,
    refresh_access_token
)
from backend.models.schemas import (
    UserCreate,
    UserLogin,
    PasswordReset,
    RefreshTokenRequest
)
from backend.database.models import UserDB, PasswordResetTokenDB, RefreshTokenDB
# create_refresh_token and verify_refresh_token are imported from backend.auth.auth in auth_routes


@pytest.mark.asyncio
async def test_register_user_success(db_session):
    """Test register_user success (lines 35-74)"""
    user_data = UserCreate(
        username="newuser",
        email="newuser@example.com",
        password="password123",
        full_name="New User"
    )
    
    result = await register_user(user_data=user_data, db=db_session)
    
    assert result.username == "newuser"
    assert result.email == "newuser@example.com"
    assert result.is_active is True


@pytest.mark.asyncio
async def test_login_oauth2_success(db_session):
    """Test login OAuth2 endpoint success (lines 116-171)"""
    from fastapi.security import OAuth2PasswordRequestForm
    
    user = UserDB(
        id="user-123",
        username="testuser",
        email="test@example.com",
        hashed_password="$2b$12$hashed",  # Mock hashed password
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    form_data = MagicMock(spec=OAuth2PasswordRequestForm)
    form_data.username = "testuser"
    form_data.password = "password123"
    
    with patch('backend.api.auth_routes.db.execute') as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_execute.return_value = mock_result
        
        with patch('backend.api.auth_routes.verify_password', return_value=True):
            with patch('backend.api.auth_routes.create_access_token', return_value="access-token"):
                with patch('backend.api.auth_routes.create_refresh_token', return_value="refresh-token"):
                    result = await login(form_data=form_data, db=db_session)
                    
                    assert result.access_token == "access-token"
                    assert result.token_type == "bearer"


@pytest.mark.asyncio
async def test_login_json_with_remember_me(db_session):
    """Test login_json with remember_me (lines 218-262)"""
    user = UserDB(
        id="user-123",
        username="testuser",
        email="test@example.com",
        hashed_password="$2b$12$hashed",
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    user_data = UserLogin(
        username="testuser",
        password="password123",
        remember_me=True
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_execute.return_value = mock_result
        
        with patch('backend.api.auth_routes.verify_password', return_value=True):
            with patch('backend.api.auth_routes.create_access_token', return_value="access-token"):
                with patch('backend.api.auth_routes.create_refresh_token', return_value="refresh-token"):
                    result = await login_json(user_data=user_data, db=db_session)
                    
                    assert result.access_token == "access-token"
                    # Check that expires_in is 7 days in seconds
                    assert result.expires_in == 7 * 24 * 60 * 60


@pytest.mark.asyncio
async def test_reset_password_success(db_session):
    """Test reset_password success path (lines 355-363)"""
    user = UserDB(
        id="user-123",
        username="testuser",
        email="test@example.com",
        hashed_password="old-hashed",
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    reset_token_db = PasswordResetTokenDB(
        id="token-123",
        user_id=user.id,
        token="valid-token",
        expires_at=datetime.utcnow() + timedelta(hours=1),
        used=False
    )
    
    reset_data = PasswordReset(token="valid-token", new_password="newpass123")
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        def execute_side_effect(query):
            mock_result = MagicMock()
            if "password_reset_tokens" in str(query):
                mock_result.scalar_one_or_none.return_value = reset_token_db
            else:
                mock_result.scalar_one_or_none.return_value = user
            return mock_result
        
        mock_execute.side_effect = execute_side_effect
        
        result = await reset_password(reset_data=reset_data, db=db_session)
        
        assert "message" in result
        assert reset_token_db.used is True


@pytest.mark.asyncio
async def test_refresh_access_token_success(db_session):
    """Test refresh_access_token success path (lines 472-514)"""
    user = UserDB(
        id="user-123",
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        is_active=True,
        is_admin=False,
        created_at=datetime.utcnow()
    )
    
    refresh_token_db = RefreshTokenDB(
        id="token-123",
        user_id=user.id,
        token="valid-refresh-token",
        expires_at=datetime.utcnow() + timedelta(days=7),
        revoked=False
    )
    
    request = RefreshTokenRequest(refresh_token="valid-refresh-token")
    
    with patch('backend.api.auth_routes.verify_refresh_token', return_value={"sub": user.username, "user_id": user.id}):
        with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
            def execute_side_effect(query):
                mock_result = MagicMock()
                if "refresh_tokens" in str(query):
                    mock_result.scalar_one_or_none.return_value = refresh_token_db
                else:
                    mock_result.scalar_one_or_none.return_value = user
                return mock_result
            
            mock_execute.side_effect = execute_side_effect
            
            with patch('backend.api.auth_routes.create_access_token', return_value="new-access-token"):
                with patch('backend.api.auth_routes.create_refresh_token', return_value="new-refresh-token"):
                    result = await refresh_access_token(refresh_request=request, db=db_session)
                    
                    assert result.access_token == "new-access-token"
                    assert result.refresh_token == "new-refresh-token"
                    assert refresh_token_db.revoked is True
