"""Tests for node_input_utils module."""
import pytest

from backend.models.schemas import Node, InputMapping
from backend.utils.node_input_utils import prepare_node_inputs, get_previous_node_output


class FakeNodeState:
    def __init__(self, output):
        self.output = output


class TestPrepareNodeInputs:
    def test_empty_inputs_when_no_mappings(self):
        node = Node(id="n1", type="agent", inputs=[])
        result = prepare_node_inputs(node, {}, {}, strict_variables=False)
        assert result == {}

    def test_from_source_node(self):
        node = Node(
            id="n1",
            type="agent",
            inputs=[InputMapping(name="data", source_node="prev", source_field="output")],
        )
        node_states = {"prev": FakeNodeState("hello")}
        result = prepare_node_inputs(node, node_states, {})
        assert result == {"data": "hello"}

    def test_strict_variables_raises_when_missing(self):
        node = Node(
            id="n1",
            type="agent",
            inputs=[InputMapping(name="msg", source_node=None, source_field="missing")],
        )
        with pytest.raises(ValueError, match="not available"):
            prepare_node_inputs(node, {}, {}, strict_variables=True)

    def test_non_strict_skips_missing_variable(self):
        node = Node(
            id="n1",
            type="agent",
            inputs=[InputMapping(name="msg", source_node=None, source_field="missing")],
        )
        result = prepare_node_inputs(node, {}, {}, strict_variables=False)
        assert result == {}
