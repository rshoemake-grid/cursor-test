"""
Additional tests for debug_routes.py - workflow validation
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.api.debug_routes import validate_workflow
from backend.database.models import WorkflowDB
from datetime import datetime


@pytest.mark.asyncio
async def test_validate_workflow_orphan_nodes(db_session):
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
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = workflow
        mock_execute.return_value = mock_result
        
        result = await validate_workflow(workflow_id="wf-123", db=db_session)
        
        assert len(result["warnings"]) > 0
        assert any(w["type"] == "orphan_nodes" for w in result["warnings"])


@pytest.mark.asyncio
async def test_validate_workflow_missing_start(db_session):
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
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = workflow
        mock_execute.return_value = mock_result
        
        result = await validate_workflow(workflow_id="wf-123", db=db_session)
        
        assert result["valid"] is False
        assert any(i["type"] == "missing_start" for i in result["issues"])


@pytest.mark.asyncio
async def test_validate_workflow_missing_end(db_session):
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
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = workflow
        mock_execute.return_value = mock_result
        
        result = await validate_workflow(workflow_id="wf-123", db=db_session)
        
        assert any(w["type"] == "missing_end" for w in result["warnings"])


@pytest.mark.asyncio
async def test_validate_workflow_cycle_detected(db_session):
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
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = workflow
        mock_execute.return_value = mock_result
        
        result = await validate_workflow(workflow_id="wf-123", db=db_session)
        
        assert result["valid"] is False
        assert any(i["type"] == "cycle_detected" for i in result["issues"])


@pytest.mark.asyncio
async def test_validate_workflow_missing_system_prompt(db_session):
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
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = workflow
        mock_execute.return_value = mock_result
        
        result = await validate_workflow(workflow_id="wf-123", db=db_session)
        
        assert any(w["type"] == "missing_system_prompt" for w in result["warnings"])
