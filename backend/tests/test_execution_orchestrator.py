"""
Unit tests for ExecutionOrchestrator service.
Tests the refactored execution orchestration logic extracted from routes.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from fastapi import HTTPException

from backend.services.execution_orchestrator import ExecutionOrchestrator
from backend.models.schemas import ExecutionStatus, ExecutionResponse, WorkflowDefinition
from backend.database.models import ExecutionDB
from backend.exceptions import WorkflowNotFoundError


@pytest.fixture
def mock_db():
    """Mock database session"""
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    return db


@pytest.fixture
def mock_settings_service():
    """Mock settings service"""
    service = MagicMock()
    service.get_active_llm_config = MagicMock(return_value={
        "type": "openai",
        "api_key": "test-key",
        "model": "gpt-4"
    })
    service.load_settings_into_cache = AsyncMock()
    return service


@pytest.fixture
def mock_workflow_service():
    """Mock workflow service"""
    service = AsyncMock()
    workflow_db = MagicMock()
    workflow_db.id = "workflow-1"
    workflow_db.name = "Test Workflow"
    workflow_db.description = "Test Description"
    workflow_db.definition = {
        "nodes": [{"id": "start-1", "type": "start"}],
        "edges": []
    }
    service.get_workflow = AsyncMock(return_value=workflow_db)
    return service


@pytest.fixture
def orchestrator(mock_db, mock_settings_service, mock_workflow_service):
    """Create ExecutionOrchestrator instance"""
    return ExecutionOrchestrator(mock_db, mock_settings_service, mock_workflow_service)


class TestPrepareExecution:
    """Tests for prepare_execution method"""
    
    @pytest.mark.asyncio
    async def test_prepare_execution_success(self, orchestrator):
        """Test successful execution preparation"""
        execution_request = MagicMock()
        execution_request.inputs = {"input1": "value1"}
        
        execution_id, workflow_def, inputs, executor = await orchestrator.prepare_execution(
            workflow_id="workflow-1",
            user_id="user-1",
            execution_request=execution_request
        )
        
        assert execution_id is not None
        assert isinstance(workflow_def, WorkflowDefinition)
        assert inputs == {"input1": "value1"}
        assert executor is not None
    
    @pytest.mark.asyncio
    async def test_prepare_execution_workflow_not_found(self, orchestrator, mock_workflow_service):
        """Test that WorkflowNotFoundError raises HTTPException"""
        mock_workflow_service.get_workflow.side_effect = WorkflowNotFoundError("workflow-1")
        
        with pytest.raises(HTTPException) as exc_info:
            await orchestrator.prepare_execution("workflow-1", "user-1")
        
        assert exc_info.value.status_code == 404
    
    @pytest.mark.asyncio
    async def test_prepare_execution_no_llm_config(self, orchestrator, mock_settings_service):
        """Test that missing LLM config raises HTTPException"""
        mock_settings_service.get_active_llm_config.return_value = None
        
        with pytest.raises(HTTPException) as exc_info:
            await orchestrator.prepare_execution("workflow-1", "user-1")
        
        assert exc_info.value.status_code == 400
        assert "LLM provider" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_prepare_execution_no_execution_request(self, orchestrator):
        """Test preparation with no execution request"""
        execution_id, workflow_def, inputs, executor = await orchestrator.prepare_execution(
            workflow_id="workflow-1",
            user_id="user-1",
            execution_request=None
        )
        
        assert inputs == {}
        assert execution_id is not None


class TestCreateExecutionRecord:
    """Tests for create_execution_record method"""
    
    @pytest.mark.asyncio
    async def test_create_execution_record_success(self, orchestrator, mock_db):
        """Test successful execution record creation"""
        await orchestrator.create_execution_record(
            execution_id="exec-1",
            workflow_id="workflow-1",
            user_id="user-1"
        )
        
        mock_db.add.assert_called_once()
        assert isinstance(mock_db.add.call_args[0][0], ExecutionDB)
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_execution_record_without_user(self, orchestrator, mock_db):
        """Test creating execution record without user"""
        await orchestrator.create_execution_record(
            execution_id="exec-1",
            workflow_id="workflow-1",
            user_id=None
        )
        
        execution_db = mock_db.add.call_args[0][0]
        assert execution_db.user_id is None
        assert execution_db.status == ExecutionStatus.RUNNING.value


class TestCreateResponse:
    """Tests for create_response method"""
    
    def test_create_response(self, orchestrator):
        """Test creating execution response"""
        response = orchestrator.create_response(
            execution_id="exec-1",
            workflow_id="workflow-1"
        )
        
        assert isinstance(response, ExecutionResponse)
        assert response.execution_id == "exec-1"
        assert response.workflow_id == "workflow-1"
        assert response.status == ExecutionStatus.RUNNING
        assert response.started_at is not None
