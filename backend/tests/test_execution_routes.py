"""Tests for execution API routes"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from unittest.mock import patch, AsyncMock
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
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/workflows/{uuid.uuid4()}/execute"
            )
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_execute_workflow_no_llm_config(db_session: AsyncSession, test_workflow: WorkflowDB):
    """Test executing workflow without LLM config"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/workflows/{test_workflow.id}/execute"
            )
            # Should fail with 400 - no LLM config
            assert response.status_code == 400
            assert "LLM provider" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_execute_workflow_success(db_session: AsyncSession, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test successful workflow execution"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Mock the executor to avoid actual execution
    with patch("backend.api.routes.execution_routes.WorkflowExecutor") as mock_executor_class:
        execution_id = str(uuid.uuid4())
        mock_executor = AsyncMock()
        mock_executor.execution_id = execution_id
        execution_state = AsyncMock()
        execution_state.status = ExecutionStatus.COMPLETED
        execution_state.model_dump = lambda mode: {}
        execution_state.completed_at = None
        mock_executor.execute = AsyncMock(return_value=execution_state)
        mock_executor_class.return_value = mock_executor
        
        # Also need to mock get_active_llm_config
        with patch("backend.api.settings_routes.get_active_llm_config") as mock_get_config:
            mock_get_config.return_value = {
                "type": "openai",
                "api_key": "sk-test-key-123456789012345678901234567890",
                "base_url": "https://api.openai.com/v1",
                "model": "gpt-4"
            }
            
            try:
                async with AsyncClient(app=app, base_url="http://test") as client:
                    response = await client.post(
                        f"/api/workflows/{test_workflow.id}/execute",
                        json={"inputs": {"test": "value"}}
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert "execution_id" in data
                    assert data["status"] == "running"
            finally:
                app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_execution_not_found(db_session: AsyncSession):
    """Test getting a non-existent execution"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/executions/{uuid.uuid4()}")
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_execution_success(db_session: AsyncSession, test_workflow: WorkflowDB):
    """Test getting an execution"""
    from main import app
    
    execution = ExecutionDB(
        id=str(uuid.uuid4()),
        workflow_id=test_workflow.id,
        user_id=None,
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
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
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
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Mock get_active_llm_config
    with patch("backend.api.settings_routes.get_active_llm_config") as mock_get_config:
        mock_get_config.return_value = {
            "type": "openai",
            "api_key": "sk-test-key-123456789012345678901234567890",
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4"
        }
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    f"/api/workflows/{workflow.id}/execute"
                )
                # Should fail with 422 - invalid workflow definition
                assert response.status_code == 422
        finally:
            app.dependency_overrides.clear()

