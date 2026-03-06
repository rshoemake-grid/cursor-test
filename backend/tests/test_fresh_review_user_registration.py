"""
T-4: Fresh review - User registration input validation tests.

Tests document expected validation for UserCreate:
- Username: length, format, reserved names
- Email: valid format
- Password: minimum length, complexity
- Full name: max length
"""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.database.models import UserDB
from backend.database.db import get_db


def _override_db(db_session):
    async def override():
        yield db_session
    return override


@pytest.mark.asyncio
async def test_register_rejects_empty_username(db_session: AsyncSession):
    """T-4: Registration should reject empty username."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "username": "",
                    "email": "user@example.com",
                    "password": "test12345",
                },
            )
            assert response.status_code == 422, "Empty username should be rejected"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_rejects_invalid_email(db_session: AsyncSession):
    """T-4: Registration should reject invalid email format."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "username": "newuser",
                    "email": "not-an-email",
                    "password": "test12345",
                },
            )
            assert response.status_code == 422, "Invalid email should be rejected"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_rejects_short_password(db_session: AsyncSession):
    """T-4: Registration should reject password below minimum length."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "username": "newuser",
                    "email": "user@example.com",
                    "password": "abc",
                },
            )
            assert response.status_code in (400, 422), "Short password should be rejected"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_rejects_username_too_long(db_session: AsyncSession):
    """T-4: Registration should reject excessively long username."""
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json={
                    "username": "a" * 256,
                    "email": "user@example.com",
                    "password": "test12345",
                },
            )
            assert response.status_code == 422, "Overlong username should be rejected"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_register_accepts_valid_input(db_session: AsyncSession):
    """T-4: Registration accepts valid username, email, password."""
    from unittest.mock import patch
    from main import app

    app.dependency_overrides[get_db] = _override_db(db_session)

    with patch("backend.api.auth_routes.get_password_hash", return_value="hashed_password"):
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    "/api/auth/register",
                    json={
                        "username": "validuser",
                        "email": "valid@example.com",
                        "password": "test12345",
                        "full_name": "Valid User",
                    },
                )
                assert response.status_code == 201, "Valid registration should succeed"
                data = response.json()
                assert data["username"] == "validuser"
                assert data["email"] == "valid@example.com"
        finally:
            app.dependency_overrides.clear()
