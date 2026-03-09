"""
Additional tests for debug_routes.py - workflow validation
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.api.debug_routes import validate_workflow
from backend.database.models import WorkflowDB, UserDB
from backend.services.workflow_ownership_service import WorkflowOwnershipService
import uuid
from datetime import datetime


@pytest.fixture
async def test_user(db_session):
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.mark.asyncio
async def test_validate_workflow_orphan_nodes(db_session, test_user):
    """Test validate_workflow with orphan nodes (lines 39-52)"""
    workflow = WorkflowDB(
        id="wf-123",
        name="Test",
        definition={
            "nodes": [
                {"id": "start-1", "type": "start"},
                {"id": "orphan-1", "type": "agent"}  # Orphan node
            ],
            "edges": [
                {"source": "start-1", "target": "end-1"}
            ]
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    mock_ownership = MagicMock(spec=WorkflowOwnershipService)
    mock_ownership.get_workflow_and_assert_can_read_or_share = AsyncMock(return_value=workflow)
    
    result = await validate_workflow(workflow_id="wf-123", db=db_session, current_user=test_user, ownership_service=mock_ownership)
    
    assert len(result["warnings"]) > 0
    assert any(w["type"] == "orphan_nodes" for w in result["warnings"])


@pytest.mark.asyncio
async def test_validate_workflow_missing_start(db_session, test_user):
    """Test validate_workflow missing start node (lines 56-61)"""
    workflow = WorkflowDB(
        id="wf-123",
        name="Test",
        definition={
            "nodes": [{"id": "agent-1", "type": "agent"}],
            "edges": []
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    mock_ownership = MagicMock(spec=WorkflowOwnershipService)
    mock_ownership.get_workflow_and_assert_can_read_or_share = AsyncMock(return_value=workflow)
    
    result = await validate_workflow(workflow_id="wf-123", db=db_session, current_user=test_user, ownership_service=mock_ownership)
    
    assert result["valid"] is False
    assert any(i["type"] == "missing_start" for i in result["issues"])


@pytest.mark.asyncio
async def test_validate_workflow_missing_end(db_session, test_user):
    """Test validate_workflow missing end node (lines 63-68)"""
    workflow = WorkflowDB(
        id="wf-123",
        name="Test",
        definition={
            "nodes": [{"id": "start-1", "type": "start"}],
            "edges": []
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    mock_ownership = MagicMock(spec=WorkflowOwnershipService)
    mock_ownership.get_workflow_and_assert_can_read_or_share = AsyncMock(return_value=workflow)
    
    result = await validate_workflow(workflow_id="wf-123", db=db_session, current_user=test_user, ownership_service=mock_ownership)
    
    assert any(w["type"] == "missing_end" for w in result["warnings"])


@pytest.mark.asyncio
async def test_validate_workflow_cycle_detected(db_session, test_user):
    """Test validate_workflow with cycle (lines 98-103)"""
    workflow = WorkflowDB(
        id="wf-123",
        name="Test",
        definition={
            "nodes": [
                {"id": "node-1", "type": "agent"},
                {"id": "node-2", "type": "agent"}
            ],
            "edges": [
                {"source": "node-1", "target": "node-2"},
                {"source": "node-2", "target": "node-1"}  # Cycle
            ]
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    mock_ownership = MagicMock(spec=WorkflowOwnershipService)
    mock_ownership.get_workflow_and_assert_can_read_or_share = AsyncMock(return_value=workflow)
    
    result = await validate_workflow(workflow_id="wf-123", db=db_session, current_user=test_user, ownership_service=mock_ownership)
    
    assert result["valid"] is False
    assert any(i["type"] == "cycle_detected" for i in result["issues"])


@pytest.mark.asyncio
async def test_validate_workflow_missing_system_prompt(db_session, test_user):
    """Test validate_workflow missing system prompt (lines 106-116)"""
    workflow = WorkflowDB(
        id="wf-123",
        name="Test",
        definition={
            "nodes": [
                {"id": "start-1", "type": "start"},
                {
                    "id": "agent-1",
                    "type": "agent",
                    "data": {"agent_config": {}}  # Missing system_prompt
                }
            ],
            "edges": []
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    mock_ownership = MagicMock(spec=WorkflowOwnershipService)
    mock_ownership.get_workflow_and_assert_can_read_or_share = AsyncMock(return_value=workflow)
    
    result = await validate_workflow(workflow_id="wf-123", db=db_session, current_user=test_user, ownership_service=mock_ownership)
    
    assert any(w["type"] == "missing_system_prompt" for w in result["warnings"])
