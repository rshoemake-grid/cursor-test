"""
Optional development bootstrap: set a known password for an existing user on startup.
Gated by ENVIRONMENT=development and DEV_BOOTSTRAP_USERNAME / DEV_BOOTSTRAP_PASSWORD in .env.
"""
from sqlalchemy import or_, select

from backend.auth.auth import get_password_hash
from backend.config import get_settings
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB


async def apply_dev_user_bootstrap() -> None:
    settings = get_settings()
    if settings.environment != "development":
        return
    username = (settings.dev_bootstrap_username or "").strip()
    password = settings.dev_bootstrap_password
    if not username or not password:
        return
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(UserDB).where(
                or_(
                    UserDB.username == username,
                    UserDB.email == username,
                )
            )
        )
        user = result.scalar_one_or_none()
        if user is None:
            return
        user.hashed_password = get_password_hash(password)
        await db.commit()
