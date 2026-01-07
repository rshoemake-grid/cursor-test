"""
Pytest configuration and fixtures for testing.
"""
import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

from backend.database.models import WorkflowDB, ExecutionDB, SettingsDB, UserDB
from backend.database.db import Base


# Test database URL (in-memory SQLite for fast tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="function")
async def db_session():
    """Create a test database session"""
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async with TestSessionLocal() as session:
        yield session
    
    # Cleanup: drop all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def event_loop():
    """Create an instance of the default event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def sample_workflow_data():
    """Sample workflow data for testing"""
    return {
        "name": "Test Workflow",
        "description": "A test workflow",
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "name": "Start",
                "position": {"x": 0, "y": 0}
            },
            {
                "id": "agent-1",
                "type": "agent",
                "name": "Test Agent",
                "position": {"x": 100, "y": 100},
                "agent_config": {
                    "model": "gpt-4",
                    "temperature": 0.7,
                    "system_prompt": "You are a helpful assistant"
                }
            },
            {
                "id": "end-1",
                "type": "end",
                "name": "End",
                "position": {"x": 200, "y": 200}
            }
        ],
        "edges": [
            {
                "id": "e-start-agent",
                "source": "start-1",
                "target": "agent-1"
            },
            {
                "id": "e-agent-end",
                "source": "agent-1",
                "target": "end-1"
            }
        ],
        "variables": {}
    }


@pytest.fixture
def sample_user():
    """Sample user data for testing"""
    return UserDB(
        id="test-user-1",
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password_here",
        is_active=True,
        is_admin=False
    )

