"""Extended tests for ConditionAgent"""
import pytest
from unittest.mock import Mock

from backend.agents.condition_agent import ConditionAgent
from backend.models.schemas import Node, NodeType, ConditionConfig


@pytest.fixture
def condition_node():
    """Create a condition node"""
    config = ConditionConfig(
        field="value",
        operator="equals",
        value="test",
        condition_type="equals"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    return node


@pytest.mark.asyncio
async def test_condition_agent_equals_true(condition_node):
    """Test condition agent with equals operator (true)"""
    agent = ConditionAgent(condition_node)
    result = await agent.execute({"value": "test"})
    assert result["branch"] == "true"


@pytest.mark.asyncio
async def test_condition_agent_equals_false(condition_node):
    """Test condition agent with equals operator (false)"""
    agent = ConditionAgent(condition_node)
    result = await agent.execute({"value": "not_test"})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_not_equals():
    """Test condition agent with not_equals operator"""
    config = ConditionConfig(
        field="value",
        operator="not_equals",
        value="test",
        condition_type="not_equals"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    agent = ConditionAgent(node)
    result = await agent.execute({"value": "other"})
    assert result["branch"] == "true"


@pytest.mark.asyncio
async def test_condition_agent_contains():
    """Test condition agent with contains operator"""
    config = ConditionConfig(
        field="text",
        operator="contains",
        value="hello",
        condition_type="contains"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    agent = ConditionAgent(node)
    result = await agent.execute({"text": "hello world"})
    assert result["branch"] == "true"


@pytest.mark.asyncio
async def test_condition_agent_greater_than():
    """Test condition agent with greater_than operator"""
    config = ConditionConfig(
        field="count",
        operator="greater_than",
        value="5",
        condition_type="greater_than"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    agent = ConditionAgent(node)
    result = await agent.execute({"count": 10})
    assert result["branch"] == "true"
    
    result = await agent.execute({"count": 3})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_less_than():
    """Test condition agent with less_than operator"""
    config = ConditionConfig(
        field="count",
        operator="less_than",
        value="10",
        condition_type="less_than"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    agent = ConditionAgent(node)
    result = await agent.execute({"count": 5})
    assert result["branch"] == "true"
    
    result = await agent.execute({"count": 15})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_empty():
    """Test condition agent with empty operator"""
    config = ConditionConfig(
        field="data",
        operator="empty",
        value="",
        condition_type="empty"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    agent = ConditionAgent(node)
    result = await agent.execute({"data": []})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": [1, 2, 3]})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_not_empty():
    """Test condition agent with not_empty operator"""
    config = ConditionConfig(
        field="data",
        operator="not_empty",
        value="",
        condition_type="is_not_empty"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    agent = ConditionAgent(node)
    result = await agent.execute({"data": [1, 2, 3]})
    assert result["branch"] == "true"
    
    result = await agent.execute({"data": []})
    assert result["branch"] == "false"


@pytest.mark.asyncio
async def test_condition_agent_nested_field():
    """Test condition agent with nested field access"""
    config = ConditionConfig(
        field="user.name",
        operator="equals",
        value="John",
        condition_type="equals"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    agent = ConditionAgent(node)
    result = await agent.execute({"user": {"name": "John"}})
    assert result["branch"] == "true"


@pytest.mark.asyncio
async def test_condition_agent_missing_config():
    """Test condition agent without config"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition"
    )
    with pytest.raises(ValueError, match="requires condition_config"):
        ConditionAgent(node)


@pytest.mark.asyncio
async def test_condition_agent_missing_field():
    """Test condition agent without field"""
    config = ConditionConfig(
        field="",
        operator="equals",
        value="test",
        condition_type="equals"
    )
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        condition_config=config
    )
    agent = ConditionAgent(node)
    with pytest.raises(ValueError, match="requires 'field'"):
        await agent.execute({"value": "test"})

