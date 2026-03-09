"""
Additional tests for import_export_routes.py - export endpoint
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from backend.api.import_export_routes import export_workflow
from backend.database.models import WorkflowDB
from backend.services.workflow_ownership_service import WorkflowOwnershipService
from datetime import datetime


@pytest.mark.asyncio
async def test_export_workflow_success_public(db_session):
    """Test export_workflow success for public workflow (lines 29-70)"""
    workflow = WorkflowDB(
        id="wf-123",
        name="Public Workflow",
        description="Test",
        version="1.0.0",
        definition={"nodes": [], "edges": [], "variables": {}},
        is_public=True,
        is_template=False,
        likes_count=0,
        views_count=0,
        uses_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    mock_ownership = MagicMock(spec=WorkflowOwnershipService)
    mock_ownership.get_workflow_and_assert_can_read = AsyncMock(return_value=workflow)
    
    result = await export_workflow(
        workflow_id="wf-123",
        current_user=None,
        db=db_session,
        ownership_service=mock_ownership
    )
    
    assert hasattr(result, 'body')
    assert "Public_Workflow" in str(result.headers.get("Content-Disposition", ""))


@pytest.mark.asyncio
async def test_export_workflow_unauthorized(db_session):
    """Test export_workflow unauthorized (lines 35-36)"""
    from uuid import uuid4
    
    owner_id = str(uuid4())
    user_id = str(uuid4())
    
    user = MagicMock()
    user.id = user_id
    
    workflow = WorkflowDB(
        id="wf-123",
        name="Private Workflow",
        description="",
        version="1.0.0",
        definition={"nodes": []},
        owner_id=owner_id,
        is_public=False,
        is_template=False,
        likes_count=0,
        views_count=0,
        uses_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    mock_ownership = MagicMock(spec=WorkflowOwnershipService)
    mock_ownership.get_workflow_and_assert_can_read = AsyncMock(
        side_effect=HTTPException(status_code=403, detail="Forbidden")
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await export_workflow(
            workflow_id="wf-123",
            current_user=user,
            db=db_session,
            ownership_service=mock_ownership
        )
    
    assert exc_info.value.status_code == 403
