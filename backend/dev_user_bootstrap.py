"""
Optional development bootstrap: ensure a dev user exists and set a known password on startup.
Gated by ENVIRONMENT=development and DEV_BOOTSTRAP_USERNAME / DEV_BOOTSTRAP_PASSWORD in .env.
"""
import re
import uuid

from sqlalchemy import or_, select

from backend.auth.auth import get_password_hash
from backend.config import get_settings
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB


def _default_dev_bootstrap_email(username: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._+-]", "-", (username or "").strip())
    return f"{safe or 'dev'}@dev-bootstrap.local"


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
            email = (settings.dev_bootstrap_email or "").strip() or _default_dev_bootstrap_email(username)
            user = UserDB(
                id=str(uuid.uuid4()),
                username=username,
                email=email,
                hashed_password=get_password_hash(password),
                full_name=None,
                is_active=True,
                is_admin=False,
            )
            db.add(user)
            await db.commit()
            return
        user.hashed_password = get_password_hash(password)
        await db.commit()
