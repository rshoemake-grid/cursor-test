"""Tests for node_input_config_utils module."""
from backend.utils.node_input_config_utils import get_node_input_config


class TestGetNodeInputConfig:
    def test_from_data_only(self):
        class Node:
            data = {"input_config": {"mode": "read"}}
            input_config = None
        assert get_node_input_config(Node()) == {"mode": "read"}

    def test_from_top_level_only(self):
        class Node:
            data = None
            input_config = {"mode": "write"}
        assert get_node_input_config(Node()) == {"mode": "write"}

    def test_merge_top_level_overrides_data(self):
        class Node:
            data = {"input_config": {"mode": "read", "file_path": "/a"}}
            input_config = {"mode": "write"}
        result = get_node_input_config(Node())
        assert result["mode"] == "write"
        assert result["file_path"] == "/a"
