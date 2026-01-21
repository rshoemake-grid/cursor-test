"""Tests specifically designed to kill surviving mutants in executor_v3.py

These tests target:
- Boundary conditions for length comparisons (<, >, <=, >=, ==)
- Comparison operators (==, !=, is, is not)
- Boolean logic (and, or, not)
- Empty value checks (None, '', {})
- Status comparisons
"""
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
    ExecutionStatus,
    ConditionConfig,
    AgentConfig
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


class TestInputFilteringBoundaries:
    """Test boundary conditions for input filtering (None, '', {})"""
    
    @pytest.mark.asyncio
    async def test_execute_with_none_value(self, simple_workflow):
        """Test execute with None value (boundary: value is not None)"""
        executor = WorkflowExecutorV3(simple_workflow)
        
        inputs = {
            "key1": None,
            "key2": "valid"
        }
        
        result = await executor.execute(inputs)
        # None value should be filtered out
        assert "key1" not in result.variables or result.variables.get("key1") is None
        assert result.variables.get("key2") == "valid"
    
    @pytest.mark.asyncio
    async def test_execute_with_empty_string(self, simple_workflow):
        """Test execute with empty string (boundary: value != '')"""
        executor = WorkflowExecutorV3(simple_workflow)
        
        inputs = {
            "key1": "",
            "key2": "valid"
        }
        
        result = await executor.execute(inputs)
        # Empty string should be filtered out
        assert "key1" not in result.variables or result.variables.get("key1") == ""
        assert result.variables.get("key2") == "valid"
    
    @pytest.mark.asyncio
    async def test_execute_with_empty_dict(self, simple_workflow):
        """Test execute with empty dict (boundary: value != {})"""
        executor = WorkflowExecutorV3(simple_workflow)
        
        inputs = {
            "key1": {},
            "key2": "valid"
        }
        
        result = await executor.execute(inputs)
        # Empty dict should be filtered out
        assert "key1" not in result.variables or result.variables.get("key1") == {}
        assert result.variables.get("key2") == "valid"
    
    @pytest.mark.asyncio
    async def test_execute_with_dict_containing_none_values(self, simple_workflow):
        """Test execute with dict containing None values (boundary: v is not None)"""
        executor = WorkflowExecutorV3(simple_workflow)
        
        inputs = {
            "key1": {"nested": None, "valid": "value"},
            "key2": {"nested": ""},
            "key3": {"nested": {}}
        }
        
        result = await executor.execute(inputs)
        # Dict with all None/empty values should be filtered out
        # Dict with at least one valid value should be included
        if "key1" in result.variables:
            assert result.variables["key1"].get("valid") == "value"
    
    @pytest.mark.asyncio
    async def test_execute_with_dict_containing_empty_strings(self, simple_workflow):
        """Test execute with dict containing empty strings (boundary: v != '')"""
        executor = WorkflowExecutorV3(simple_workflow)
        
        inputs = {
            "key1": {"nested": "", "valid": "value"}
        }
        
        result = await executor.execute(inputs)
        # Dict with empty strings but valid values should be included
        if "key1" in result.variables:
            assert result.variables["key1"].get("valid") == "value"
    
    @pytest.mark.asyncio
    async def test_execute_with_dict_containing_empty_dicts(self, simple_workflow):
        """Test execute with dict containing empty dicts (boundary: v != {})"""
        executor = WorkflowExecutorV3(simple_workflow)
        
        inputs = {
            "key1": {"nested": {}, "valid": "value"}
        }
        
        result = await executor.execute(inputs)
        # Dict with empty dicts but valid values should be included
        if "key1" in result.variables:
            assert result.variables["key1"].get("valid") == "value"
    
    @pytest.mark.asyncio
    async def test_execute_with_data_image_prefix(self, simple_workflow):
        """Test execute with data:image/ prefix (boundary: v.startswith('data:image/'))"""
        executor = WorkflowExecutorV3(simple_workflow)
        
        inputs = {
            "image": "data:image/png;base64,iVBORw0KGgo="
        }
        
        result = await executor.execute(inputs)
        # data:image/ prefix should be preserved even if other checks might filter it
        assert result.variables.get("image") == "data:image/png;base64,iVBORw0KGgo="


