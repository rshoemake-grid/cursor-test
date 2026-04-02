"""Workflow context retrieval and canvas summary for the LLM (DB + live tool edits)."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import WorkflowDB
from backend.services.workflow_service import _apply_chat_changes_merge

if TYPE_CHECKING:
    from backend.services.workflow_ownership_service import WorkflowOwnershipService


def _node_display_name(node: dict) -> str:
    return (
        node.get("name")
        or node.get("data", {}).get("name")
        or node.get("data", {}).get("label")
        or node.get("id", "unknown")
    )


def _connectivity_lines(nodes: List[dict], edges: List[dict]) -> List[str]:
    node_ids = [n.get("id") for n in nodes if n.get("id")]
    incoming = {nid: 0 for nid in node_ids}
    outgoing = {nid: 0 for nid in node_ids}
    for edge in edges:
        s, t = edge.get("source"), edge.get("target")
        if s in outgoing:
            outgoing[s] += 1
        if t in incoming:
            incoming[t] += 1
    lines: List[str] = []
    lines.append(f"Summary: {len(node_ids)} node(s) on canvas, {len(edges)} edge(s) (connections between nodes).")
    if not node_ids:
        lines.append("Canvas is empty — there are no nodes yet.")
        return lines
    if len(edges) == 0:
        lines.append("There are no edges yet — nodes exist but nothing is wired together.")
    isolated = [nid for nid in node_ids if incoming[nid] == 0 and outgoing[nid] == 0]
    if isolated:
        lines.append(f"Isolated nodes (no connections at all): {', '.join(isolated)}")
    else:
        lines.append("Isolated nodes (no connections at all): none")
    no_in = [nid for nid in node_ids if incoming[nid] == 0]
    no_out = [nid for nid in node_ids if outgoing[nid] == 0]
    lines.append(f"Nodes with no incoming edge: {', '.join(no_in)}")
    lines.append(f"Nodes with no outgoing edge: {', '.join(no_out)}")
    return lines


def resolve_canvas_from_definition_or_client(
    definition: dict,
    client_canvas: Optional[dict],
) -> Tuple[List[dict], List[dict]]:
    """
    Prefer the client's live canvas when both nodes and edges keys are present as lists
    (matches what the UI sends); otherwise use the persisted workflow definition.
    """
    if client_canvas is not None:
        nodes_raw = client_canvas.get("nodes")
        edges_raw = client_canvas.get("edges")
        if isinstance(nodes_raw, list) and isinstance(edges_raw, list):
            return list(nodes_raw), list(edges_raw)
    defn = definition or {}
    return list(defn.get("nodes") or []), list(defn.get("edges") or [])


def format_workflow_for_llm(
    name: str,
    description: str,
    nodes: List[dict],
    edges: List[dict],
) -> str:
    """
    Human-readable canvas state for the model: nodes (with positions), edges, connectivity hints.
    """
    lines: List[str] = []
    lines.append(
        "=== Workflow on canvas ===\n"
        "This describes what is on the workflow canvas. When you use add_node / connect_nodes / etc., "
        "the picture below updates to include those pending edits in this same request (before save_workflow)."
    )
    lines.append(f"Name: {name}")
    lines.append(f"Description: {description or 'None'}")
    lines.append("")
    lines.extend(_connectivity_lines(nodes, edges))
    lines.append("")
    lines.append(f"Nodes ({len(nodes)}):")
    for node in nodes:
        node_id = node.get("id", "unknown")
        node_type = node.get("type", "unknown")
        label = _node_display_name(node)
        pos = node.get("position") or {}
        px = pos.get("x", "?")
        py = pos.get("y", "?")
        lines.append(f"  - id={node_id} | type={node_type} | label={label} | canvas position (x,y)=({px}, {py})")
    lines.append("")
    lines.append(f"Edges / connections ({len(edges)}):")
    if not edges:
        lines.append("  (none)")
    else:
        for edge in edges:
            eid = edge.get("id", "?")
            src = edge.get("source", "?")
            tgt = edge.get("target", "?")
            handle = edge.get("sourceHandle")
            handle_part = f" | sourceHandle={handle}" if handle else ""
            lines.append(f"  - {eid}: {src} -> {tgt}{handle_part}")
    return "\n".join(lines)


def refresh_live_workflow_summary(
    live: Dict[str, str],
    snapshot: Optional[Dict[str, Any]],
    workflow_changes: Dict[str, List[Any]],
) -> None:
    """Merge pending tool changes into snapshot and write formatted canvas text to live['text']."""
    if snapshot is None:
        return
    nodes, edges = _apply_chat_changes_merge(
        list(snapshot["nodes"]),
        list(snapshot["edges"]),
        workflow_changes["nodes_to_add"],
        workflow_changes["nodes_to_update"],
        workflow_changes["nodes_to_delete"],
        workflow_changes["edges_to_add"],
        workflow_changes["edges_to_delete"],
    )
    live["text"] = format_workflow_for_llm(
        snapshot["name"],
        snapshot.get("description") or "",
        nodes,
        edges,
    )


async def get_workflow_context(
    db: AsyncSession,
    workflow_id: Optional[str],
    user_id: Optional[str] = None,
    ownership_service: Optional["WorkflowOwnershipService"] = None,
    client_canvas: Optional[dict] = None,
) -> Tuple[str, Optional[dict]]:
    """
    Load workflow from DB and return (formatted_context_string, snapshot_for_live_merge).
    snapshot is None when there is no workflow row to merge against (new/unsaved chat).
    client_canvas: optional live graph from the UI so the agent matches unsaved canvas state.
    """
    if not workflow_id:
        if client_canvas is not None:
            nodes, edges = resolve_canvas_from_definition_or_client({}, client_canvas)
            snapshot = {
                "name": "Untitled",
                "description": "",
                "nodes": nodes,
                "edges": edges,
            }
            text = format_workflow_for_llm(snapshot["name"], snapshot["description"], nodes, edges)
            return text, snapshot
        return "No workflow loaded. You can create a new workflow.", None

    result = await db.execute(select(WorkflowDB).where(WorkflowDB.id == workflow_id))
    workflow = result.scalar_one_or_none()

    if not workflow:
        return f"Workflow {workflow_id} not found.", None

    if ownership_service:
        await ownership_service.assert_can_read_or_share(workflow, user_id)

    definition = workflow.definition or {}
    nodes, edges = resolve_canvas_from_definition_or_client(definition, client_canvas)

    snapshot = {
        "name": workflow.name,
        "description": workflow.description or "",
        "nodes": nodes,
        "edges": edges,
    }
    text = format_workflow_for_llm(workflow.name, snapshot["description"], nodes, edges)
    return text, snapshot
