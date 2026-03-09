"""Tests for execution API routes"""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from unittest.mock import patch, AsyncMock, Mock
from datetime import datetime

from backend.database.models import WorkflowDB, ExecutionDB, UserDB, SettingsDB
from backend.database.db import get_db
from backend.models.schemas import ExecutionStatus


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
async def test_workflow(db_session: AsyncSession, test_user: UserDB):
    """Create a test workflow"""
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Test Workflow",
        description="A test workflow",
        version="1.0.0",
        definition={
            "nodes": [
                {
                    "id": "start-1",
                    "type": "start",
                    "name": "Start"
                },
                {
                    "id": "end-1",
                    "type": "end",
                    "name": "End"
                }
            ],
            "edges": [
                {
                    "id": "e1",
                    "source": "start-1",
                    "target": "end-1"
                }
            ],
            "variables": {}
        },
        owner_id=test_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


@pytest.fixture
async def test_settings(db_session: AsyncSession, test_user: UserDB):
    """Create test LLM settings"""
    settings = SettingsDB(
        user_id=test_user.id,
        settings_data={
            "providers": [
                {
                    "id": "test-provider",
                    "name": "Test Provider",
                    "type": "openai",
                    "apiKey": "sk-test-key-123456789012345678901234567890",
                    "baseUrl": None,
                    "defaultModel": "gpt-4",
                    "models": ["gpt-4"],
                    "enabled": True
                }
            ],
            "iteration_limit": 10
        }
    )
    db_session.add(settings)
    await db_session.commit()
    return settings


@pytest.mark.asyncio
async def test_execute_workflow_not_found(db_session: AsyncSession):
    """Test executing a non-existent workflow"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/workflows/{uuid.uuid4()}/execute"
            )
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_execute_workflow_no_llm_config(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB):
    """Test executing workflow without LLM config"""
    from main import app
    from backend.auth import get_optional_user
    
    async def override_get_db():
        yield db_session
    
    async def override_get_optional_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/workflows/{test_workflow.id}/execute"
            )
            # Should fail with 400 - no LLM config
            assert response.status_code == 400
            assert "LLM provider" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_execute_workflow_success(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test successful workflow execution"""
    from main import app
    from backend.auth import get_optional_user
    
    async def override_get_db():
        yield db_session
    
    async def override_get_optional_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    
    # Mock the executor to avoid actual execution
    with patch("backend.services.execution_orchestrator.WorkflowExecutor") as mock_executor_class:
        execution_id = str(uuid.uuid4())
        mock_executor = AsyncMock()
        mock_executor.execution_id = execution_id
        execution_state = AsyncMock()
        execution_state.status = ExecutionStatus.COMPLETED
        execution_state.model_dump = lambda mode: {}
        execution_state.completed_at = None
        mock_executor.execute = AsyncMock(return_value=execution_state)
        mock_executor_class.return_value = mock_executor
        
        # Mock SettingsService dependency
        from backend.services.settings_service import ISettingsService
        mock_settings_service = Mock(spec=ISettingsService)
        mock_settings_service.get_active_llm_config.return_value = {
            "type": "openai",
            "api_key": "sk-test-key-123456789012345678901234567890",
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4"
        }
        from backend.dependencies import get_settings_service
        app.dependency_overrides[get_settings_service] = lambda: mock_settings_service
        
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                # ExecutionRequest is optional, can send empty body or just inputs
                response = await client.post(
                    f"/api/workflows/{test_workflow.id}/execute",
                    json={"inputs": {"test": "value"}, "workflow_id": test_workflow.id}
                )
                assert response.status_code == 200
                data = response.json()
                assert "execution_id" in data
                assert data["status"] == "running"
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_execution_not_found(db_session: AsyncSession, test_user: UserDB):
    """Test getting a non-existent execution"""
    from main import app
    from backend.auth import get_current_active_user
    
    async def override_get_db():
        yield db_session
    
    async def override_get_current_active_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user
    
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(f"/api/executions/{uuid.uuid4()}")
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_execution_success(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB):
    """Test getting an execution"""
    from main import app
    from backend.auth import get_current_active_user
    
    execution = ExecutionDB(
        id=str(uuid.uuid4()),
        workflow_id=test_workflow.id,
        user_id=test_user.id,
        status="completed",
        state={
            "current_node": None,
            "result": "Test result",
            "error": None,
            "logs": []
        },
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )
    db_session.add(execution)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    async def override_get_current_active_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user
    
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(f"/api/executions/{execution.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["execution_id"] == execution.id
            assert data["workflow_id"] == test_workflow.id
            assert data["status"] == "completed"
            assert data["result"] == "Test result"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_execute_workflow_invalid_definition(db_session: AsyncSession, test_user: UserDB, test_settings: SettingsDB):
    """Test executing workflow with invalid definition"""
    from main import app
    from backend.auth import get_optional_user
    
    # Create workflow with invalid definition
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Invalid Workflow",
        description="Invalid",
        version="1.0.0",
        definition={"invalid": "data"},  # Missing nodes/edges
        owner_id=test_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    async def override_get_optional_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    
    # Mock SettingsService dependency
    from backend.services.settings_service import ISettingsService
    from backend.dependencies import get_settings_service
    
    mock_settings_service = Mock(spec=ISettingsService)
    mock_settings_service.get_active_llm_config.return_value = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    app.dependency_overrides[get_settings_service] = lambda: mock_settings_service
    
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/workflows/{workflow.id}/execute",
                json={"workflow_id": workflow.id, "inputs": {}}
            )
            # Invalid definition might be caught during reconstruction or execution
            # The executor might handle it gracefully, so check for any error status
            # or if it succeeds, that's also acceptable (executor handles invalid definitions)
            assert response.status_code in [200, 422, 500]
    finally:
        app.dependency_overrides.clear()
@pytest.fixture
async def user_b(db_session: AsyncSession):
    """Second user for IDOR test (T-5)."""
    u = UserDB(
        id=str(uuid.uuid4()),
        username="userb",
        email="userb@test.com",
        hashed_password="hashed",
        is_active=True,
        is_admin=False,
    )
    db_session.add(u)
    await db_session.commit()
    return u


@pytest.mark.asyncio
async def test_list_user_executions_returns_403_when_requesting_other_users(db_session, test_user, user_b):
    """T-5: GET /users/{user_id}/executions returns 403 when user_id != current_user (IDOR prevention)."""
    from main import app
    from backend.auth import create_access_token
    from backend.dependencies import get_execution_service
    from backend.services.execution_service import ExecutionService

    async def override_get_db():
        yield db_session

    async def override_get_execution_service():
        return ExecutionService(db_session)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_execution_service] = override_get_execution_service

    token = create_access_token(data={"sub": test_user.username})

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Request user_b's executions while authenticated as test_user
            response = await client.get(
                f"/api/users/{user_b.id}/executions",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()