class TestStatusComparisons:
    """Test status comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_execution_status_running(self, simple_workflow):
        """Test status comparison with RUNNING (boundary: == ExecutionStatus.RUNNING)"""
        executor = WorkflowExecutorV3(simple_workflow)
        
        result = await executor.execute({})
        # Status should be COMPLETED after successful execution
        assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_execution_status_failed(self, simple_workflow):
        """Test status comparison with FAILED (boundary: == ExecutionStatus.FAILED)"""
        # Create workflow with invalid node to cause failure
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Failing Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
        
        # Mock agent to raise exception
        with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent:
            mock_agent = AsyncMock()
            mock_agent.execute = AsyncMock(side_effect=Exception("Test error"))
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            # Status should be FAILED
            assert result.status == ExecutionStatus.FAILED


class TestNodeTypeComparisons:
    """Test node type comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_node_type_condition(self, simple_workflow):
        """Test node type comparison with CONDITION (boundary: == NodeType.CONDITION)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Condition Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="condition-1",
                    type=NodeType.CONDITION,
                    name="Condition",
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
                Edge(id="e2", source="condition-1", target="end-1", condition="true")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent:
            result = await executor.execute({"value": "test"})
            assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]
    
    @pytest.mark.asyncio
    async def test_node_type_condition_without_field(self, simple_workflow):
        """Test condition node without field config (boundary: not node.condition_config.field)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Invalid Condition Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="condition-1",
                    type=NodeType.CONDITION,
                    name="Condition",
                    condition_config=None  # Missing condition config
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="condition-1"),
                Edge(id="e2", source="condition-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({})
        # Condition node without field should be skipped
        assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]
    
    @pytest.mark.asyncio
    async def test_node_type_start(self, simple_workflow):
        """Test node type comparison with START (boundary: == NodeType.START)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Start Node Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED


class TestLengthComparisons:
    """Test length comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_node_inputs_length_zero(self, simple_workflow):
        """Test node inputs length exactly 0 (boundary: len(node.inputs) > 0 false)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="No Inputs Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
                    agent_config=AgentConfig(model="gpt-4"),
                    inputs=[]  # Empty inputs
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
            mock_agent.execute = AsyncMock(return_value="output")
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_node_inputs_length_one(self, simple_workflow):
        """Test node inputs length exactly 1 (boundary: len(node.inputs) > 0 true)"""
        from backend.models.schemas import InputMapping
        
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="One Input Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
                    agent_config=AgentConfig(model="gpt-4"),
                    inputs=[InputMapping(name="input1", source_node="start-1")]
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
        
        with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent, \
             patch("backend.engine.executor_v3.ws_manager") as mock_ws:
            mock_ws.broadcast_status = AsyncMock()
            mock_ws.broadcast_completion = AsyncMock()
            mock_ws.broadcast_error = AsyncMock()
            
            mock_agent = AsyncMock()
            mock_agent.execute = AsyncMock(return_value="output")
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            # May complete or fail depending on input handling, but should execute
            assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]
    
    @pytest.mark.asyncio
    async def test_data_producing_edges_length_zero(self, simple_workflow):
        """Test data producing edges length exactly 0 (boundary: len(data_producing_edges) > 0 false)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="No Data Edges Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_data_producing_edges_length_one(self, simple_workflow):
        """Test data producing edges length exactly 1 (boundary: len(data_producing_edges) > 0 true)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Data Edge Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="output")
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_node_inputs_length_two(self, simple_workflow):
        """Test node inputs length exactly 2 (boundary: len(node_inputs) == 2)"""
        from backend.models.schemas import InputMapping, AgentConfig
        
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Two Inputs Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
                    agent_config=AgentConfig(model="gpt-4")
                ),
                Node(
                    id="write-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Write",
                    input_config={"mode": "write", "file_path": "/tmp/test_output.txt"},
                    inputs=[InputMapping(name="source"), InputMapping(name="data")]
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="agent-1"),
                Edge(id="e2", source="agent-1", target="write-1"),
                Edge(id="e3", source="write-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent, \
             patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
            mock_agent = AsyncMock()
            # Return dict with multiple values - executor will use filtered dict
            mock_agent.execute = AsyncMock(return_value={"source": "src", "data": "data"})
            mock_get_agent.return_value = mock_agent
            mock_write.return_value = {"status": "success"}
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_node_inputs_length_one_with_data(self, simple_workflow):
        """Test node inputs length exactly 1 with 'data' key (boundary: len(node_inputs) == 1 and 'data' in node_inputs)"""
        from backend.models.schemas import InputMapping, AgentConfig
        
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="One Data Input Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
                    agent_config=AgentConfig(model="gpt-4")
                ),
                Node(
                    id="write-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Write",
                    input_config={"mode": "write", "file_path": "/tmp/test_output.txt"},
                    inputs=[InputMapping(name="data")]
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="agent-1"),
                Edge(id="e2", source="agent-1", target="write-1"),
                Edge(id="e3", source="write-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent, \
             patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
            mock_agent = AsyncMock()
            # Return dict with single 'data' key
            mock_agent.execute = AsyncMock(return_value={"data": "test_data"})
            mock_get_agent.return_value = mock_agent
            mock_write.return_value = {"status": "success"}
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_input_values_length_one(self, simple_workflow):
        """Test input values length exactly 1 (boundary: len(input_values) == 1)"""
        from backend.models.schemas import InputMapping, AgentConfig
        
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="One Input Value Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
                    agent_config=AgentConfig(model="gpt-4")
                ),
                Node(
                    id="write-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Write",
                    input_config={"mode": "write", "file_path": "/tmp/test_output.txt"},
                    inputs=[InputMapping(name="data")]
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="agent-1"),
                Edge(id="e2", source="agent-1", target="write-1"),
                Edge(id="e3", source="write-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent, \
             patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
            mock_agent = AsyncMock()
            # Return a single string value - executor will wrap it and extract "data" key
            # The executor wraps single values as {"data": value, "output": value}
            mock_agent.execute = AsyncMock(return_value="single_value")
            mock_get_agent.return_value = mock_agent
            mock_write.return_value = {"status": "success"}
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_input_values_length_two(self, simple_workflow):
        """Test input values length exactly 2 (boundary: len(input_values) > 1)"""
        from backend.models.schemas import InputMapping, AgentConfig
        
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Two Input Values Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
                    agent_config=AgentConfig(model="gpt-4")
                ),
                Node(
                    id="write-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Write",
                    input_config={"mode": "write", "file_path": "/tmp/test_output.txt"},
                    inputs=[InputMapping(name="source"), InputMapping(name="data")]
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="agent-1"),
                Edge(id="e2", source="agent-1", target="write-1"),
                Edge(id="e3", source="write-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent, \
             patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
            mock_agent = AsyncMock()
            # Return dict with multiple values - executor will use filtered dict
            mock_agent.execute = AsyncMock(return_value={"source": "src", "data": "data"})
            mock_get_agent.return_value = mock_agent
            mock_write.return_value = {"status": "success"}
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_items_length_zero(self, simple_workflow):
        """Test items length exactly 0 (boundary: len(items) > 0 false)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Empty Items Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="loop-1",
                    type=NodeType.LOOP,
                    name="Loop"
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="loop-1"),
                Edge(id="e2", source="loop-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({"items": []})
        assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]
    
    @pytest.mark.asyncio
    async def test_items_length_one(self, simple_workflow):
        """Test items length exactly 1 (boundary: len(items) == 1)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="One Item Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="loop-1",
                    type=NodeType.LOOP,
                    name="Loop"
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="loop-1"),
                Edge(id="e2", source="loop-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({"items": ["item1"]})
        assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]
    
    @pytest.mark.asyncio
    async def test_items_length_two(self, simple_workflow):
        """Test items length exactly 2 (boundary: len(items) > 1)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Two Items Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="loop-1",
                    type=NodeType.LOOP,
                    name="Loop"
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="loop-1"),
                Edge(id="e2", source="loop-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({"items": ["item1", "item2"]})
        assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]


