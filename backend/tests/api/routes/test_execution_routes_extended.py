"""
Extended tests for execution API routes to improve coverage.
Tests focus on uncovered areas:
- reconstruct_workflow_definition helper function
- execute_workflow endpoint main logic
- Background task execution
- Error handling paths
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from datetime import datetime
from fastapi import HTTPException
from httpx import AsyncClient
import uuid
import asyncio

from backend.api.routes.execution_routes import (
    router,
    reconstruct_workflow_definition,
    execute_workflow
)
from backend.database.models import WorkflowDB, ExecutionDB, UserDB, SettingsDB
from backend.database.db import get_db
from backend.models.schemas import ExecutionStatus, ExecutionRequest
from backend.exceptions import WorkflowNotFoundError
from backend.services.settings_service import ISettingsService
from sqlalchemy import select


@pytest.fixture
async def test_user(db_session):
    """Create a test user"""
    from backend.database.models import UserDB
    import uuid
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
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_workflow(db_session, test_user):
    """Create a test workflow"""
    from backend.database.models import WorkflowDB
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
    await db_session.refresh(workflow)
    return workflow


@pytest.fixture
async def test_settings(db_session, test_user):
    """Create test LLM settings"""
    from backend.database.models import SettingsDB
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


class TestReconstructWorkflowDefinition:
    """Test reconstruct_workflow_definition helper function"""
    
    def test_reconstruct_basic_workflow(self):
        """Test reconstructing a basic workflow definition"""
        definition = {
            "id": "workflow-1",
            "name": "Test Workflow",
            "description": "A test",
            "nodes": [
                {
                    "id": "node-1",
                    "type": "start",
                    "name": "Start"
                }
            ],
            "edges": [
                {
                    "id": "edge-1",
                    "source": "node-1",
                    "target": "node-2"
                }
            ],
            "variables": {}
        }
        
        result = reconstruct_workflow_definition(definition)
        
        assert result.id == "workflow-1"
        assert result.name == "Test Workflow"
        assert len(result.nodes) == 1
        assert len(result.edges) == 1
        assert result.nodes[0].id == "node-1"
        assert result.nodes[0].type.value == "start"
    
    def test_reconstruct_with_agent_config_in_data(self):
        """Test extracting agent_config from data object (lines 64-69)"""
        definition = {
            "id": "workflow-1",
            "name": "Test",
            "nodes": [
                {
                    "id": "node-1",
                    "type": "agent",
                    "name": "Agent Node",
                    "data": {
                        "agent_config": {
                            "model": "gpt-4",
                            "temperature": 0.7
                        }
                    }
                }
            ],
            "edges": [],
            "variables": {}
        }
        
        result = reconstruct_workflow_definition(definition)
        
        assert result.nodes[0].agent_config is not None
        assert result.nodes[0].agent_config.model == "gpt-4"
        assert result.nodes[0].agent_config.temperature == 0.7
    
    def test_reconstruct_with_condition_config_in_data(self):
        """Test extracting condition_config from data object (lines 57-62)"""
        definition = {
            "id": "workflow-1",
            "name": "Test",
            "nodes": [
                {
                    "id": "node-1",
                    "type": "condition",
                    "name": "Condition Node",
                    "data": {
                        "condition_config": {
                            "condition_type": "equals",
                            "field": "status",
                            "value": "active"
                        }
                    }
                }
            ],
            "edges": [],
            "variables": {}
        }
        
        result = reconstruct_workflow_definition(definition)
        
        assert result.nodes[0].condition_config is not None
        assert result.nodes[0].condition_config.condition_type == "equals"
        assert result.nodes[0].condition_config.field == "status"
    
    def test_reconstruct_with_loop_config_in_data(self):
        """Test extracting loop_config from data object (lines 50-55)"""
        definition = {
            "id": "workflow-1",
            "name": "Test",
            "nodes": [
                {
                    "id": "node-1",
                    "type": "loop",
                    "name": "Loop Node",
                    "data": {
                        "loop_config": {
                            "loop_type": "for_each",
                            "items_source": "items"
                        }
                    }
                }
            ],
            "edges": [],
            "variables": {}
        }
        
        result = reconstruct_workflow_definition(definition)
        
        assert result.nodes[0].loop_config is not None
        assert result.nodes[0].loop_config.loop_type == "for_each"
        assert result.nodes[0].loop_config.items_source == "items"
    
    def test_reconstruct_missing_config_logs_debug(self):
        """Test that missing configs log debug messages (lines 73-80)"""
        definition = {
            "id": "workflow-1",
            "name": "Test",
            "nodes": [
                {
                    "id": "node-1",
                    "type": "loop",
                    "name": "Loop Node"
                },
                {
                    "id": "node-2",
                    "type": "condition",
                    "name": "Condition Node"
                },
                {
                    "id": "node-3",
                    "type": "agent",
                    "name": "Agent Node"
                }
            ],
            "edges": [],
            "variables": {}
        }
        
        result = reconstruct_workflow_definition(definition)
        
        assert len(result.nodes) == 3
        assert result.nodes[0].loop_config is None
        assert result.nodes[1].condition_config is None
        assert result.nodes[2].agent_config is None
    
    def test_reconstruct_invalid_node_raises_http_exception(self):
        """Test that invalid node data raises HTTPException (lines 86-88)"""
        definition = {
            "id": "workflow-1",
            "name": "Test",
            "nodes": [
                {
                    "id": "node-1",
                    "type": "invalid_type",
                    "name": "Invalid"
                }
            ],
            "edges": [],
            "variables": {}
        }
        
        with pytest.raises(HTTPException) as exc_info:
            reconstruct_workflow_definition(definition)
        
        assert exc_info.value.status_code == 422
        assert "Invalid node data" in str(exc_info.value.detail)




class TestExecuteWorkflowEndpoint:
    """Test execute_workflow endpoint main logic"""
    
    @pytest.mark.asyncio
    async def test_execute_workflow_workflow_not_found(self, db_session, test_user, test_settings):
        """Test execute_workflow when workflow doesn't exist"""
        from main import app
        from backend.services.settings_service import ISettingsService
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        mock_settings_service = MagicMock(spec=ISettingsService)
        mock_settings_service.get_active_llm_config.return_value = {
            "type": "openai",
            "model": "gpt-4",
            "api_key": "sk-test"
        }
        app.dependency_overrides[ISettingsService] = lambda: mock_settings_service
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                
                response = await client.post(
                    f"/api/workflows/{uuid.uuid4()}/execute",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_execute_workflow_creates_execution_record(self, db_session, test_user, test_workflow, test_settings):
        """Test that execute_workflow creates execution record"""
        from main import app
        from backend.services.settings_service import ISettingsService
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        mock_settings_service = MagicMock(spec=ISettingsService)
        mock_settings_service.get_active_llm_config.return_value = {
            "type": "openai",
            "model": "gpt-4",
            "api_key": "sk-test"
        }
        app.dependency_overrides[ISettingsService] = lambda: mock_settings_service
        
        with patch('backend.api.routes.execution_routes.WorkflowExecutor') as mock_executor_class:
            mock_executor = MagicMock()
            mock_executor.execution_id = "exec-123"
            mock_executor_class.return_value = mock_executor
            
            try:
                async with AsyncClient(app=app, base_url="http://test") as client:
                    from backend.auth.auth import create_access_token
                    token = create_access_token({"sub": test_user.username})
                    
                    response = await client.post(
                        f"/api/workflows/{test_workflow.id}/execute",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    
                    assert response.status_code == 200
                    execution_id = response.json()["execution_id"]
                    
                    result = await db_session.execute(
                        select(ExecutionDB).where(ExecutionDB.id == execution_id)
                    )
                    db_execution = result.scalar_one_or_none()
                    
                    assert db_execution is not None
                    assert db_execution.workflow_id == test_workflow.id
                    assert db_execution.user_id == test_user.id
                    assert db_execution.status == "running"
            finally:
                app.dependency_overrides.clear()
