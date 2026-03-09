"""
Unit tests for WorkflowValidationService (validate_workflow_definition).
"""
import pytest

from backend.services.workflow_validation_service import validate_workflow_definition


class TestValidateWorkflowDefinition:
    """Tests for validate_workflow_definition function."""

    def test_valid_workflow_with_start_and_end(self):
        """Valid workflow with start and end nodes, no issues."""
        definition = {
            "nodes": [
                {"id": "start-1", "type": "start"},
                {"id": "agent-1", "type": "agent", "data": {"agent_config": {"system_prompt": "Hi"}}},
                {"id": "end-1", "type": "end"},
            ],
            "edges": [
                {"source": "start-1", "target": "agent-1"},
                {"source": "agent-1", "target": "end-1"},
            ],
        }
        result = validate_workflow_definition("wf-1", definition)
        assert result["workflow_id"] == "wf-1"
        assert result["valid"] is True
        assert result["issues"] == []
        assert result["node_count"] == 3
        assert result["edge_count"] == 2

    def test_missing_start_node(self):
        """Workflow without start node has issues."""
        definition = {
            "nodes": [{"id": "agent-1", "type": "agent"}],
            "edges": [],
        }
        result = validate_workflow_definition("wf-1", definition)
        assert result["valid"] is False
        assert any(i["type"] == "missing_start" for i in result["issues"])

    def test_missing_end_node_warning(self):
        """Workflow without end node has warning."""
        definition = {
            "nodes": [{"id": "start-1", "type": "start"}],
            "edges": [],
        }
        result = validate_workflow_definition("wf-1", definition)
        assert result["valid"] is True
        assert any(w["type"] == "missing_end" for w in result["warnings"])

    def test_orphan_nodes_warning(self):
        """Workflow with orphan nodes has warning."""
        definition = {
            "nodes": [
                {"id": "start-1", "type": "start"},
                {"id": "orphan-1", "type": "agent"},
            ],
            "edges": [{"source": "start-1", "target": "end-1"}],
        }
        result = validate_workflow_definition("wf-1", definition)
        assert any(w["type"] == "orphan_nodes" for w in result["warnings"])
        assert "orphan-1" in result["warnings"][0]["nodes"]

    def test_cycle_detected(self):
        """Workflow with cycle has issue."""
        definition = {
            "nodes": [
                {"id": "node-1", "type": "agent"},
                {"id": "node-2", "type": "agent"},
            ],
            "edges": [
                {"source": "node-1", "target": "node-2"},
                {"source": "node-2", "target": "node-1"},
            ],
        }
        result = validate_workflow_definition("wf-1", definition)
        assert result["valid"] is False
        assert any(i["type"] == "cycle_detected" for i in result["issues"])

    def test_missing_system_prompt_warning(self):
        """Agent node without system prompt has warning."""
        definition = {
            "nodes": [
                {"id": "start-1", "type": "start"},
                {"id": "agent-1", "type": "agent", "data": {"agent_config": {}}},
                {"id": "end-1", "type": "end"},
            ],
            "edges": [
                {"source": "start-1", "target": "agent-1"},
                {"source": "agent-1", "target": "end-1"},
            ],
        }
        result = validate_workflow_definition("wf-1", definition)
        assert any(w["type"] == "missing_system_prompt" for w in result["warnings"])
        assert result["warnings"][0]["node_id"] == "agent-1"

    def test_empty_definition(self):
        """Empty definition returns defaults."""
        result = validate_workflow_definition("wf-1", {})
        assert result["workflow_id"] == "wf-1"
        assert result["valid"] is False
        assert result["node_count"] == 0
        assert result["edge_count"] == 0
        assert any(i["type"] == "missing_start" for i in result["issues"])

    def test_missing_nodes_key_uses_empty_list(self):
        """Definition without nodes key uses empty list."""
        result = validate_workflow_definition("wf-1", {"edges": []})
        assert result["node_count"] == 0
        assert result["edge_count"] == 0