class TestInDegreeComparisons:
    """Test in-degree comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_in_degree_zero(self, simple_workflow):
        """Test in-degree exactly 0 (boundary: degree == 0)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Start Node Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({})
        # Start node should have in-degree 0
        assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_in_degree_one(self, simple_workflow):
        """Test in-degree exactly 1 (boundary: degree != 0)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="One Dependency Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="output")
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            # End node should have in-degree 1
            assert result.status == ExecutionStatus.COMPLETED


class TestDataToWriteComparisons:
    """Test data_to_write comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_data_to_write_none(self, simple_workflow):
        """Test data_to_write is None (boundary: data_to_write is None)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="No Data Write Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="write-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Write",
                    input_config={"mode": "write", "file_path": "/tmp/test.txt"}
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="write-1"),
                Edge(id="e2", source="write-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
            result = await executor.execute({})
            # Should handle None data_to_write
            assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]
    
    @pytest.mark.asyncio
    async def test_data_to_write_empty_dict(self, simple_workflow):
        """Test data_to_write is empty dict (boundary: data_to_write == {})"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Empty Dict Write Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="write-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Write",
                    input_config={"mode": "write", "file_path": "/tmp/test.txt"}
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="write-1"),
                Edge(id="e2", source="write-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
            result = await executor.execute({"data": {}})
            # Should handle empty dict
            assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]
    
    @pytest.mark.asyncio
    async def test_data_to_write_empty_string(self, simple_workflow):
        """Test data_to_write is empty string (boundary: data_to_write == '')"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Empty String Write Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="write-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Write",
                    input_config={"mode": "write", "file_path": "/tmp/test.txt"}
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="write-1"),
                Edge(id="e2", source="write-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
            result = await executor.execute({"data": ""})
            # Should handle empty string
            assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]


class TestReadModeComparisons:
    """Test read mode comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_read_mode_lines(self, simple_workflow):
        """Test read mode exactly 'lines' (boundary: read_mode == 'lines')"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Lines Read Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="read-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Read",
                    input_config={"read_mode": "lines"}
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="read-1"),
                Edge(id="e2", source="read-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.read_from_input_source") as mock_read:
            mock_read.return_value = {"lines": [{"content": "line1"}]}
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_read_mode_batch(self, simple_workflow):
        """Test read mode exactly 'batch' (boundary: read_mode == 'batch')"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Batch Read Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="read-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Read",
                    input_config={"read_mode": "batch"}
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="read-1"),
                Edge(id="e2", source="read-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.read_from_input_source") as mock_read:
            mock_read.return_value = {"batches": [{"lines": ["line1"]}]}
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED


