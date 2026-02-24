"""
Additional tests for workflow_routes.py - covering more paths
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from backend.api.routes.workflow_routes import (
    create_workflow,
    get_workflow,
    update_workflow,
    delete_workflow,
    publish_workflow
)
from backend.models.schemas import WorkflowCreate, WorkflowPublishRequest
from backend.exceptions import WorkflowNotFoundError, WorkflowValidationError
from backend.database.models import WorkflowDB, UserDB
from datetime import datetime


@pytest.mark.asyncio
async def test_create_workflow_success_with_edges(db_session):
    """Test create_workflow success path with edges (lines 124-125, 132-142)"""
    workflow = WorkflowCreate(
        name="Test Workflow",
        nodes=[{"id": "start-1", "type": "start"}],
        edges=[{"id": "edge-1", "source": "start-1", "target": "end-1"}],
        variables={}
    )
    
    db_workflow = WorkflowDB(
        id="wf-123",
        name="Test Workflow",
        description="",
        version="1.0.0",
        definition={
            "nodes": [{"id": "start-1", "type": "start"}],
            "edges": [{"id": "edge-1", "source": "start-1", "target": "end-1"}],
            "variables": {}
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.create_workflow = AsyncMock(return_value=db_workflow)
        mock_service.return_value = mock_ws
        
        with patch('backend.api.routes.workflow_routes.reconstruct_nodes', return_value=[]):
            result = await create_workflow(workflow=workflow, db=db_session, current_user=None)
            
            assert result.id == db_workflow.id
            assert len(result.edges) == 1


@pytest.mark.asyncio
async def test_get_workflow_node_reconstruction_http_exception(db_session):
    """Test get_workflow with HTTPException from reconstruct_nodes (lines 193-194)"""
    from fastapi import HTTPException as FastAPIHTTPException
    
    workflow = WorkflowDB(
        id="wf-123",
        name="Test",
        definition={"nodes": [{"invalid": "data"}]},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.get_workflow = AsyncMock(return_value=workflow)
        mock_service.return_value = mock_ws
        
        with patch('backend.api.routes.workflow_routes.reconstruct_nodes', side_effect=FastAPIHTTPException(status_code=422, detail="Invalid")):
            with pytest.raises(FastAPIHTTPException) as exc_info:
                await get_workflow(workflow_id="wf-123", db=db_session)
            
            assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_get_workflow_exception_path(db_session):
    """Test get_workflow exception handling (lines 221-223)"""
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.get_workflow = AsyncMock(side_effect=Exception("Database error"))
        mock_service.return_value = mock_ws
        
        with pytest.raises(HTTPException) as exc_info:
            await get_workflow(workflow_id="test", db=db_session)
        
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_update_workflow_success(db_session):
    """Test update_workflow success path (lines 234-249)"""
    workflow = WorkflowCreate(name="Updated", nodes=[], edges=[], variables={})
    
    updated_workflow = WorkflowDB(
        id="wf-123",
        name="Updated",
        description="",
        version="1.0.0",
        definition={"nodes": [], "edges": [], "variables": {}},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.update_workflow = AsyncMock(return_value=updated_workflow)
        mock_service.return_value = mock_ws
        
        with patch('backend.api.routes.workflow_routes.reconstruct_nodes', return_value=[]):
            result = await update_workflow(
                workflow_id="wf-123",
                workflow=workflow,
                db=db_session,
                current_user=None
            )
            
            assert result.name == "Updated"


@pytest.mark.asyncio
async def test_delete_workflow_success(db_session):
    """Test delete_workflow success path (lines 266-272)"""
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.delete_workflow = AsyncMock(return_value=True)
        mock_service.return_value = mock_ws
        
        # Should not raise exception
        await delete_workflow(workflow_id="wf-123", db=db_session, current_user=None)


@pytest.mark.asyncio
async def test_delete_workflow_not_found(db_session):
    """Test delete_workflow when workflow not found (lines 271-272)"""
    from backend.exceptions import WorkflowNotFoundError
    
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.delete_workflow = AsyncMock(side_effect=WorkflowNotFoundError("Workflow not found"))
        mock_service.return_value = mock_ws
        
        with pytest.raises(HTTPException) as exc_info:
            await delete_workflow(workflow_id="wf-123", db=db_session, current_user=None)
        
        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_publish_workflow_success(db_session):
    """Test publish_workflow success (lines 288-325)"""
    from backend.models.schemas import TemplateCategory, TemplateDifficulty
    
    user = UserDB(
        id="user-123",
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        is_active=True,
        is_admin=False,
        created_at=datetime.utcnow()
    )
    
    workflow = WorkflowDB(
        id="wf-123",
        name="Test Workflow",
        description="Test",
        version="1.0.0",
        definition={"nodes": [], "edges": []},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    publish_request = WorkflowPublishRequest(
        category=TemplateCategory.AUTOMATION,
        tags=["test"],
        difficulty=TemplateDifficulty.BEGINNER,
        estimated_time="5 minutes"
    )
    
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.get_workflow = AsyncMock(return_value=workflow)
        mock_service.return_value = mock_ws
        
        result = await publish_workflow(
            workflow_id="wf-123",
            publish_request=publish_request,
            current_user=user,
            db=db_session
        )
        
        assert result.name == workflow.name
        assert result.category == TemplateCategory.AUTOMATION.value
