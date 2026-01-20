"""Tests for WorkflowExecutorV3"""
import pytest
from unittest.mock import AsyncMock, Mock, patch, MagicMock
from datetime import datetime
import uuid

from backend.engine.executor_v3 import WorkflowExecutorV3
from backend.models.schemas import (
    WorkflowDefinition,
    Node,
    Edge,
    NodeType,
    ExecutionStatus
)


@pytest.fixture
def simple_workflow():
    """Create a simple workflow definition"""
    return WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Test Workflow",
        nodes=[
            Node(
                id="start-1",
                type=NodeType.START,
                name="Start"
            ),
            Node(
                id="end-1",
                type=NodeType.END,
                name="End"
            )
        ],
        edges=[
            Edge(
                id="e1",
                source="start-1",
                target="end-1"
            )
        ],
        variables={}
    )


@pytest.fixture
def agent_workflow():
    """Create a workflow with an agent node"""
    from backend.models.schemas import AgentConfig
    
    return WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Agent Workflow",
        nodes=[
            Node(
                id="start-1",
                type=NodeType.START,
                name="Start"
            ),
            Node(
                id="agent-1",
                type=NodeType.AGENT,
                name="Test Agent",
                agent_config=AgentConfig(
                    model="gpt-4",
                    temperature=0.7
                )
            ),
            Node(
                id="end-1",
                type=NodeType.END,
                name="End"
            )
        ],
        edges=[
            Edge(id="e1", source="start-1", target="agent-1"),
            Edge(id="e2", source="agent-1", target="end-1")
        ],
        variables={}
    )


@pytest.mark.asyncio
async def test_executor_init(simple_workflow):
    """Test executor initialization"""
    executor = WorkflowExecutorV3(simple_workflow)
    assert executor.workflow == simple_workflow
    assert executor.execution_id is not None
    assert executor.execution_state is None


@pytest.mark.asyncio
async def test_executor_init_with_streaming(simple_workflow):
    """Test executor initialization with streaming enabled"""
    executor = WorkflowExecutorV3(simple_workflow, stream_updates=True)
    assert executor.stream_updates is True


@pytest.mark.asyncio
async def test_execute_empty_workflow(simple_workflow):
    """Test executing a simple workflow with start and end nodes"""
    executor = WorkflowExecutorV3(simple_workflow)
    
    result = await executor.execute({})
    
    assert result.status == ExecutionStatus.COMPLETED
    assert result.execution_id == executor.execution_id


@pytest.mark.asyncio
async def test_execute_workflow_no_nodes():
    """Test executing a workflow with no nodes"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Empty Workflow",
        nodes=[],
        edges=[],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    result = await executor.execute({})
    
    assert result.status == ExecutionStatus.FAILED
    assert "no nodes" in result.error.lower()


@pytest.mark.asyncio
async def test_execute_filters_empty_inputs(simple_workflow):
    """Test that executor filters out empty inputs"""
    executor = WorkflowExecutorV3(simple_workflow)
    
    inputs = {
        "empty_string": "",
        "empty_dict": {},
        "valid_input": "value",
        "none_value": None
    }
    
    result = await executor.execute(inputs)
    
    assert result.status == ExecutionStatus.COMPLETED
    # Valid input should be in variables
    assert "valid_input" in result.variables


@pytest.mark.asyncio
async def test_build_graph(simple_workflow):
    """Test building adjacency graph"""
    executor = WorkflowExecutorV3(simple_workflow)
    
    adjacency, in_degree = executor._build_graph()
    
    assert "start-1" in adjacency
    assert "end-1" in adjacency
    assert len(adjacency["start-1"]) > 0


@pytest.mark.asyncio
async def test_execute_with_agent_node(agent_workflow):
    """Test executing workflow with agent node"""
    executor = WorkflowExecutorV3(agent_workflow)
    
    # Mock agent execution
    with patch("backend.engine.executor_v3.AgentRegistry") as mock_registry:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="Agent output")
        mock_registry.create_agent.return_value = mock_agent
        
        result = await executor.execute({"input": "test"})
        
        # Should complete successfully
        assert result.status == ExecutionStatus.COMPLETED


@pytest.mark.asyncio
async def test_execute_with_condition_node():
    """Test executing workflow with condition node"""
    from backend.models.schemas import ConditionConfig
    
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Condition Workflow",
        nodes=[
            Node(
                id="start-1",
                type=NodeType.START,
                name="Start"
            ),
            Node(
                id="condition-1",
                type=NodeType.CONDITION,
                name="Test Condition",
                condition_config=ConditionConfig(
                    field="value",
                    operator="equals",
                    value="test"
                )
            ),
            Node(
                id="end-1",
                type=NodeType.END,
                name="End"
            )
        ],
        edges=[
            Edge(id="e1", source="start-1", target="condition-1"),
            Edge(id="e2", source="condition-1", target="end-1", sourceHandle="true")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    with patch("backend.engine.executor_v3.AgentRegistry") as mock_registry:
        mock_condition = AsyncMock()
        mock_condition.evaluate = AsyncMock(return_value=True)
        mock_registry.create_agent.return_value = mock_condition
        
        result = await executor.execute({"value": "test"})
        assert result.status == ExecutionStatus.COMPLETED


@pytest.mark.asyncio
async def test_broadcast_status(simple_workflow):
    """Test broadcasting status updates"""
    executor = WorkflowExecutorV3(simple_workflow, stream_updates=True)
    
    with patch("backend.engine.executor_v3.ws_manager") as mock_manager:
        mock_manager.broadcast_status = AsyncMock()
        
        await executor._broadcast_status("running")
        
        mock_manager.broadcast_status.assert_called_once()


@pytest.mark.asyncio
async def test_log_entry(simple_workflow):
    """Test logging execution entries"""
    executor = WorkflowExecutorV3(simple_workflow)
    
    # Initialize execution state first
    await executor.execute({})
    
    # Log should add entries
    initial_log_count = len(executor.execution_state.logs)
    await executor._log("INFO", "test-node", "Test message")
    
    assert executor.execution_state is not None
    assert len(executor.execution_state.logs) > initial_log_count


@pytest.mark.asyncio
async def test_execute_with_variables(simple_workflow):
    """Test executing workflow with variables"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Workflow with Variables",
        nodes=simple_workflow.nodes,
        edges=simple_workflow.edges,
        variables={"default_var": "default_value"}
    )
    
    executor = WorkflowExecutorV3(workflow)
    result = await executor.execute({"input_var": "input_value"})
    
    assert result.status == ExecutionStatus.COMPLETED
    assert "default_var" in result.variables
    assert "input_var" in result.variables

