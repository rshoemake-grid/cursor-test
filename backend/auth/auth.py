"""Authentication and authorization for Phase 4"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os

from backend.database.models import UserDB
from backend.database.db import get_db
from backend.config import get_settings

# Configuration - keys from environment only (never in code)
# Set SECRET_KEY and REFRESH_TOKEN_SECRET_KEY in .env or environment (see .env.example)
# P3-1: Dev fallback below is insecure. Set SECRET_KEY in .env to avoid token forgery if env misconfigured.


def _get_secret_key() -> str:
    key = os.getenv("SECRET_KEY")
    if not key or not key.strip():
        if get_settings().environment == "production":
            raise RuntimeError(
                "SECRET_KEY must be set in production. "
                "Set it in .env or environment variables. See .env.example for required keys."
            )
        return "your-secret-key-change-in-production"
    return key


def _get_refresh_secret_key() -> str:
    key = os.getenv("REFRESH_TOKEN_SECRET_KEY")
    return key if key and key.strip() else _get_secret_key()


SECRET_KEY = _get_secret_key()
REFRESH_TOKEN_SECRET_KEY = _get_refresh_secret_key()
ALGORITHM = "HS256"


def _access_token_expire_minutes() -> int:
    """Long chats (many LLM round-trips) can exceed short TTLs; override via ACCESS_TOKEN_EXPIRE_MINUTES."""
    raw = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120")
    try:
        return max(5, min(int(raw), 10080))  # 5 minutes .. 7 days
    except ValueError:
        return 120


ACCESS_TOKEN_EXPIRE_MINUTES = _access_token_expire_minutes()
REFRESH_TOKEN_EXPIRE_DAYS = 30  # Refresh tokens last 30 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash. P2-6: Use specific exceptions."""
    try:
        import bcrypt
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except (ValueError, TypeError, AttributeError):
        pass  # Invalid hash format, try passlib
    except Exception:
        return False

    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError, AttributeError):
        return False
    except Exception:
        return False  # Verification failed


def get_password_hash(password: str) -> str:
    """Hash a password with bcrypt (avoids passlib/bcrypt version skew)."""
    import bcrypt

    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, REFRESH_TOKEN_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify and decode a refresh token"""
    try:
        payload = jwt.decode(token, REFRESH_TOKEN_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[UserDB]:
    """Get the current authenticated user from JWT token"""
    # If no token provided, return None (for optional auth)
    if not token:
        return None
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    result = await db.execute(
        select(UserDB).where(UserDB.username == username)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: Optional[UserDB] = Depends(get_current_user)
) -> UserDB:
    """Get the current active user (requires authentication)"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[UserDB]:
    """Resolve user when a Bearer token is present and valid; otherwise None (no 401 for expired/invalid tokens).

    Routes that use optional auth (e.g. workflow chat) must not fail the whole request with
    \"Could not validate credentials\" when the access token expired mid-session — that breaks
    long tool-calling loops. Callers still enforce workflow access via ownership checks.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    tok_type = payload.get("type")
    if tok_type is not None and tok_type != "access":
        return None
    username = payload.get("sub")
    if username is None or not isinstance(username, str):
        return None
    result = await db.execute(select(UserDB).where(UserDB.username == username))
    return result.scalar_one_or_none()

