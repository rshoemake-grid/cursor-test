"""
Tests for LoopAgent class.
"""
import pytest
from backend.agents.loop_agent import LoopAgent
from backend.models.schemas import Node, NodeType, LoopConfig


@pytest.fixture
def loop_node_for_each():
    """Create a loop node with for_each config"""
    return Node(
        id="loop-1",
        type=NodeType.LOOP,
        name="For Each Loop",
        position={"x": 0, "y": 0},
        loop_config=LoopConfig(
            loop_type="for_each",
            items_source="data",
            max_iterations=10
        )
    )


@pytest.fixture
def loop_node_while():
    """Create a loop node with while config"""
    return Node(
        id="loop-2",
        type=NodeType.LOOP,
        name="While Loop",
        position={"x": 0, "y": 0},
        loop_config=LoopConfig(
            loop_type="while",
            condition="count < 10",
            max_iterations=5
        )
    )


@pytest.fixture
def loop_node_until():
    """Create a loop node with until config"""
    return Node(
        id="loop-3",
        type=NodeType.LOOP,
        name="Until Loop",
        position={"x": 0, "y": 0},
        loop_config=LoopConfig(
            loop_type="until",
            condition="count >= 10",
            max_iterations=5
        )
    )


@pytest.fixture
def loop_node_no_config():
    """Create a loop node without config (should use defaults)"""
    return Node(
        id="loop-4",
        type=NodeType.LOOP,
        name="Default Loop",
        position={"x": 0, "y": 0}
    )


@pytest.mark.asyncio
async def test_loop_agent_initialization(loop_node_for_each):
    """Test LoopAgent initialization"""
    agent = LoopAgent(loop_node_for_each)
    assert agent.node_id == "loop-1"
    assert agent.config.loop_type == "for_each"
    assert agent.config.items_source == "data"
    assert agent.config.max_iterations == 10


@pytest.mark.asyncio
async def test_loop_agent_default_config(loop_node_no_config):
    """Test LoopAgent uses default config when none provided"""
    agent = LoopAgent(loop_node_no_config)
    assert agent.config.loop_type == "for_each"
    assert agent.config.max_iterations == 0  # 0 means unlimited


@pytest.mark.asyncio
async def test_loop_agent_for_each_with_items_source(loop_node_for_each):
    """Test for_each loop with explicit items_source"""
    agent = LoopAgent(loop_node_for_each)
    inputs = {"data": [1, 2, 3, 4, 5]}
    
    result = await agent.execute(inputs)
    
    assert result["loop_type"] == "for_each"
    assert result["total_iterations"] == 5
    assert result["items"] == [1, 2, 3, 4, 5]
    assert result["current_iteration"] == 0
    assert result["status"] == "initialized"


@pytest.mark.asyncio
async def test_loop_agent_for_each_auto_detect_items():
    """Test for_each loop auto-detects items from inputs"""
    node = Node(
        id="loop-1",
        type=NodeType.LOOP,
        name="Auto Detect",
        position={"x": 0, "y": 0},
        loop_config=LoopConfig(
            loop_type="for_each",
            max_iterations=0
        )
    )
    agent = LoopAgent(node)
    inputs = {"data": [1, 2, 3]}
    
    result = await agent.execute(inputs)
    assert result["total_iterations"] == 3
    assert result["items"] == [1, 2, 3]


@pytest.mark.asyncio
async def test_loop_agent_for_each_max_iterations_limit(loop_node_for_each):
    """Test for_each loop respects max_iterations"""
    agent = LoopAgent(loop_node_for_each)
    inputs = {"data": list(range(20))}  # 20 items
    
    result = await agent.execute(inputs)
    
    # Should be limited to max_iterations (10)
    assert result["total_iterations"] == 10
    assert len(result["items"]) == 10
    assert result["items"] == list(range(10))


@pytest.mark.asyncio
async def test_loop_agent_for_each_string_to_list():
    """Test for_each loop converts string to list"""
    node = Node(
        id="loop-1",
        type=NodeType.LOOP,
        name="String Loop",
        position={"x": 0, "y": 0},
        loop_config=LoopConfig(
            loop_type="for_each",
            max_iterations=0
        )
    )
    agent = LoopAgent(node)
    
    # Test JSON array string
    inputs = {"data": '[1, 2, 3]'}
    result = await agent.execute(inputs)
    assert result["items"] == [1, 2, 3]
    
    # Test comma-separated string
    inputs = {"data": "a, b, c"}
    result = await agent.execute(inputs)
    assert len(result["items"]) == 3


@pytest.mark.asyncio
async def test_loop_agent_for_each_missing_items_raises_error(loop_node_for_each):
    """Test that missing items raises error"""
    agent = LoopAgent(loop_node_for_each)
    inputs = {}  # No data key
    
    with pytest.raises(ValueError) as exc_info:
        await agent.execute(inputs)
    
    assert "not found in inputs" in str(exc_info.value) or "requires items_source" in str(exc_info.value)


@pytest.mark.asyncio
async def test_loop_agent_while_initialization(loop_node_while):
    """Test while loop initialization"""
    agent = LoopAgent(loop_node_while)
    inputs = {}
    
    result = await agent.execute(inputs)
    
    assert result["loop_type"] == "while"
    assert result["condition"] == "count < 10"
    assert result["max_iterations"] == 5
    assert result["current_iteration"] == 0
    assert result["status"] == "initialized"


@pytest.mark.asyncio
async def test_loop_agent_until_initialization(loop_node_until):
    """Test until loop initialization"""
    agent = LoopAgent(loop_node_until)
    inputs = {}
    
    result = await agent.execute(inputs)
    
    assert result["loop_type"] == "until"
    assert result["condition"] == "count >= 10"
    assert result["max_iterations"] == 5
    assert result["current_iteration"] == 0
    assert result["status"] == "initialized"


@pytest.mark.asyncio
async def test_loop_agent_unknown_loop_type():
    """Test that unknown loop type raises error"""
    node = Node(
        id="loop-1",
        type=NodeType.LOOP,
        name="Unknown",
        position={"x": 0, "y": 0},
        loop_config=LoopConfig(
            loop_type="unknown_type",
            max_iterations=0
        )
    )
    agent = LoopAgent(node)
    inputs = {}
    
    with pytest.raises(ValueError) as exc_info:
        await agent.execute(inputs)
    
    assert "Unknown loop type" in str(exc_info.value)


@pytest.mark.asyncio
async def test_loop_agent_for_each_single_item():
    """Test for_each loop with single item (non-list)"""
    node = Node(
        id="loop-1",
        type=NodeType.LOOP,
        name="Single Item",
        position={"x": 0, "y": 0},
        loop_config=LoopConfig(
            loop_type="for_each",
            max_iterations=0
        )
    )
    agent = LoopAgent(node)
    inputs = {"data": "single_value"}
    
    result = await agent.execute(inputs)
    assert result["total_iterations"] == 1
    assert result["items"] == ["single_value"]

