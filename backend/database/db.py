from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from ..config import settings

DATABASE_URL = settings.database_url

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.log_level.upper() == "DEBUG",  # Only echo SQL in DEBUG mode
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


def _ensure_execution_list_indexes(sync_conn) -> None:
    """
    Add list-query indexes on existing DBs. SQLAlchemy create_all does not alter
    already-created tables, so Logs /executions lists stay slow until these exist.
    """
    dialect = sync_conn.dialect.name
    if dialect == "sqlite":
        ddl = [
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_user_started_at "
                "ON executions (user_id, started_at DESC)"
            ),
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_workflow_started_at "
                "ON executions (workflow_id, started_at DESC)"
            ),
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_user_status_started_at "
                "ON executions (user_id, status, started_at DESC)"
            ),
        ]
    elif dialect == "postgresql":
        ddl = [
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_user_started_at "
                "ON executions (user_id, started_at DESC)"
            ),
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_workflow_started_at "
                "ON executions (workflow_id, started_at DESC)"
            ),
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_user_status_started_at "
                "ON executions (user_id, status, started_at DESC)"
            ),
        ]
    else:
        ddl = [
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_user_started_at "
                "ON executions (user_id, started_at)"
            ),
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_workflow_started_at "
                "ON executions (workflow_id, started_at)"
            ),
            (
                "CREATE INDEX IF NOT EXISTS ix_executions_user_status_started_at "
                "ON executions (user_id, status, started_at)"
            ),
        ]
    for stmt in ddl:
        sync_conn.execute(text(stmt))


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_ensure_execution_list_indexes)


async def get_db() -> AsyncSession:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

