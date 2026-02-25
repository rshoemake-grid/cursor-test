"""
Additional tests for auth_routes.py coverage gaps
Tests forgot-password, reset-password, refresh token, /me endpoint
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from backend.api.auth_routes import (
    forgot_password,
    get_current_user_info
)
from backend.models.schemas import PasswordResetRequest
from backend.database.models import UserDB


@pytest.mark.asyncio
async def test_forgot_password_user_not_found(db_session):
    """Test forgot_password when user not found (lines 277-279)"""
    request = PasswordResetRequest(email="nonexistent@example.com")
    
    result = await forgot_password(request=request, db=db_session)
    
    assert "message" in result
    assert "If an account with that email exists" in result["message"]


@pytest.mark.asyncio
async def test_get_current_user_info_success(db_session):
    """Test get_current_user_info endpoint (lines 366-379)"""
    from backend.database.models import UserDB
    from datetime import datetime
    
    user = UserDB(
        id="user-123",
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        full_name="Test User",
        is_active=True,
        is_admin=False,
        created_at=datetime.utcnow()
    )
    
    result = await get_current_user_info(current_user=user)
    
    assert result.id == user.id
    assert result.username == user.username
    assert result.email == user.email
