"""Authentication API routes for Phase 4"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import secrets

from backend.database.db import get_db
from backend.database.models import UserDB, PasswordResetTokenDB, RefreshTokenDB
from backend.models.schemas import UserCreate, UserResponse, Token, UserLogin, PasswordResetRequest, PasswordReset, RefreshTokenRequest
from backend.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from backend.auth.auth import create_refresh_token, verify_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    # Check if username already exists
    result = await db.execute(
        select(UserDB).where(UserDB.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    result = await db.execute(
        select(UserDB).where(UserDB.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = UserDB(
        id=str(uuid.uuid4()),
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_active=True,
        is_admin=False
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        is_active=db_user.is_active,
        is_admin=db_user.is_admin,
        created_at=db_user.created_at
    )


@router.post(
    "/token",
    response_model=Token,
    summary="Login (OAuth2)",
    description="Authenticate and receive access token and refresh token (OAuth2 password flow)",
    responses={
        200: {
            "description": "Authentication successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "expires_in": 1800,
                        "user": {
                            "id": "user-123",
                            "username": "johndoe",
                            "email": "john@example.com",
                            "full_name": "John Doe",
                            "is_active": True,
                            "is_admin": False,
                            "created_at": "2026-02-23T12:00:00"
                        }
                    }
                }
            }
        }
    }
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login and get access token (OAuth2 compatible)"""
    # Get user
    result = await db.execute(
        select(UserDB).where(UserDB.username == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    # Verify credentials
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token_jwt = create_refresh_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=refresh_token_expires
    )
    
    # Store refresh token in database
    refresh_token_db = RefreshTokenDB(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=refresh_token_jwt,
        expires_at=datetime.utcnow() + refresh_token_expires,
        revoked=False
    )
    db.add(refresh_token_db)
    await db.commit()
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token_jwt,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at
        )
    )


@router.post("/login", response_model=Token)
async def login_json(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login with JSON body (alternative to OAuth2 form)"""
    from ..utils.logger import get_logger
    logger = get_logger(__name__)
    
    logger.info(f"Login attempt for username: {user_data.username}")
    
    # Get user
    result = await db.execute(
        select(UserDB).where(UserDB.username == user_data.username)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning(f"Login failed: User '{user_data.username}' not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    logger.debug(f"User found: {user.username}, email: {user.email}, active: {user.is_active}")
    
    # Verify password with better error handling
    password_valid = verify_password(user_data.password, user.hashed_password)
    logger.debug(f"Password verification result: {password_valid}")
    
    if not password_valid:
        logger.warning(f"Login failed: Invalid password for user '{user_data.username}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token with longer expiration if "remember me" is checked
    if user_data.remember_me:
        # 7 days for "remember me" (still use refresh token for security)
        access_token_expires = timedelta(days=7)
    else:
        # Default expiration
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token_jwt = create_refresh_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=refresh_token_expires
    )
    
    # Store refresh token in database
    refresh_token_db = RefreshTokenDB(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=refresh_token_jwt,
        expires_at=datetime.utcnow() + refresh_token_expires,
        revoked=False
    )
    db.add(refresh_token_db)
    await db.commit()
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token_jwt,
        expires_in=int(access_token_expires.total_seconds()),
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at
        )
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset - generates a reset token"""
    # Find user by email
    result = await db.execute(
        select(UserDB).where(UserDB.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    # Always return success (don't reveal if email exists)
    if not user:
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    
    # Generate secure token
    reset_token = secrets.token_urlsafe(32)
    
    # Create reset token record (expires in 1 hour)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    reset_token_db = PasswordResetTokenDB(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=reset_token,
        expires_at=expires_at,
        used=False
    )
    
    db.add(reset_token_db)
    await db.commit()
    
    # TODO: Send email with reset link
    # For now, we'll return the token in development (remove in production!)
    # In production, send email with link like: /reset-password?token=reset_token
    import os
    if os.getenv("ENVIRONMENT") != "production":
        return {
            "message": "Password reset token generated. In production, this would be sent via email.",
            "token": reset_token,  # Remove this in production!
            "reset_url": f"/reset-password?token={reset_token}"
        }
    
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    reset_data: PasswordReset,
    db: AsyncSession = Depends(get_db)
):
    """Reset password using reset token"""
    # Find reset token
    result = await db.execute(
        select(PasswordResetTokenDB).where(PasswordResetTokenDB.token == reset_data.token)
    )
    reset_token_db = result.scalar_one_or_none()
    
    if not reset_token_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is expired
    if datetime.utcnow() > reset_token_db.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Check if token has already been used
    if reset_token_db.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has already been used"
        )
    
    # Get user
    result = await db.execute(
        select(UserDB).where(UserDB.id == reset_token_db.user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(reset_data.new_password)
    
    # Mark token as used
    reset_token_db.used = True
    
    await db.commit()
    
    return {"message": "Password has been reset successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserDB = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at
    )


@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh Access Token",
    description="Refresh access token using refresh token (OAuth2 compatible). Returns new access token and refresh token.",
    responses={
        200: {
            "description": "Token refreshed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "expires_in": 1800,
                        "user": {
                            "id": "user-123",
                            "username": "johndoe",
                            "email": "john@example.com",
                            "full_name": "John Doe",
                            "is_active": True,
                            "is_admin": False,
                            "created_at": "2026-02-23T12:00:00"
                        }
                    }
                }
            }
        },
        401: {
            "description": "Invalid or expired refresh token",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "401",
                            "message": "Invalid refresh token",
                            "path": "/api/v1/auth/refresh",
                            "timestamp": "2026-02-23T12:00:00"
                        }
                    }
                }
            }
        }
    }
)
async def refresh_access_token(
    refresh_request: RefreshTokenRequest = Body(
        ...,
        example={
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
    ),
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token (OAuth2 compatible).
    
    This endpoint implements token rotation for enhanced security - the old refresh token
    is revoked and a new refresh token is issued along with a new access token.
    """
    # Verify refresh token
    payload = verify_refresh_token(refresh_request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username = payload.get("sub")
    user_id = payload.get("user_id")
    
    if not username or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if refresh token exists in database and is valid
    result = await db.execute(
        select(RefreshTokenDB).where(
            RefreshTokenDB.token == refresh_request.refresh_token,
            RefreshTokenDB.user_id == user_id,
            RefreshTokenDB.revoked == False
        )
    )
    refresh_token_db = result.scalar_one_or_none()
    
    if not refresh_token_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if token is expired
    if refresh_token_db.expires_at < datetime.utcnow():
        # Mark as revoked
        refresh_token_db.revoked = True
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    result = await db.execute(
        select(UserDB).where(UserDB.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Revoke old refresh token (token rotation for security)
    refresh_token_db.revoked = True
    
    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    # Create new refresh token (token rotation)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token_jwt = create_refresh_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=refresh_token_expires
    )
    
    # Store new refresh token
    new_refresh_token_db = RefreshTokenDB(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token=new_refresh_token_jwt,
        expires_at=datetime.utcnow() + refresh_token_expires,
        revoked=False
    )
    db.add(new_refresh_token_db)
    await db.commit()
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=new_refresh_token_jwt,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at
        )
    )

