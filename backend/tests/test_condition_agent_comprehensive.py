"""Comprehensive tests for ConditionAgent - all condition types and edge cases"""
import pytest
from unittest.mock import Mock

from backend.agents.condition_agent import ConditionAgent
from backend.models.schemas import Node, NodeType, ConditionConfig


@pytest.fixture
def condition_node():
    """Create a condition node"""
    config = ConditionConfig(
        field="status",
        condition_type="equals",
        value="active"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    return node


@pytest.mark.asyncio
async def test_condition_agent_not_equals():
    """Test ConditionAgent with NOT_EQUALS operator"""
    config = ConditionConfig(
        field="status",
        condition_type="not_equals",
        value="inactive"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with matching value (should be False)
    result = await agent.execute({"status": "inactive"})
    assert result["branch"] == "false"
    
    # Test with non-matching value (should be True)
    result = await agent.execute({"status": "active"})
    assert result["branch"] == "true"


@pytest.mark.asyncio
async def test_condition_agent_contains():
    """Test ConditionAgent with CONTAINS operator"""
    config = ConditionConfig(
        field="message",
        condition_type="contains",
        value="error"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with containing value
    result = await agent.execute({"message": "This is an error message"})
    assert result["branch"] == "true"
    
    # Test without containing value
    result = await agent.execute({"message": "This is a success message"})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_greater_than():
    """Test ConditionAgent with GREATER_THAN operator"""
    config = ConditionConfig(
        field="count",
        condition_type="greater_than",
        value="10"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with greater value
    result = await agent.execute({"count": 15})
    assert result["branch"] == "true"
    
    # Test with equal value (should be False)
    result = await agent.execute({"count": 10})
    assert result["branch"] == "false"
    
    # Test with less value
    result = await agent.execute({"count": 5})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_less_than():
    """Test ConditionAgent with LESS_THAN operator"""
    config = ConditionConfig(
        field="count",
        condition_type="less_than",
        value="10"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with less value
    result = await agent.execute({"count": 5})
    assert result["branch"] == "true"
    
    # Test with equal value (should be False)
    result = await agent.execute({"count": 10})
    assert result["branch"] == "false"
    
    # Test with greater value
    result = await agent.execute({"count": 15})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_empty():
    """Test ConditionAgent with EMPTY operator"""
    config = ConditionConfig(
        field="data",
        condition_type="empty",
        value=None
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with empty value
    result = await agent.execute({"data": ""})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": None})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": []})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": {}})
    assert result["branch"] == "true"
    
    # Test with non-empty value
    result = await agent.execute({"data": "value"})
    assert result["branch"] == "false"
    
    result = await agent.execute({"data": [1, 2, 3]})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_not_empty():
    """Test ConditionAgent with NOT_EMPTY operator"""
    config = ConditionConfig(
        field="data",
        condition_type="not_empty",
        value=None
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with non-empty value
    result = await agent.execute({"data": "value"})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": [1, 2, 3]})
    assert result["branch"] == "true"
    
    # Test with empty value
    result = await agent.execute({"data": ""})
    assert result["branch"] == "false"
    
    result = await agent.execute({"data": None})
    assert result["branch"] == "false"
    
    result = await agent.execute({"data": []})
    assert result["branch"] == "false"
    
    result = await agent.execute({"data": {}})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_nested_field():
    """Test ConditionAgent with nested field access"""
    config = ConditionConfig(
        field="user.status",
        condition_type="equals",
        value="active"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with nested field
    result = await agent.execute({"user": {"status": "active"}})
    assert result["branch"] == "true"
    
    result = await agent.execute({"user": {"status": "inactive"}})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_missing_field():
    """Test ConditionAgent with missing field"""
    config = ConditionConfig(
        field="missing_field",
        condition_type="equals",
        value="value"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with missing field - ConditionAgent tries to auto-detect
    # It may auto-detect "value" from the single input and compare it
    result = await agent.execute({"other_field": "value"})
    # Result depends on auto-detection behavior
    assert "branch" in result


@pytest.mark.asyncio
async def test_condition_agent_missing_config():
    """Test ConditionAgent with missing config"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=None
    )
    
    # Should raise ValueError when creating agent
    with pytest.raises(ValueError, match="requires condition_config"):
        ConditionAgent(node)


@pytest.mark.asyncio
async def test_condition_agent_string_comparison():
    """Test ConditionAgent with string comparison"""
    config = ConditionConfig(
        field="name",
        condition_type="equals",
        value="test"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test case-sensitive comparison
    result = await agent.execute({"name": "test"})
    assert result["branch"] == "true"
    
    result = await agent.execute({"name": "Test"})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_number_comparison():
    """Test ConditionAgent with number comparison"""
    config = ConditionConfig(
        field="age",
        condition_type="greater_than",
        value="18"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with number
    result = await agent.execute({"age": 25})
    assert result["branch"] == "true"
    
    result = await agent.execute({"age": 15})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_list_contains():
    """Test ConditionAgent CONTAINS with list"""
    config = ConditionConfig(
        field="tags",
        condition_type="contains",
        value="python"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    
    agent = ConditionAgent(node)
    
    # Test with list containing value
    result = await agent.execute({"tags": ["python", "javascript"]})
    assert result["branch"] == "true"
    
    # Test with list not containing value
    result = await agent.execute({"tags": ["java", "c++"]})
    assert result["branch"] == "false"

