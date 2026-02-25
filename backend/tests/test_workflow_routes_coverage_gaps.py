"""
Additional tests for workflow_routes.py coverage gaps
Tests exception handling and error paths
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from backend.api.routes.workflow_routes import (
    create_workflow,
    list_workflows,
    get_workflow,
    update_workflow,
    delete_workflow,
    bulk_delete_workflows
)
from backend.models.schemas import WorkflowCreate
from backend.exceptions import WorkflowNotFoundError, WorkflowValidationError


@pytest.mark.asyncio
async def test_create_workflow_exception_handling(db_session):
    """Test create_workflow exception handling (lines 128-130)"""
    workflow = WorkflowCreate(
        name="Test",
        nodes=[],
        edges=[],
        variables={}
    )
    
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.create_workflow = AsyncMock(side_effect=Exception("Database error"))
        mock_service.return_value = mock_ws
        
        with pytest.raises(HTTPException) as exc_info:
            await create_workflow(workflow=workflow, db=db_session, current_user=None)
        
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_list_workflows_exception_handling(db_session):
    """Test list_workflows exception handling (lines 170-172)"""
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_ws.list_workflows = AsyncMock(side_effect=Exception("Database error"))
        mock_service.return_value = mock_ws
        
        with pytest.raises(HTTPException) as exc_info:
            await list_workflows(db=db_session, current_user=None)
        
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_get_workflow_invalid_definition(db_session):
    """Test get_workflow with invalid definition (lines 186-188)"""
    with patch('backend.api.routes.workflow_routes.get_workflow_service') as mock_service:
        mock_ws = MagicMock()
        mock_workflow = MagicMock()
        mock_workflow.definition = None  # Invalid definition
        mock_ws.get_workflow = AsyncMock(return_value=mock_workflow)
        mock_service.return_value = mock_ws
        
        with pytest.raises(HTTPException) as exc_info:
            await get_workflow(workflow_id="test", db=db_session)
        
        assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_bulk_delete_workflows_empty_list(db_session):
    """Test bulk_delete_workflows with empty list (lines 340-341)"""
    from backend.api.routes.workflow_routes import BulkDeleteRequest
    
    request = BulkDeleteRequest(workflow_ids=[])
    
    with pytest.raises(HTTPException) as exc_info:
        await bulk_delete_workflows(request=request, db=db_session, current_user=None)
    
    assert exc_info.value.status_code == 400
