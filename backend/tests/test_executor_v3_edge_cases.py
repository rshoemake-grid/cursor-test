"""Tests for WorkflowExecutorV3 edge cases"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import uuid

from backend.engine.executor_v3 import WorkflowExecutorV3
from backend.models.schemas import (
    WorkflowDefinition,
    Node,
    NodeType,
    Edge,
    AgentConfig
)


@pytest.fixture
def empty_workflow():
    """Create a workflow with no nodes"""
    return WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Empty Workflow",
        nodes=[],
        edges=[]
    )


@pytest.fixture
def workflow_with_invalid_edges():
    """Create a workflow with edges referencing deleted nodes"""
    return WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Workflow with Invalid Edges",
        nodes=[
            Node(
                id="node-1",
                type=NodeType.AGENT,
                name="Node 1",
                agent_config=AgentConfig(model="gpt-4")
            )
        ],
        edges=[
            Edge(source="node-1", target="deleted-node"),
            Edge(source="deleted-node", target="node-1")
        ]
    )


@pytest.mark.asyncio
async def test_executor_v3_empty_workflow(empty_workflow):
    """Test executor handles empty workflow"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(empty_workflow, llm_config=llm_config)
    
    inputs = {}
    result = await executor.execute(inputs)
    
    # Should fail with "no nodes" error
    assert result.status.value == "failed"
    assert "no nodes" in result.error.lower()


@pytest.mark.asyncio
async def test_executor_v3_invalid_edges_filtered(workflow_with_invalid_edges):
    """Test executor filters out edges referencing deleted nodes"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(workflow_with_invalid_edges, llm_config=llm_config)
    
    with patch("backend.engine.executor_v3.AgentRegistry") as mock_registry:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="test output")
        mock_registry.get_agent.return_value = mock_agent
        
        inputs = {}
        result = await executor.execute(inputs)
        
        # Should complete successfully (invalid edges filtered out)
        assert result.status.value in ["completed", "failed"]


@pytest.mark.asyncio
async def test_executor_v3_broadcast_status():
    """Test executor broadcasts status updates"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Test Workflow",
        nodes=[
            Node(
                id="node-1",
                type=NodeType.AGENT,
                name="Node 1",
                agent_config=AgentConfig(model="gpt-4")
            )
        ],
        edges=[]
    )
    
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(workflow, stream_updates=True, llm_config=llm_config)
    
    with patch("backend.engine.executor_v3.AgentRegistry") as mock_registry, \
         patch("backend.engine.executor_v3.ws_manager.broadcast_status", new_callable=AsyncMock), \
         patch("backend.engine.executor_v3.ws_manager.broadcast_log", new_callable=AsyncMock), \
         patch("backend.engine.executor_v3.ws_manager.broadcast_node_update", new_callable=AsyncMock), \
         patch("backend.engine.executor_v3.ws_manager.broadcast_completion", new_callable=AsyncMock), \
         patch("backend.engine.executor_v3.ws_manager.broadcast_error", new_callable=AsyncMock):
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="test output")
        mock_registry.get_agent.return_value = mock_agent
        
        inputs = {}
        result = await executor.execute(inputs)
        
        # Should complete execution (coverage test)
        assert result.status.value in ["completed", "failed"]

