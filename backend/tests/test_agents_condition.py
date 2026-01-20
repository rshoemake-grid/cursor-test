"""
Tests for ConditionAgent class.
"""
import pytest
from backend.agents.condition_agent import ConditionAgent
from backend.models.schemas import Node, NodeType, ConditionConfig


@pytest.fixture
def condition_node():
    """Create a condition node with config"""
    return Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="status",
            condition_type="equals",
            value="active"
        )
    )


@pytest.fixture
def condition_node_nested():
    """Create a condition node with nested field"""
    return Node(
        id="condition-2",
        type=NodeType.CONDITION,
        name="Nested Condition",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="data.status",
            condition_type="equals",
            value="active"
        )
    )


@pytest.mark.asyncio
async def test_condition_agent_initialization(condition_node):
    """Test ConditionAgent initialization"""
    agent = ConditionAgent(condition_node)
    assert agent.node_id == "condition-1"
    assert agent.config.field == "status"
    assert agent.config.condition_type == "equals"
    assert agent.config.value == "active"


@pytest.mark.asyncio
async def test_condition_agent_missing_config():
    """Test that missing condition_config raises error"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0}
    )
    
    with pytest.raises(ValueError) as exc_info:
        ConditionAgent(node)
    
    assert "requires condition_config" in str(exc_info.value)


@pytest.mark.asyncio
async def test_condition_agent_execute_equals_true(condition_node):
    """Test condition evaluation with equals - true case"""
    agent = ConditionAgent(condition_node)
    inputs = {"status": "active"}
    
    result = await agent.execute(inputs)
    
    assert result["condition_result"] is True
    assert result["branch"] == "true"
    assert result["field_value"] == "active"


@pytest.mark.asyncio
async def test_condition_agent_execute_equals_false(condition_node):
    """Test condition evaluation with equals - false case"""
    agent = ConditionAgent(condition_node)
    inputs = {"status": "inactive"}
    
    result = await agent.execute(inputs)
    
    assert result["condition_result"] is False
    assert result["branch"] == "false"
    assert result["field_value"] == "inactive"


@pytest.mark.asyncio
async def test_condition_agent_execute_not_equals():
    """Test not_equals condition type"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="status",
            condition_type="not_equals",
            value="inactive"
        )
    )
    agent = ConditionAgent(node)
    inputs = {"status": "active"}
    
    result = await agent.execute(inputs)
    assert result["condition_result"] is True


@pytest.mark.asyncio
async def test_condition_agent_execute_contains():
    """Test contains condition type"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="message",
            condition_type="contains",
            value="error"
        )
    )
    agent = ConditionAgent(node)
    inputs = {"message": "An error occurred"}
    
    result = await agent.execute(inputs)
    assert result["condition_result"] is True


@pytest.mark.asyncio
async def test_condition_agent_execute_greater_than():
    """Test greater_than condition type"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="count",
            condition_type="greater_than",
            value="5"
        )
    )
    agent = ConditionAgent(node)
    inputs = {"count": 10}
    
    result = await agent.execute(inputs)
    assert result["condition_result"] is True


@pytest.mark.asyncio
async def test_condition_agent_execute_less_than():
    """Test less_than condition type"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="count",
            condition_type="less_than",
            value="10"
        )
    )
    agent = ConditionAgent(node)
    inputs = {"count": 5}
    
    result = await agent.execute(inputs)
    assert result["condition_result"] is True


@pytest.mark.asyncio
async def test_condition_agent_execute_empty():
    """Test empty condition type"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="items",
            condition_type="empty",
            value=""
        )
    )
    agent = ConditionAgent(node)
    inputs = {"items": []}
    
    result = await agent.execute(inputs)
    assert result["condition_result"] is True


@pytest.mark.asyncio
async def test_condition_agent_execute_not_empty():
    """Test not_empty condition type"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="items",
            condition_type="not_empty",
            value=""
        )
    )
    agent = ConditionAgent(node)
    inputs = {"items": [1, 2, 3]}
    
    result = await agent.execute(inputs)
    assert result["condition_result"] is True


@pytest.mark.asyncio
async def test_condition_agent_nested_field_access(condition_node_nested):
    """Test accessing nested fields with dot notation"""
    agent = ConditionAgent(condition_node_nested)
    inputs = {"data": {"status": "active"}}
    
    result = await agent.execute(inputs)
    
    assert result["condition_result"] is True
    assert result["field_value"] == "active"


@pytest.mark.asyncio
async def test_condition_agent_missing_field_raises_error(condition_node):
    """Test that missing field raises error when auto-detection fails"""
    agent = ConditionAgent(condition_node)
    # Use multiple inputs so auto-detection doesn't kick in
    inputs = {"other_field": "value", "another_field": "value2"}
    
    # The agent will try auto-detection but should eventually raise error
    # if field is truly not found and can't be auto-detected
    with pytest.raises(ValueError) as exc_info:
        await agent.execute(inputs)
    
    assert "not found in inputs" in str(exc_info.value) or "Field" in str(exc_info.value)


@pytest.mark.asyncio
async def test_condition_agent_missing_field_in_config():
    """Test that missing field in config raises error"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="",  # Empty field
            condition_type="equals",
            value="test"
        )
    )
    agent = ConditionAgent(node)
    inputs = {"status": "active"}
    
    with pytest.raises(ValueError) as exc_info:
        await agent.execute(inputs)
    
    assert "requires 'field'" in str(exc_info.value)


@pytest.mark.asyncio
async def test_condition_agent_list_field_access():
    """Test accessing field from list items"""
    node = Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="items.0.status",
            condition_type="equals",
            value="active"
        )
    )
    agent = ConditionAgent(node)
    inputs = {"items": [{"status": "active"}, {"status": "inactive"}]}
    
    result = await agent.execute(inputs)
    assert result["condition_result"] is True

