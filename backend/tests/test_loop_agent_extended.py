"""Extended tests for LoopAgent - all loop types and edge cases"""
import pytest
import json

from backend.agents.loop_agent import LoopAgent
from backend.models.schemas import Node, NodeType, LoopConfig


@pytest.fixture
def mock_node():
    """Create a mock loop node"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    node = Node(
        id="test-loop-1",
        type=NodeType.LOOP,
        name="Test Loop",
        loop_config=config
    )
    return node


@pytest.mark.asyncio
async def test_loop_agent_for_each_with_items_source(mock_node):
    """Test LoopAgent for_each with items_source specified"""
    config = LoopConfig(
        loop_type="for_each",
        items_source="my_items",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"my_items": [1, 2, 3]})
    assert result["loop_type"] == "for_each"
    assert result["items"] == [1, 2, 3]
    assert result["total_iterations"] == 3


@pytest.mark.asyncio
async def test_loop_agent_for_each_auto_detect_data(mock_node):
    """Test LoopAgent for_each auto-detecting 'data' key"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"data": [1, 2, 3]})
    assert result["loop_type"] == "for_each"
    assert result["items"] == [1, 2, 3]


@pytest.mark.asyncio
async def test_loop_agent_for_each_auto_detect_output(mock_node):
    """Test LoopAgent for_each auto-detecting 'output' key"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"output": [1, 2, 3]})
    assert result["loop_type"] == "for_each"
    assert result["items"] == [1, 2, 3]


@pytest.mark.asyncio
async def test_loop_agent_for_each_auto_detect_first_value(mock_node):
    """Test LoopAgent for_each using first input value"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"other_key": [1, 2, 3]})
    assert result["loop_type"] == "for_each"
    assert result["items"] == [1, 2, 3]


@pytest.mark.asyncio
async def test_loop_agent_for_each_string_json_array(mock_node):
    """Test LoopAgent for_each parsing JSON array string"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    json_str = json.dumps([1, 2, 3])
    result = await agent.execute({"data": json_str})
    assert result["loop_type"] == "for_each"
    assert result["items"] == [1, 2, 3]


@pytest.mark.asyncio
async def test_loop_agent_for_each_string_json_object(mock_node):
    """Test LoopAgent for_each parsing JSON object string (wraps in list)"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    json_str = json.dumps({"key": "value"})
    result = await agent.execute({"data": json_str})
    assert result["loop_type"] == "for_each"
    assert len(result["items"]) == 1
    assert result["items"][0]["key"] == "value"


@pytest.mark.asyncio
async def test_loop_agent_for_each_string_jsonl(mock_node):
    """Test LoopAgent for_each parsing JSONL string"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    jsonl_str = '{"id": 1}\n{"id": 2}\n{"id": 3}'
    result = await agent.execute({"data": jsonl_str})
    assert result["loop_type"] == "for_each"
    assert len(result["items"]) == 3
    assert result["items"][0]["id"] == 1


@pytest.mark.asyncio
async def test_loop_agent_for_each_string_csv_like(mock_node):
    """Test LoopAgent for_each parsing comma-separated string"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    csv_str = "item1, item2, item3"
    result = await agent.execute({"data": csv_str})
    assert result["loop_type"] == "for_each"
    assert len(result["items"]) == 3
    assert "item1" in result["items"]


@pytest.mark.asyncio
async def test_loop_agent_for_each_non_list_wraps(mock_node):
    """Test LoopAgent for_each wrapping non-list value in list"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"data": "single_value"})
    assert result["loop_type"] == "for_each"
    assert isinstance(result["items"], list)
    assert len(result["items"]) >= 1


@pytest.mark.asyncio
async def test_loop_agent_for_each_max_iterations(mock_node):
    """Test LoopAgent for_each limiting iterations"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=2
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"data": [1, 2, 3, 4, 5]})
    assert result["loop_type"] == "for_each"
    assert len(result["items"]) == 2
    assert result["items"] == [1, 2]


@pytest.mark.asyncio
async def test_loop_agent_for_each_no_items_error(mock_node):
    """Test LoopAgent for_each error when no items found"""
    config = LoopConfig(
        loop_type="for_each",
        items_source="nonexistent",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    with pytest.raises(ValueError, match="not found in inputs"):
        await agent.execute({"other": "value"})


@pytest.mark.asyncio
async def test_loop_agent_for_each_empty_inputs_error(mock_node):
    """Test LoopAgent for_each error when inputs are empty"""
    config = LoopConfig(
        loop_type="for_each",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    with pytest.raises(ValueError, match="requires items_source"):
        await agent.execute({})


@pytest.mark.asyncio
async def test_loop_agent_while_loop(mock_node):
    """Test LoopAgent while loop"""
    config = LoopConfig(
        loop_type="while",
        condition="value > 0",
        max_iterations=10
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"value": 5})
    assert result["loop_type"] == "while"
    assert result["condition"] == "value > 0"
    assert result["max_iterations"] == 10
    assert result["current_iteration"] == 0


@pytest.mark.asyncio
async def test_loop_agent_until_loop(mock_node):
    """Test LoopAgent until loop"""
    config = LoopConfig(
        loop_type="until",
        condition="value == 0",
        max_iterations=10
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"value": 5})
    assert result["loop_type"] == "until"
    assert result["condition"] == "value == 0"
    assert result["max_iterations"] == 10
    assert result["current_iteration"] == 0


@pytest.mark.asyncio
async def test_loop_agent_unknown_type_error(mock_node):
    """Test LoopAgent error for unknown loop type"""
    config = LoopConfig(
        loop_type="unknown_type",
        max_iterations=0
    )
    mock_node.loop_config = config
    agent = LoopAgent(mock_node)
    
    with pytest.raises(ValueError, match="Unknown loop type"):
        await agent.execute({"data": [1, 2, 3]})


@pytest.mark.asyncio
async def test_loop_agent_no_config_defaults(mock_node):
    """Test LoopAgent with no loop_config uses defaults"""
    mock_node.loop_config = None
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"data": [1, 2, 3]})
    assert result["loop_type"] == "for_each"
    assert result["items"] == [1, 2, 3]


@pytest.mark.asyncio
async def test_loop_agent_empty_dict_config_defaults(mock_node):
    """Test LoopAgent with empty dict loop_config uses defaults"""
    mock_node.loop_config = {}
    agent = LoopAgent(mock_node)
    
    result = await agent.execute({"data": [1, 2, 3]})
    assert result["loop_type"] == "for_each"
    assert result["items"] == [1, 2, 3]

