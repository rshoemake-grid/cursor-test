"""
Unit tests for workflow reconstruction utilities.
"""
import pytest
from fastapi import HTTPException
from backend.utils.workflow_reconstruction import (
    extract_node_configs_from_data,
    reconstruct_node,
    reconstruct_nodes,
    reconstruct_workflow_definition
)
from backend.models.schemas import Node, NodeType, WorkflowDefinition

class TestExtractNodeConfigsFromData:
    def test_no_data_object(self):
        node_data = {"id": "node-1", "type": "agent"}
        result = extract_node_configs_from_data(node_data)
        assert result == node_data
    
    def test_extract_loop_config_from_data(self):
        node_data = {
            "id": "loop-1",
            "type": "loop",
            "data": {"loop_config": {"loop_type": "for_each"}}
        }
        result = extract_node_configs_from_data(node_data)
        assert result["loop_config"] == {"loop_type": "for_each"}

class TestReconstructNode:
    def test_reconstruct_simple_node(self):
        node_data = {"id": "start-1", "type": "start"}
        node = reconstruct_node(node_data, 0)
        assert isinstance(node, Node)
        assert node.id == "start-1"
    
    def test_reconstruct_node_invalid_data(self):
        node_data = {"id": "invalid", "type": "invalid_type"}
        with pytest.raises(HTTPException) as exc_info:
            reconstruct_node(node_data, 0)
        assert exc_info.value.status_code == 422

class TestReconstructNodes:
    def test_reconstruct_empty_list(self):
        nodes = reconstruct_nodes([])
        assert nodes == []
    
    def test_reconstruct_multiple_nodes(self):
        nodes_data = [
            {"id": "start-1", "type": "start"},
            {"id": "end-1", "type": "end"}
        ]
        nodes = reconstruct_nodes(nodes_data)
        assert len(nodes) == 2

class TestReconstructWorkflowDefinition:
    def test_reconstruct_minimal_workflow(self):
        definition = {
            "id": "workflow-1",
            "name": "Test",
            "nodes": [],
            "edges": []
        }
        workflow = reconstruct_workflow_definition(definition)
        assert isinstance(workflow, WorkflowDefinition)
