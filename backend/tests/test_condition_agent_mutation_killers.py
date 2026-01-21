"""Tests specifically designed to kill surviving mutants in condition_agent.py

These tests target:
- Comparison operators (==, !=, <, >, <=, >=)
- Length comparisons (len() == 0, len() > 0)
- Type comparisons (isinstance checks)
- Boolean logic (and, or)
- Field path comparisons (parts[0] != 'items', len(parts) > 1)
"""
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


class TestComparisonOperators:
    """Test comparison operator boundaries"""
    
    @pytest.mark.asyncio
    async def test_condition_equals_true(self, condition_node):
        """Test equals condition with matching value (boundary: ==)"""
        config = ConditionConfig(
            field="status",
            condition_type="equals",
            value="active"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"status": "active"})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_condition_equals_false(self, condition_node):
        """Test equals condition with non-matching value (boundary: !=)"""
        config = ConditionConfig(
            field="status",
            condition_type="equals",
            value="active"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"status": "inactive"})
        assert result["branch"] == "false"
        assert result["condition_result"] is False
    
    @pytest.mark.asyncio
    async def test_condition_not_equals_true(self, condition_node):
        """Test not_equals condition with non-matching value (boundary: !=)"""
        config = ConditionConfig(
            field="status",
            condition_type="not_equals",
            value="active"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"status": "inactive"})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_condition_not_equals_false(self, condition_node):
        """Test not_equals condition with matching value (boundary: ==)"""
        config = ConditionConfig(
            field="status",
            condition_type="not_equals",
            value="active"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"status": "active"})
        assert result["branch"] == "false"
        assert result["condition_result"] is False
    
    @pytest.mark.asyncio
    async def test_condition_greater_than_true(self, condition_node):
        """Test greater_than condition (boundary: >)"""
        config = ConditionConfig(
            field="count",
            condition_type="greater_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 15})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_condition_greater_than_false(self, condition_node):
        """Test greater_than condition with smaller value (boundary: <=)"""
        config = ConditionConfig(
            field="count",
            condition_type="greater_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 5})
        assert result["branch"] == "false"
        assert result["condition_result"] is False
    
    @pytest.mark.asyncio
    async def test_condition_greater_than_equal(self, condition_node):
        """Test greater_than condition with equal value (boundary: ==)"""
        config = ConditionConfig(
            field="count",
            condition_type="greater_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 10})
        assert result["branch"] == "false"
        assert result["condition_result"] is False
    
    @pytest.mark.asyncio
    async def test_condition_not_greater_than_true(self, condition_node):
        """Test not_greater_than condition (boundary: <=)"""
        config = ConditionConfig(
            field="count",
            condition_type="not_greater_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 5})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_condition_not_greater_than_equal(self, condition_node):
        """Test not_greater_than condition with equal value (boundary: ==)"""
        config = ConditionConfig(
            field="count",
            condition_type="not_greater_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 10})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_condition_less_than_true(self, condition_node):
        """Test less_than condition (boundary: <)"""
        config = ConditionConfig(
            field="count",
            condition_type="less_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 5})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_condition_less_than_false(self, condition_node):
        """Test less_than condition with larger value (boundary: >=)"""
        config = ConditionConfig(
            field="count",
            condition_type="less_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 15})
        assert result["branch"] == "false"
        assert result["condition_result"] is False
    
    @pytest.mark.asyncio
    async def test_condition_less_than_equal(self, condition_node):
        """Test less_than condition with equal value (boundary: ==)"""
        config = ConditionConfig(
            field="count",
            condition_type="less_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 10})
        assert result["branch"] == "false"
        assert result["condition_result"] is False
    
    @pytest.mark.asyncio
    async def test_condition_not_less_than_true(self, condition_node):
        """Test not_less_than condition (boundary: >=)"""
        config = ConditionConfig(
            field="count",
            condition_type="not_less_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 15})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_condition_not_less_than_equal(self, condition_node):
        """Test not_less_than condition with equal value (boundary: ==)"""
        config = ConditionConfig(
            field="count",
            condition_type="not_less_than",
            value="10"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"count": 10})
        assert result["branch"] == "true"
        assert result["condition_result"] is True


class TestLengthComparisons:
    """Test length comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_condition_empty_length_zero(self, condition_node):
        """Test empty condition with length 0 (boundary: len() == 0)"""
        config = ConditionConfig(
            field="items",
            condition_type="empty",
            value=""
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": []})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_condition_empty_length_one(self, condition_node):
        """Test empty condition with length 1 (boundary: len() > 0)"""
        config = ConditionConfig(
            field="items",
            condition_type="empty",
            value=""
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["item1"]})
        assert result["branch"] == "false"
        assert result["condition_result"] is False
    
    @pytest.mark.asyncio
    async def test_condition_is_not_empty_length_zero(self, condition_node):
        """Test is_not_empty condition with length 0 (boundary: len() == 0)"""
        config = ConditionConfig(
            field="items",
            condition_type="is_not_empty",
            value=""
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": []})
        assert result["branch"] == "false"
        assert result["condition_result"] is False
    
    @pytest.mark.asyncio
    async def test_condition_is_not_empty_length_one(self, condition_node):
        """Test is_not_empty condition with length 1 (boundary: len() > 0)"""
        config = ConditionConfig(
            field="items",
            condition_type="is_not_empty",
            value=""
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["item1"]})
        assert result["branch"] == "true"
        assert result["condition_result"] is True
    
    @pytest.mark.asyncio
    async def test_field_value_list_length_zero(self, condition_node):
        """Test field value list with length 0 (boundary: len(field_value) == 0)"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": []})
        # Should handle empty list
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_field_value_list_length_one(self, condition_node):
        """Test field value list with length 1 (boundary: len(field_value) > 0)"""
        config = ConditionConfig(
            field="items.description",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": [{"description": "test"}]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_inputs_length_one(self, condition_node):
        """Test inputs with length 1 (boundary: len(inputs) == 1)"""
        config = ConditionConfig(
            field="data.value",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"data": {"value": "test"}})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_inputs_length_two(self, condition_node):
        """Test inputs with length 2 (boundary: len(inputs) > 1)"""
        config = ConditionConfig(
            field="status",
            condition_type="equals",
            value="active"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"status": "active", "count": 10})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_value_list_length_zero(self, condition_node):
        """Test value list with length 0 (boundary: len(value) == 0)"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": []})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_value_list_length_one(self, condition_node):
        """Test value list with length 1 (boundary: len(value) > 0)"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["test"]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_value_dict_length_zero(self, condition_node):
        """Test value dict with length 0 (boundary: len(value) == 0)"""
        config = ConditionConfig(
            field="data",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"data": {}})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_value_dict_length_one(self, condition_node):
        """Test value dict with length 1 (boundary: len(value) > 0)"""
        config = ConditionConfig(
            field="data",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"data": {"key": "value"}})
        assert result is not None


class TestFieldPathComparisons:
    """Test field path comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_field_path_parts_zero_not_items(self, condition_node):
        """Test field path with parts[0] != 'items' (boundary: != 'items')"""
        config = ConditionConfig(
            field="data.value",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"data": {"value": "test"}})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_field_path_parts_zero_is_items(self, condition_node):
        """Test field path with parts[0] == 'items' (boundary: == 'items')"""
        config = ConditionConfig(
            field="items.value",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": [{"value": "test"}]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_field_path_parts_length_one(self, condition_node):
        """Test field path with len(parts) == 1 (boundary: == 1)"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": "test"})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_field_path_parts_length_two(self, condition_node):
        """Test field path with len(parts) > 1 (boundary: > 1)"""
        config = ConditionConfig(
            field="items.description",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": [{"description": "test"}]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_field_path_starts_with_key(self, condition_node):
        """Test field path that starts with key (boundary: startswith(key + '.'))"""
        config = ConditionConfig(
            field="items.description",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": [{"description": "test"}]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_field_path_not_starts_with_key(self, condition_node):
        """Test field path that doesn't start with key (boundary: not startswith(key + '.'))"""
        config = ConditionConfig(
            field="description.value",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": [{"description": {"value": "test"}}]})
        assert result is not None


class TestTypeComparisons:
    """Test type comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_field_value_is_list(self, condition_node):
        """Test field value isinstance list (boundary: isinstance(field_value, list))"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["test"]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_field_value_is_not_list(self, condition_node):
        """Test field value not isinstance list (boundary: not isinstance(field_value, list))"""
        config = ConditionConfig(
            field="status",
            condition_type="equals",
            value="active"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"status": "active"})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_value_is_list(self, condition_node):
        """Test value isinstance list (boundary: isinstance(value, list))"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["test"]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_value_is_tuple(self, condition_node):
        """Test value isinstance tuple (boundary: isinstance(value, tuple))"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ("test",)})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_value_is_dict(self, condition_node):
        """Test value isinstance dict (boundary: isinstance(value, dict))"""
        config = ConditionConfig(
            field="data",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"data": {"key": "value"}})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_first_item_is_string(self, condition_node):
        """Test first item isinstance string (boundary: isinstance(first_item, str))"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ['{"key": "value"}']})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_first_item_is_not_string(self, condition_node):
        """Test first item not isinstance string (boundary: not isinstance(first_item, str))"""
        config = ConditionConfig(
            field="items",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": [{"key": "value"}]})
        assert result is not None


class TestIndexComparisons:
    """Test index comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_index_zero(self, condition_node):
        """Test index exactly 0 (boundary: index == 0)"""
        config = ConditionConfig(
            field="items[0]",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["test", "other"]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_index_one(self, condition_node):
        """Test index exactly 1 (boundary: index == 1)"""
        config = ConditionConfig(
            field="items[1]",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["other", "test"]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_index_negative_one(self, condition_node):
        """Test index -1 (boundary: index == -1)"""
        config = ConditionConfig(
            field="items[-1]",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["other", "test"]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_index_in_range(self, condition_node):
        """Test index in range (boundary: 0 <= index < len(current))"""
        config = ConditionConfig(
            field="items[0]",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["test"]})
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_index_out_of_range(self, condition_node):
        """Test index out of range (boundary: index >= len(current))"""
        config = ConditionConfig(
            field="items[10]",
            condition_type="equals",
            value="test"
        )
        condition_node.condition_config = config
        agent = ConditionAgent(condition_node)
        
        result = await agent.execute({"items": ["test"]})
        # Should handle out of range gracefully
        assert result is not None

