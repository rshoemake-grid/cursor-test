"""
Tests for node reconstruction logic.
"""
import pytest
from backend.api.routes.workflow_routes import reconstruct_nodes
from backend.models.schemas import Node, NodeType, AgentConfig, ConditionConfig, LoopConfig


def test_reconstruct_nodes_extracts_agent_config_from_data():
    """Test that agent_config is extracted from data object when missing at top level"""
    node_data = [
        {
            "id": "agent-1",
            "type": "agent",
            "name": "Test Agent",
            "position": {"x": 0, "y": 0},
            "data": {
                "agent_config": {
                    "model": "gpt-4",
                    "temperature": 0.7,
                    "system_prompt": "Test"
                }
            }
        }
    ]
    
    nodes = reconstruct_nodes(node_data)
    assert len(nodes) == 1
    assert nodes[0].agent_config is not None
    assert nodes[0].agent_config.model == "gpt-4"


def test_reconstruct_nodes_extracts_condition_config_from_data():
    """Test that condition_config is extracted from data object"""
    node_data = [
        {
            "id": "condition-1",
            "type": "condition",
            "name": "Test Condition",
            "position": {"x": 0, "y": 0},
            "data": {
                "condition_config": {
                    "field": "status",
                    "condition_type": "equals",
                    "value": "active"
                }
            }
        }
    ]
    
    nodes = reconstruct_nodes(node_data)
    assert len(nodes) == 1
    assert nodes[0].condition_config is not None
    assert nodes[0].condition_config.field == "status"


def test_reconstruct_nodes_extracts_loop_config_from_data():
    """Test that loop_config is extracted from data object"""
    node_data = [
        {
            "id": "loop-1",
            "type": "loop",
            "name": "Test Loop",
            "position": {"x": 0, "y": 0},
            "data": {
                "loop_config": {
                    "loop_type": "for_each",
                    "max_iterations": 10
                }
            }
        }
    ]
    
    nodes = reconstruct_nodes(node_data)
    assert len(nodes) == 1
    assert nodes[0].loop_config is not None
    assert nodes[0].loop_config.loop_type == "for_each"


def test_reconstruct_nodes_prefers_top_level_config():
    """Test that top-level config takes precedence over data object"""
    node_data = [
        {
            "id": "agent-1",
            "type": "agent",
            "name": "Test Agent",
            "position": {"x": 0, "y": 0},
            "agent_config": {
                "model": "gpt-4-top",
                "temperature": 0.7
            },
            "data": {
                "agent_config": {
                    "model": "gpt-4-data",
                    "temperature": 0.8
                }
            }
        }
    ]
    
    nodes = reconstruct_nodes(node_data)
    assert nodes[0].agent_config.model == "gpt-4-top"


def test_reconstruct_nodes_handles_missing_configs():
    """Test that missing configs are handled gracefully (warnings logged)"""
    node_data = [
        {
            "id": "agent-1",
            "type": "agent",
            "name": "Test Agent",
            "position": {"x": 0, "y": 0}
            # No agent_config and no data object
        }
    ]
    
    # Should still reconstruct but config will be None
    # (actual behavior depends on Node schema validation)
    nodes = reconstruct_nodes(node_data)
    assert len(nodes) == 1

