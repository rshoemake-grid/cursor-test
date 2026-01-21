"""More tests for ConditionAgent - remaining condition types and edge cases"""
import pytest

from backend.agents.condition_agent import ConditionAgent
from backend.models.schemas import Node, NodeType, ConditionConfig


@pytest.fixture
def mock_node():
    """Create a mock condition node"""
    config = ConditionConfig(
        condition_type="equals",
        field="value",
        value="test"
    )
    node = Node(
        id="test-condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    return node


@pytest.mark.asyncio
async def test_condition_agent_not_contains(mock_node):
    """Test ConditionAgent with not_contains condition"""
    config = ConditionConfig(
        condition_type="not_contains",
        field="text",
        value="error"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"text": "This is a success message"})
    assert result["branch"] == "true"
    
    result = await agent.execute({"text": "This is an error message"})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_not_greater_than(mock_node):
    """Test ConditionAgent with not_greater_than condition"""
    config = ConditionConfig(
        condition_type="not_greater_than",
        field="count",
        value="10"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"count": 5})
    assert result["branch"] == "true"
    
    result = await agent.execute({"count": 10})
    assert result["branch"] == "true"
    
    result = await agent.execute({"count": 15})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_not_less_than(mock_node):
    """Test ConditionAgent with not_less_than condition"""
    config = ConditionConfig(
        condition_type="not_less_than",
        field="score",
        value="50"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"score": 60})
    assert result["branch"] == "true"
    
    result = await agent.execute({"score": 50})
    assert result["branch"] == "true"
    
    result = await agent.execute({"score": 40})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_is_not_empty(mock_node):
    """Test ConditionAgent with is_not_empty condition"""
    config = ConditionConfig(
        condition_type="is_not_empty",
        field="data"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"data": "some value"})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": ""})
    assert result["branch"] == "false"
    
    result = await agent.execute({"data": []})
    assert result["branch"] == "false"
    
    result = await agent.execute({"data": [1, 2, 3]})
    assert result["branch"] == "true"


@pytest.mark.asyncio
async def test_condition_agent_is_empty(mock_node):
    """Test ConditionAgent with is_empty condition"""
    config = ConditionConfig(
        condition_type="is_empty",
        field="data"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"data": ""})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": []})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": {}})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": "some value"})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_numeric_comparison_strings(mock_node):
    """Test ConditionAgent numeric comparison with string values"""
    config = ConditionConfig(
        condition_type="greater_than",
        field="count",
        value="10"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"count": "15"})
    assert result["branch"] == "true"
    
    result = await agent.execute({"count": "5"})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_numeric_comparison_invalid(mock_node):
    """Test ConditionAgent numeric comparison with invalid values"""
    config = ConditionConfig(
        condition_type="greater_than",
        field="text",
        value="10"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    # Non-numeric field value should return False
    result = await agent.execute({"text": "not a number"})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_nested_field_deep(mock_node):
    """Test ConditionAgent with deeply nested field"""
    config = ConditionConfig(
        condition_type="equals",
        field="level1.level2.level3.value",
        value="target"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({
        "level1": {
            "level2": {
                "level3": {
                    "value": "target"
                }
            }
        }
    })
    assert result["branch"] == "true"
    
    result = await agent.execute({
        "level1": {
            "level2": {
                "level3": {
                    "value": "other"
                }
            }
        }
    })
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_nested_field_missing_intermediate(mock_node):
    """Test ConditionAgent with missing intermediate field"""
    config = ConditionConfig(
        condition_type="equals",
        field="level1.level2.value",
        value="target"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    # Missing level2 should return None, which evaluates to False
    result = await agent.execute({
        "level1": {}
    })
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_list_field_access(mock_node):
    """Test ConditionAgent accessing list element"""
    config = ConditionConfig(
        condition_type="equals",
        field="items.0.name",
        value="first"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({
        "items": [
            {"name": "first"},
            {"name": "second"}
        ]
    })
    assert result["branch"] == "true"
    
    result = await agent.execute({
        "items": [
            {"name": "second"},
            {"name": "first"}
        ]
    })
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_list_field_out_of_bounds(mock_node):
    """Test ConditionAgent accessing list element out of bounds"""
    config = ConditionConfig(
        condition_type="equals",
        field="items.5.name",
        value="target"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    # Out of bounds should return None, which evaluates to False
    result = await agent.execute({
        "items": [
            {"name": "first"},
            {"name": "second"}
        ]
    })
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_empty_list(mock_node):
    """Test ConditionAgent with empty list"""
    config = ConditionConfig(
        condition_type="is_empty",
        field="items"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"items": []})
    assert result["branch"] == "true"
    
    result = await agent.execute({"items": [1, 2, 3]})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_empty_dict(mock_node):
    """Test ConditionAgent with empty dict"""
    config = ConditionConfig(
        condition_type="is_empty",
        field="data"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"data": {}})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": {"key": "value"}})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_none_value(mock_node):
    """Test ConditionAgent with None value"""
    config = ConditionConfig(
        condition_type="is_empty",
        field="data"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"data": None})
    assert result["branch"] == "true"


@pytest.mark.asyncio
async def test_condition_agent_case_insensitive_contains(mock_node):
    """Test ConditionAgent case-insensitive contains"""
    config = ConditionConfig(
        condition_type="contains",
        field="text",
        value="ERROR"
    )
    mock_node.condition_config = config
    agent = ConditionAgent(mock_node)
    
    result = await agent.execute({"text": "This is an error message"})
    assert result["branch"] == "true"
    
    result = await agent.execute({"text": "This is an ERROR message"})
    assert result["branch"] == "true"
    
    result = await agent.execute({"text": "This is a success message"})
    assert result["branch"] == "false"

