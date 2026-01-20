"""
Tests for workflow route utilities.
"""
import pytest
from backend.api.routes.workflow_routes import reconstruct_nodes
from backend.models.schemas import Node, NodeType, AgentConfig, ConditionConfig, LoopConfig


@pytest.fixture
def sample_node_data():
    """Sample node data for testing"""
    return [
        {
            "id": "start-1",
            "type": "start",
            "name": "Start",
            "position": {"x": 0, "y": 0}
        },
        {
            "id": "agent-1",
            "type": "agent",
            "name": "Test Agent",
            "position": {"x": 100, "y": 100},
            "agent_config": {
                "model": "gpt-4",
                "temperature": 0.7,
                "system_prompt": "You are helpful"
            }
        }
    ]


@pytest.fixture
def node_data_with_data_object():
    """Node data with config in data object"""
    return [
        {
            "id": "agent-1",
            "type": "agent",
            "name": "Test Agent",
            "position": {"x": 0, "y": 0},
            "data": {
                "agent_config": {
                    "model": "gpt-4",
                    "temperature": 0.7
                }
            }
        }
    ]


def test_reconstruct_nodes_basic(sample_node_data):
    """Test basic node reconstruction"""
    nodes = reconstruct_nodes(sample_node_data)
    
    assert len(nodes) == 2
    assert nodes[0].id == "start-1"
    assert nodes[0].type == NodeType.START
    assert nodes[1].id == "agent-1"
    assert nodes[1].type == NodeType.AGENT


def test_reconstruct_nodes_with_agent_config(sample_node_data):
    """Test node reconstruction with agent config"""
    nodes = reconstruct_nodes(sample_node_data)
    
    agent_node = nodes[1]
    assert agent_node.agent_config is not None
    assert agent_node.agent_config.model == "gpt-4"
    assert agent_node.agent_config.temperature == 0.7


def test_reconstruct_nodes_extract_config_from_data(node_data_with_data_object):
    """Test extracting config from data object"""
    nodes = reconstruct_nodes(node_data_with_data_object)
    
    assert len(nodes) == 1
    agent_node = nodes[0]
    assert agent_node.agent_config is not None
    assert agent_node.agent_config.model == "gpt-4"


def test_reconstruct_nodes_with_condition_config():
    """Test node reconstruction with condition config"""
    node_data = [
        {
            "id": "condition-1",
            "type": "condition",
            "name": "Test Condition",
            "position": {"x": 0, "y": 0},
            "condition_config": {
                "field": "status",
                "condition_type": "equals",
                "value": "active"
            }
        }
    ]
    
    nodes = reconstruct_nodes(node_data)
    assert len(nodes) == 1
    assert nodes[0].condition_config is not None
    assert nodes[0].condition_config.field == "status"


def test_reconstruct_nodes_with_loop_config():
    """Test node reconstruction with loop config"""
    node_data = [
        {
            "id": "loop-1",
            "type": "loop",
            "name": "Test Loop",
            "position": {"x": 0, "y": 0},
            "loop_config": {
                "loop_type": "for_each",
                "max_iterations": 10
            }
        }
    ]
    
    nodes = reconstruct_nodes(node_data)
    assert len(nodes) == 1
    assert nodes[0].loop_config is not None
    assert nodes[0].loop_config.loop_type == "for_each"


def test_reconstruct_nodes_empty_list():
    """Test reconstructing empty node list"""
    nodes = reconstruct_nodes([])
    assert len(nodes) == 0


def test_reconstruct_nodes_invalid_data():
    """Test that invalid node data raises error"""
    invalid_data = [
        {
            "id": "invalid-1",
            "type": "invalid_type",  # Invalid type
            "name": "Invalid"
        }
    ]
    
    with pytest.raises(Exception):  # Should raise validation error
        reconstruct_nodes(invalid_data)


def test_reconstruct_nodes_missing_required_field():
    """Test that missing required fields raise error"""
    invalid_data = [
        {
            # Missing id and type
            "name": "Invalid"
        }
    ]
    
    with pytest.raises(Exception):  # Should raise validation error
        reconstruct_nodes(invalid_data)

