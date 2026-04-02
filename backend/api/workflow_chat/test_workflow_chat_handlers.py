"""Tests for workflow chat tool handlers."""
import json
from unittest.mock import MagicMock

import pytest

from backend.api.workflow_chat.handlers import handle_add_node


@pytest.mark.asyncio
async def test_add_node_rejects_second_start_when_snapshot_has_start():
    tool_call = MagicMock()
    tool_call.id = "tc-1"
    changes = {
        "nodes_to_add": [],
        "nodes_to_update": [],
        "nodes_to_delete": [],
        "edges_to_add": [],
        "edges_to_delete": [],
    }
    snapshot = {
        "nodes": [{"id": "start-abc", "type": "start", "name": "Start"}],
        "edges": [],
    }
    msg = await handle_add_node(tool_call, {"node_type": "start", "name": "Another"}, changes, snapshot)
    payload = json.loads(msg["content"])
    assert payload["status"] == "error"
    assert "already exists" in payload["message"]
    assert changes["nodes_to_add"] == []


@pytest.mark.asyncio
async def test_add_node_allows_start_when_no_snapshot():
    tool_call = MagicMock()
    tool_call.id = "tc-2"
    changes = {
        "nodes_to_add": [],
        "nodes_to_update": [],
        "nodes_to_delete": [],
        "edges_to_add": [],
        "edges_to_delete": [],
    }
    msg = await handle_add_node(tool_call, {"node_type": "start"}, changes, None)
    payload = json.loads(msg["content"])
    assert payload["status"] == "success"
    assert len(changes["nodes_to_add"]) == 1
