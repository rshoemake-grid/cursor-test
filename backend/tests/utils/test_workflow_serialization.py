"""
Unit tests for workflow_serialization (workflow_db_to_response, workflow_db_to_response_v2).
"""
import pytest
from datetime import datetime
from unittest.mock import MagicMock

from backend.utils.workflow_serialization import (
    workflow_db_to_response,
    workflow_db_to_response_v2,
)


class TestWorkflowDbToResponse:
    """Tests for workflow_db_to_response (WorkflowResponse with Node/Edge)."""

    def test_workflow_db_to_response_basic(self):
        """Converts WorkflowDB to WorkflowResponse."""
        w = MagicMock()
        w.id = "wf-1"
        w.name = "Test"
        w.description = "Desc"
        w.version = "1.0"
        w.definition = {
            "nodes": [
                {"id": "start-1", "type": "start", "position": {"x": 0, "y": 0}, "data": {}},
                {"id": "end-1", "type": "end", "position": {"x": 100, "y": 0}, "data": {}},
            ],
            "edges": [{"id": "e1", "source": "start-1", "target": "end-1"}],
            "variables": {},
        }
        w.created_at = datetime(2024, 1, 1)
        w.updated_at = datetime(2024, 1, 2)

        result = workflow_db_to_response(w)
        assert result.id == "wf-1"
        assert result.name == "Test"
        assert len(result.nodes) == 2
        assert len(result.edges) == 1
        assert result.edges[0].source == "start-1"


class TestWorkflowDbToResponseV2:
    """Tests for workflow_db_to_response_v2 (WorkflowResponseV2 with raw dicts)."""

    def test_workflow_db_to_response_v2_basic(self):
        """Converts WorkflowDB to WorkflowResponseV2."""
        w = MagicMock()
        w.id = "wf-1"
        w.name = "Test"
        w.description = "Desc"
        w.version = "1.0"
        w.definition = {
            "nodes": [{"id": "n1", "type": "agent", "position": {"x": 0, "y": 0}, "data": {}}],
            "edges": [],
            "variables": {"x": 1},
        }
        w.owner_id = "user-1"
        w.is_public = True
        w.is_template = False
        w.category = "automation"
        w.tags = ["t1"]
        w.likes_count = 5
        w.views_count = 10
        w.uses_count = 2
        w.created_at = datetime(2024, 1, 1)
        w.updated_at = datetime(2024, 1, 2)

        result = workflow_db_to_response_v2(w)
        assert result.id == "wf-1"
        assert len(result.nodes) == 1
        assert result.nodes[0].id == "n1"
        assert result.nodes[0].type.value == "agent"
        assert result.variables == {"x": 1}
        assert result.likes_count == 5

    def test_workflow_db_to_response_v2_empty_definition(self):
        """Handles None or empty definition."""
        w = MagicMock()
        w.id = "wf-1"
        w.name = "Test"
        w.description = None
        w.version = "1.0"
        w.definition = None
        w.owner_id = None
        w.is_public = False
        w.is_template = False
        w.category = None
        w.tags = None
        w.likes_count = None
        w.views_count = None
        w.uses_count = None
        w.created_at = datetime(2024, 1, 1)
        w.updated_at = datetime(2024, 1, 2)

        result = workflow_db_to_response_v2(w)
        assert result.nodes == []
        assert result.edges == []
        assert result.variables == {}
        assert result.tags == []