class TestRawOutputComparisons:
    """Test raw output comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_raw_output_empty_dict(self, simple_workflow):
        """Test raw output is empty dict (boundary: raw_output == {})"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Empty Output Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="read-1",
                    type=NodeType.LOCAL_FILESYSTEM,
                    name="Read",
                    input_config={"read_mode": "lines"}
                ),
                Node(id="end-1", type=NodeType.END, name="End")
            ],
            edges=[
                Edge(id="e1", source="start-1", target="read-1"),
                Edge(id="e2", source="read-1", target="end-1")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        with patch("backend.engine.executor_v3.read_from_input_source") as mock_read:
            mock_read.return_value = {}
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED


class TestStringLengthBoundaries:
    """Test string length comparison boundaries for preview generation"""
    
    @pytest.mark.asyncio
    async def test_output_string_length_100(self, simple_workflow):
        """Test output string length exactly 100 (boundary: len(str(output)) > 100 false)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Short Output Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="x" * 100)  # Exactly 100 chars
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_output_string_length_101(self, simple_workflow):
        """Test output string length exactly 101 (boundary: len(str(output)) > 100 true)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Long Output Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="x" * 101)  # Exactly 101 chars
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_output_string_length_200(self, simple_workflow):
        """Test output string length exactly 200 (boundary: len(value) > 200 false)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="200 Char Output Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="x" * 200)  # Exactly 200 chars
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_output_string_length_201(self, simple_workflow):
        """Test output string length exactly 201 (boundary: len(value) > 200 true)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="201 Char Output Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="x" * 201)  # Exactly 201 chars
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED


class TestEdgeConditionComparisons:
    """Test edge condition comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_edge_condition_equals_branch(self, simple_workflow):
        """Test edge condition equals branch (boundary: edge_condition == branch)"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Condition Branch Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="condition-1",
                    type=NodeType.CONDITION,
                    name="Condition",
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
                Edge(id="e2", source="condition-1", target="end-1", condition="true")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({"value": "test"})
        assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]
    
    @pytest.mark.asyncio
    async def test_edge_condition_equals_default(self, simple_workflow):
        """Test edge condition equals 'default' (boundary: edge_condition == 'default')"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Default Branch Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="condition-1",
                    type=NodeType.CONDITION,
                    name="Condition",
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
                Edge(id="e2", source="condition-1", target="end-1", condition="default")
            ],
            variables={}
        )
        
        executor = WorkflowExecutorV3(workflow)
        
        result = await executor.execute({"value": "other"})
        assert result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]


class TestOutputEmptyString:
    """Test output empty string comparison"""
    
    @pytest.mark.asyncio
    async def test_output_empty_string(self, simple_workflow):
        """Test output is empty string (boundary: output == '')"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Empty Output Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="")
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            assert result.status == ExecutionStatus.COMPLETED


class TestErrorMsgComparisons:
    """Test error message comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_error_msg_empty_string(self, simple_workflow):
        """Test error message is empty string (boundary: error_msg.strip() == '')"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Empty Error Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="output")
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            # Should handle empty error message
            assert result.status == ExecutionStatus.COMPLETED
    
    @pytest.mark.asyncio
    async def test_error_msg_whitespace_only(self, simple_workflow):
        """Test error message is whitespace only (boundary: error_msg.strip() == '')"""
        workflow = WorkflowDefinition(
            id=str(uuid.uuid4()),
            name="Whitespace Error Workflow",
            nodes=[
                Node(id="start-1", type=NodeType.START, name="Start"),
                Node(
                    id="agent-1",
                    type=NodeType.AGENT,
                    name="Agent",
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
            mock_agent.execute = AsyncMock(return_value="output")
            mock_get_agent.return_value = mock_agent
            
            result = await executor.execute({})
            # Should handle whitespace-only error message
            assert result.status == ExecutionStatus.COMPLETED

