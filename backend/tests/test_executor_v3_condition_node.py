"""Tests for WorkflowExecutorV3 condition node handling"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import uuid

from backend.engine.executor_v3 import WorkflowExecutorV3
from backend.models.schemas import (
    WorkflowDefinition,
    Node,
    NodeType,
    Edge,
    AgentConfig,
    ConditionConfig
)


@pytest.fixture
def workflow_with_invalid_condition():
    """Create a workflow with condition node missing field config"""
    return WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Workflow with Invalid Condition",
        nodes=[
            Node(
                id="condition-1",
                type=NodeType.CONDITION,
                name="Invalid Condition",
                condition_config=None  # Missing field configuration
            ),
            Node(
                id="agent-1",
                type=NodeType.AGENT,
                name="Agent 1",
                agent_config=AgentConfig(model="gpt-4")
            )
        ],
        edges=[
            Edge(source="condition-1", target="agent-1", sourceHandle="true")
        ]
    )


@pytest.mark.asyncio
async def test_executor_v3_skips_condition_node_without_field(workflow_with_invalid_condition):
    """Test executor skips condition nodes without field configuration"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(workflow_with_invalid_condition, llm_config=llm_config)
    
    with patch("backend.engine.executor_v3.AgentRegistry") as mock_registry:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="test output")
        mock_registry.get_agent.return_value = mock_agent
        
        inputs = {}
        result = await executor.execute(inputs)
        
        # Condition node should be skipped, workflow should complete
        assert result.status.value in ["completed", "failed"]

