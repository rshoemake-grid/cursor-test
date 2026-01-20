"""Extended tests for WorkflowExecutorV3 - loops, conditions, parallel execution"""
import pytest
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime
import uuid

from backend.engine.executor_v3 import WorkflowExecutorV3
from backend.models.schemas import (
    WorkflowDefinition,
    Node,
    Edge,
    NodeType,
    ExecutionStatus,
    ConditionConfig,
    LoopConfig,
    AgentConfig
)


@pytest.fixture
def loop_workflow():
    """Create a workflow with a loop node"""
    return WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Loop Workflow",
        nodes=[
            Node(
                id="start-1",
                type=NodeType.START,
                name="Start"
            ),
            Node(
                id="loop-1",
                type=NodeType.LOOP,
                name="Test Loop",
                loop_config=LoopConfig(
                    loop_type="for_each",
                    items_field="items"
                )
            ),
            Node(
                id="end-1",
                type=NodeType.END,
                name="End"
            )
        ],
        edges=[
            Edge(id="e1", source="start-1", target="loop-1"),
            Edge(id="e2", source="loop-1", target="end-1")
        ],
        variables={}
    )


@pytest.mark.asyncio
async def test_execute_with_loop_node(loop_workflow):
    """Test executing workflow with loop node"""
    executor = WorkflowExecutorV3(loop_workflow)
    
    with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent:
        mock_loop = AsyncMock()
        mock_loop.execute = AsyncMock(return_value={"items_processed": 3})
        mock_get_agent.return_value = mock_loop
        
        result = await executor.execute({"items": ["a", "b", "c"]})
        assert result.status == ExecutionStatus.COMPLETED


@pytest.mark.asyncio
async def test_execute_parallel_nodes():
    """Test executing parallel nodes"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Parallel Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(id="agent-1", type=NodeType.AGENT, name="Agent 1", agent_config=AgentConfig(model="gpt-4")),
            Node(id="agent-2", type=NodeType.AGENT, name="Agent 2", agent_config=AgentConfig(model="gpt-4")),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="agent-1"),
            Edge(id="e2", source="start-1", target="agent-2"),
            Edge(id="e3", source="agent-1", target="end-1"),
            Edge(id="e4", source="agent-2", target="end-1")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="Output")
        mock_get_agent.return_value = mock_agent
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED


@pytest.mark.asyncio
async def test_execute_condition_false_branch():
    """Test executing workflow with condition taking false branch"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Condition Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
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
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="condition-1"),
            Edge(id="e2", source="condition-1", target="end-1", sourceHandle="false")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent:
        mock_condition = AsyncMock()
        mock_condition.execute = AsyncMock(return_value={"branch": "false"})
        mock_get_agent.return_value = mock_condition
        
        result = await executor.execute({"value": "not_test"})
        assert result.status == ExecutionStatus.COMPLETED


@pytest.mark.asyncio
async def test_execute_node_failure():
    """Test handling node execution failure"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Failure Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="agent-1",
                type=NodeType.AGENT,
                name="Failing Agent",
                agent_config=AgentConfig(model="gpt-4")
            ),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="agent-1"),
            Edge(id="e2", source="agent-1", target="end-1")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(side_effect=Exception("Agent failed"))
        mock_get_agent.return_value = mock_agent
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.FAILED
        assert "Agent failed" in result.error


@pytest.mark.asyncio
async def test_resolve_config_variables():
    """Test resolving variables in config"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Variable Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="end-1")
        ],
        variables={"file_path": "/tmp/test.txt"}
    )
    
    executor = WorkflowExecutorV3(workflow)
    await executor.execute({})
    
    # Test variable resolution
    config = {"path": "${file_path}"}
    resolved = executor._resolve_config_variables(config)
    assert resolved["path"] == "/tmp/test.txt"


@pytest.mark.asyncio
async def test_prepare_node_inputs():
    """Test preparing node inputs from previous outputs"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Input Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="agent-1",
                type=NodeType.AGENT,
                name="Agent 1",
                agent_config=AgentConfig(model="gpt-4")
            ),
            Node(
                id="agent-2",
                type=NodeType.AGENT,
                name="Agent 2",
                agent_config=AgentConfig(model="gpt-4")
            ),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="agent-1"),
            Edge(id="e2", source="agent-1", target="agent-2"),
            Edge(id="e3", source="agent-2", target="end-1")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="Agent output")
        mock_get_agent.return_value = mock_agent
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED


@pytest.mark.asyncio
async def test_execute_with_storage_node_read():
    """Test executing workflow with storage read node"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Storage Read Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="storage-1",
                type=NodeType.LOCAL_FILESYSTEM,
                name="Read File",
                data={"input_config": {"file_path": "/tmp/test.txt", "mode": "read"}}
            ),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="storage-1"),
            Edge(id="e2", source="storage-1", target="end-1")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    with patch("backend.engine.executor_v3.read_from_input_source") as mock_read:
        mock_read.return_value = "File content"
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED


@pytest.mark.asyncio
async def test_execute_with_storage_node_write():
    """Test executing workflow with storage write node"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Storage Write Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="agent-1",
                type=NodeType.AGENT,
                name="Agent",
                agent_config=AgentConfig(model="gpt-4")
            ),
            Node(
                id="storage-1",
                type=NodeType.LOCAL_FILESYSTEM,
                name="Write File",
                data={"input_config": {"file_path": "/tmp/output.txt", "mode": "write"}}
            ),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="agent-1"),
            Edge(id="e2", source="agent-1", target="storage-1"),
            Edge(id="e3", source="storage-1", target="end-1")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent, \
         patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="Data to write")
        mock_get_agent.return_value = mock_agent
        mock_write.return_value = {"status": "success"}
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED

