"""Unit tests for workflow chat canvas context formatting and live merge."""
from backend.api.workflow_chat.context import (
    format_workflow_for_llm,
    refresh_live_workflow_summary,
    resolve_canvas_from_definition_or_client,
)
from backend.services.workflow_service import _apply_chat_changes_merge


def test_format_workflow_for_llm_lists_nodes_edges_and_connectivity():
    text = format_workflow_for_llm(
        "My Flow",
        "A test",
        [
            {
                "id": "start-1",
                "type": "start",
                "name": "Start",
                "position": {"x": 0, "y": 0},
                "data": {"label": "Start"},
            },
            {
                "id": "agent-1",
                "type": "agent",
                "name": "Agent",
                "position": {"x": 200, "y": 0},
                "data": {"label": "Agent"},
            },
        ],
        [{"id": "e1", "source": "start-1", "target": "agent-1"}],
    )
    assert "My Flow" in text
    assert "start-1" in text and "agent-1" in text
    assert "Isolated nodes" in text


def test_format_empty_workflow():
    text = format_workflow_for_llm("Empty", "", [], [])
    assert "Empty" in text


def test_refresh_live_workflow_summary_applies_pending_changes():
    live = {"text": "initial"}
    snapshot = {
        "name": "W",
        "description": "",
        "nodes": [
            {"id": "a", "type": "start", "name": "A", "position": {"x": 0, "y": 0}, "data": {}},
        ],
        "edges": [],
    }
    changes = {
        "nodes_to_add": [
            {
                "id": "b",
                "type": "end",
                "name": "B",
                "position": {"x": 100, "y": 0},
                "data": {"label": "B"},
            }
        ],
        "nodes_to_update": [],
        "nodes_to_delete": [],
        "edges_to_add": [{"id": "e-a-b", "source": "a", "target": "b"}],
        "edges_to_delete": [],
    }
    refresh_live_workflow_summary(live, snapshot, changes)
    assert "b" in live["text"]
    assert live["text"] != "initial"


def test_refresh_live_workflow_summary_no_op_without_snapshot():
    live = {"text": "x"}
    refresh_live_workflow_summary(live, None, {})
    assert live["text"] == "x"


def test_resolve_canvas_prefers_client_when_valid():
    definition = {"nodes": [{"id": "db"}], "edges": [{"id": "e", "source": "a", "target": "b"}]}
    client = {"nodes": [{"id": "live"}], "edges": []}
    nodes, edges = resolve_canvas_from_definition_or_client(definition, client)
    assert len(nodes) == 1 and nodes[0]["id"] == "live"
    assert edges == []


def test_resolve_canvas_falls_back_to_definition_when_client_invalid():
    definition = {"nodes": [{"id": "db"}], "edges": [{"id": "e", "source": "a", "target": "b"}]}
    assert resolve_canvas_from_definition_or_client(definition, None) == (
        [{"id": "db"}],
        [{"id": "e", "source": "a", "target": "b"}],
    )
    assert resolve_canvas_from_definition_or_client(definition, {"nodes": "bad"}) == (
        [{"id": "db"}],
        [{"id": "e", "source": "a", "target": "b"}],
    )


def test_resolve_canvas_empty_client_lists():
    nodes, edges = resolve_canvas_from_definition_or_client({"nodes": [{"id": "x"}], "edges": [{}]}, {"nodes": [], "edges": []})
    assert nodes == [] and edges == []


def test_apply_chat_changes_merge_dedupes_parallel_edge_adds():
    n, e = _apply_chat_changes_merge(
        [{"id": "a"}, {"id": "b"}],
        [],
        [],
        [],
        [],
        [
            {"id": "e1", "source": "a", "target": "b"},
            {"id": "e2", "source": "a", "target": "b"},
        ],
        [],
    )
    assert len(e) == 1
    assert e[0]["source"] == "a" and e[0]["target"] == "b"
