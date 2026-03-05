"""Unit tests for backend.services.workflow_service helpers (_process_edges, _serialize_node)."""
import pytest
from unittest.mock import Mock

from backend.services.workflow_service import _process_edges, _serialize_node
from backend.models.schemas import Edge, Node, NodeType


class TestProcessEdges:
    def test_assigns_id_when_missing(self):
        # Use plain dict - Edge model auto-generates id in model_post_init
        edges = [{"source": "a", "target": "b"}]
        result = _process_edges(edges)
        assert len(result) == 1
        assert result[0]["id"] == "e-a-b-0"

    def test_preserves_existing_id(self):
        edges = [{"id": "existing-id", "source": "a", "target": "b"}]
        result = _process_edges(edges)
        assert result[0]["id"] == "existing-id"

    def test_uses_start_index(self):
        edges = [{"source": "x", "target": "y"}]
        result = _process_edges(edges, start_index=5)
        assert result[0]["id"] == "e-x-y-5"


class TestSerializeNode:
    def test_uses_model_dump_for_pydantic(self):
        node = Node(id="n1", type=NodeType.AGENT, name="Test")
        result = _serialize_node(node)
        assert "id" in result
        assert result["id"] == "n1"

    def test_uses_dict_for_plain_dict(self):
        node = {"id": "n1", "name": "Test"}
        result = _serialize_node(node)
        assert result == node
