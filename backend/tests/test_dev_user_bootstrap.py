"""Tests for optional development user password bootstrap."""
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.auth.auth import verify_password
from backend.config import Settings, clear_settings_cache
from backend.database.db import Base
from backend.database.models import UserDB
from backend.dev_user_bootstrap import apply_dev_user_bootstrap


@pytest.fixture
async def db_session_with_user(tmp_path):
    db_path = tmp_path / "t.db"
    url = f"sqlite+aiosqlite:///{db_path}"
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        session.add(
            UserDB(
                id="u1",
                username="rshoemake",
                email="r@example.com",
                hashed_password="old",
                is_active=True,
                is_admin=False,
            )
        )
        await session.commit()
    yield session_maker, url
    await engine.dispose()


@pytest.mark.asyncio
async def test_bootstrap_skipped_in_production(monkeypatch, db_session_with_user):
    session_maker, _ = db_session_with_user
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DEV_BOOTSTRAP_USERNAME", "rshoemake")
    monkeypatch.setenv("DEV_BOOTSTRAP_PASSWORD", "newpass1234")
    clear_settings_cache()

    import backend.dev_user_bootstrap as m

    m.AsyncSessionLocal = session_maker
    try:
        await apply_dev_user_bootstrap()
    finally:
        import backend.database.db as dbmod

        m.AsyncSessionLocal = dbmod.AsyncSessionLocal

    clear_settings_cache()
    async with session_maker() as s:
        u = (await s.execute(select(UserDB).where(UserDB.username == "rshoemake"))).scalar_one()
        assert u.hashed_password == "old"


@pytest.mark.asyncio
async def test_bootstrap_updates_password_in_development(monkeypatch, db_session_with_user):
    session_maker, url = db_session_with_user
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("DATABASE_URL", url)
    monkeypatch.setenv("DEV_BOOTSTRAP_USERNAME", "rshoemake")
    monkeypatch.setenv("DEV_BOOTSTRAP_PASSWORD", "newpass1234")
    clear_settings_cache()

    import backend.config as cfg
    import backend.dev_user_bootstrap as bmod

    cfg.get_settings.cache_clear()
    bmod.AsyncSessionLocal = session_maker
    bmod.get_settings = lambda: Settings(
        environment="development",
        database_url=url,
        dev_bootstrap_username="rshoemake",
        dev_bootstrap_password="newpass1234",
    )

    def fake_hash(pw: str) -> str:
        import bcrypt
        return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    orig_hash = bmod.get_password_hash
    bmod.get_password_hash = fake_hash
    try:
        await apply_dev_user_bootstrap()
    finally:
        import backend.database.db as dbmod

        bmod.get_password_hash = orig_hash
        bmod.AsyncSessionLocal = dbmod.AsyncSessionLocal
        bmod.get_settings = cfg.get_settings

    clear_settings_cache()
    async with session_maker() as s:
        u = (await s.execute(select(UserDB).where(UserDB.username == "rshoemake"))).scalar_one()
        assert verify_password("newpass1234", u.hashed_password)
