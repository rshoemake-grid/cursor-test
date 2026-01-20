"""
Tests for BaseAgent class.
"""
import pytest
from backend.agents.base import BaseAgent
from backend.models.schemas import Node, NodeType, InputMapping


class ConcreteAgent(BaseAgent):
    """Concrete implementation of BaseAgent for testing"""
    
    async def execute(self, inputs):
        return {"result": "test"}


@pytest.fixture
def sample_node():
    """Create a sample node for testing"""
    return Node(
        id="test-node-1",
        type=NodeType.AGENT,
        name="Test Node",
        position={"x": 0, "y": 0}
    )


@pytest.fixture
def node_with_inputs():
    """Create a node with input mappings"""
    return Node(
        id="test-node-2",
        type=NodeType.AGENT,
        name="Test Node with Inputs",
        position={"x": 0, "y": 0},
        inputs=[
            InputMapping(name="input1", source="previous_node", source_output="output1"),
            InputMapping(name="input2", source="previous_node", source_output="output2")
        ]
    )


@pytest.mark.asyncio
async def test_base_agent_initialization(sample_node):
    """Test that BaseAgent can be initialized"""
    agent = ConcreteAgent(sample_node)
    assert agent.node == sample_node
    assert agent.node_id == "test-node-1"
    assert agent.name == "Test Node"


@pytest.mark.asyncio
async def test_base_agent_execute_abstract(sample_node):
    """Test that BaseAgent.execute is abstract"""
    with pytest.raises(TypeError):
        BaseAgent(sample_node)


@pytest.mark.asyncio
async def test_base_agent_validate_inputs_success(node_with_inputs):
    """Test input validation with all required inputs present"""
    agent = ConcreteAgent(node_with_inputs)
    inputs = {"input1": "value1", "input2": "value2"}
    result = agent.validate_inputs(inputs)
    assert result is True


@pytest.mark.asyncio
async def test_base_agent_validate_inputs_missing(node_with_inputs):
    """Test input validation raises error when inputs are missing"""
    agent = ConcreteAgent(node_with_inputs)
    inputs = {"input1": "value1"}  # Missing input2
    
    with pytest.raises(ValueError) as exc_info:
        agent.validate_inputs(inputs)
    
    assert "Missing required input: input2" in str(exc_info.value)


@pytest.mark.asyncio
async def test_base_agent_validate_inputs_no_inputs(sample_node):
    """Test input validation passes when node has no required inputs"""
    agent = ConcreteAgent(sample_node)
    inputs = {}
    result = agent.validate_inputs(inputs)
    assert result is True


@pytest.mark.asyncio
async def test_base_agent_log_callback(sample_node):
    """Test that log callback can be provided"""
    callback_called = []
    
    async def log_callback(level, node_id, message):
        callback_called.append((level, node_id, message))
    
    agent = ConcreteAgent(sample_node, log_callback=log_callback)
    assert agent.log_callback is not None
    
    # Test callback can be called
    await agent.log_callback("INFO", "test-node-1", "Test message")
    assert len(callback_called) == 1
    assert callback_called[0] == ("INFO", "test-node-1", "Test message")


@pytest.mark.asyncio
async def test_base_agent_execute_implementation(sample_node):
    """Test that concrete agent can execute"""
    agent = ConcreteAgent(sample_node)
    result = await agent.execute({"test": "input"})
    assert result == {"result": "test"}

