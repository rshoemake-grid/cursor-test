"""Tool handlers for workflow chat - OCP: register new tools without editing route dispatch."""
import uuid
from typing import Any, Callable, Dict, List, Optional

from backend.utils.logger import get_logger
from backend.exceptions import WorkflowForbiddenError
from backend.services.workflow_service import _check_workflow_ownership

from .graph_utils import isolated_node_summaries
from .models import NODE_CONFIG_KEYS
from .tools import tool_response

logger = get_logger(__name__)


async def handle_add_node(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
) -> Any:
    """Handle add_node tool call."""
    if "node_type" not in function_args:
        return tool_response(tool_call, {"status": "error", "message": "node_type is required"})
    node_id = f"{function_args['node_type']}-{uuid.uuid4().hex[:12]}"
    node_name = function_args.get("name") or f"{function_args['node_type']} Node"
    new_node = {
        "id": node_id,
        "type": function_args["node_type"],
        "name": node_name,
        "description": function_args.get("description", ""),
        "position": function_args.get("position", {"x": 100, "y": 100}),
        "data": {"label": node_name, "name": node_name, "description": function_args.get("description", "")},
    }
    if function_args.get("config"):
        config_key = NODE_CONFIG_KEYS.get(function_args["node_type"])
        if config_key:
            new_node[config_key] = function_args["config"]
            new_node["data"][config_key] = function_args["config"]
    workflow_changes["nodes_to_add"].append(new_node)

    response_body: Dict[str, Any] = {"status": "success", "action": "added_node", "node_id": node_id}
    edges_added_ids: List[str] = []

    connect_from = (function_args.get("connect_from_node_id") or "").strip()
    connect_to = (function_args.get("connect_to_node_id") or "").strip()
    source_handle = function_args.get("connect_from_source_handle")

    if connect_from:
        eid = f"e-{connect_from}-{node_id}"
        edge: Dict[str, Any] = {
            "id": eid,
            "source": connect_from,
            "target": node_id,
        }
        if source_handle:
            edge["sourceHandle"] = source_handle
        workflow_changes["edges_to_add"].append(edge)
        edges_added_ids.append(eid)

    if connect_to:
        eid = f"e-{node_id}-{connect_to}"
        edge_out: Dict[str, Any] = {
            "id": eid,
            "source": node_id,
            "target": connect_to,
        }
        workflow_changes["edges_to_add"].append(edge_out)
        edges_added_ids.append(eid)

    if edges_added_ids:
        response_body["edges_added"] = edges_added_ids

    return tool_response(tool_call, response_body)


async def handle_update_node(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
) -> Any:
    """Handle update_node tool call."""
    workflow_changes["nodes_to_update"].append({
        "node_id": function_args["node_id"],
        "updates": {
            "name": function_args.get("name"),
            "description": function_args.get("description"),
            **function_args.get("config", {}),
        },
    })
    return tool_response(tool_call, {"status": "success", "action": "updated_node", "node_id": function_args["node_id"]})


async def handle_delete_node(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
) -> Any:
    """Handle delete_node tool call."""
    if "node_id" not in function_args:
        return tool_response(tool_call, {"status": "error", "message": "node_id is required"})
    workflow_changes["nodes_to_delete"].append(function_args["node_id"])
    return tool_response(tool_call, {"status": "success", "action": "deleted_node", "node_id": function_args["node_id"]})


async def handle_delete_nodes(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
) -> Any:
    """Delete multiple nodes in one tool call."""
    raw_ids = function_args.get("node_ids")
    if not raw_ids or not isinstance(raw_ids, list):
        return tool_response(tool_call, {"status": "error", "message": "node_ids must be a non-empty array of strings"})
    deleted: List[str] = []
    for nid in raw_ids:
        if nid is None:
            continue
        s = str(nid).strip()
        if not s:
            continue
        workflow_changes["nodes_to_delete"].append(s)
        deleted.append(s)
    if not deleted:
        return tool_response(tool_call, {"status": "error", "message": "No valid node IDs to delete"})
    return tool_response(
        tool_call,
        {"status": "success", "action": "deleted_nodes", "node_ids": deleted, "count": len(deleted)},
    )


async def handle_select_nodes(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
) -> Any:
    """Highlight nodes on the user's canvas (multi-select). Does not modify the graph."""
    raw_ids = function_args.get("node_ids")
    if not raw_ids or not isinstance(raw_ids, list):
        return tool_response(tool_call, {"status": "error", "message": "node_ids must be a non-empty array of strings"})
    seen: set[str] = set()
    ordered: List[str] = []
    for nid in raw_ids:
        if nid is None:
            continue
        s = str(nid).strip()
        if not s or s in seen:
            continue
        seen.add(s)
        ordered.append(s)
    if not ordered:
        return tool_response(tool_call, {"status": "error", "message": "No valid node IDs to select"})
    workflow_changes["nodes_to_select"] = ordered
    return tool_response(
        tool_call,
        {"status": "success", "action": "selected_nodes", "node_ids": ordered, "count": len(ordered)},
    )


async def handle_list_isolated_nodes(
    tool_call: Any,
    function_args: dict,
    workflow_service: Any,
    workflow_id: Optional[str],
    user_id: Optional[str] = None,
) -> Any:
    """Nodes with no edges (neither source nor target). Useful before bulk delete."""
    _ = function_args
    if not workflow_id:
        return tool_response(
            tool_call,
            {"status": "error", "message": "No workflow loaded; save the workflow first."},
        )
    try:
        workflow = await workflow_service.get_workflow(workflow_id)
    except Exception as load_err:
        return tool_response(tool_call, {"status": "error", "message": f"Could not load workflow: {load_err}"})
    try:
        _check_workflow_ownership(workflow, user_id, "update")
    except WorkflowForbiddenError:
        return tool_response(tool_call, {"status": "error", "message": "You are not allowed to access this workflow."})

    nodes = (workflow.definition or {}).get("nodes") or []
    edges = (workflow.definition or {}).get("edges") or []
    isolated = isolated_node_summaries(nodes, edges)
    return tool_response(
        tool_call,
        {
            "status": "success",
            "isolated_nodes": isolated,
            "count": len(isolated),
            "hint": "These nodes have zero connections. Use select_nodes to highlight them, then delete_nodes with the same IDs to remove them (then save_workflow if needed).",
        },
    )


async def handle_clear_workflow_canvas(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
    workflow_service: Any,
    workflow_id: Optional[str],
    user_id: Optional[str] = None,
) -> Any:
    """Remove all nodes from the stored workflow definition for this chat session."""
    if not workflow_id:
        return tool_response(
            tool_call,
            {
                "status": "error",
                "message": "No workflow is loaded for this chat. Save the workflow first, or clear the canvas using the Clear canvas control in the chat panel.",
            },
        )
    try:
        workflow = await workflow_service.get_workflow(workflow_id)
    except Exception as load_err:
        logger.warning("clear_workflow_canvas: load failed: %s", load_err, exc_info=True)
        return tool_response(
            tool_call,
            {"status": "error", "message": f"Could not load workflow: {load_err}"},
        )
    try:
        _check_workflow_ownership(workflow, user_id, "update")
    except WorkflowForbiddenError:
        return tool_response(
            tool_call,
            {"status": "error", "message": "You are not allowed to modify this workflow."},
        )

    nodes = (workflow.definition or {}).get("nodes") or []
    node_ids = [n["id"] for n in nodes if n.get("id")]

    workflow_changes["nodes_to_add"].clear()
    workflow_changes["nodes_to_update"].clear()
    workflow_changes["edges_to_add"].clear()
    workflow_changes["edges_to_delete"].clear()
    workflow_changes["nodes_to_delete"].clear()
    workflow_changes.setdefault("nodes_to_select", []).clear()
    workflow_changes["nodes_to_delete"].extend(node_ids)

    return tool_response(
        tool_call,
        {
            "status": "success",
            "action": "cleared_canvas",
            "nodes_removed": len(node_ids),
            "node_ids": node_ids,
        },
    )


async def handle_connect_nodes(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
) -> Any:
    """Handle connect_nodes tool call."""
    if "source_node_id" not in function_args or "target_node_id" not in function_args:
        return tool_response(tool_call, {"status": "error", "message": "source_node_id and target_node_id are required"})
    edge_id = f"e-{function_args['source_node_id']}-{function_args['target_node_id']}"
    workflow_changes["edges_to_add"].append({
        "id": edge_id,
        "source": function_args["source_node_id"],
        "target": function_args["target_node_id"],
        "sourceHandle": function_args.get("source_handle"),
    })
    return tool_response(tool_call, {"status": "success", "action": "connected_nodes", "edge_id": edge_id})


async def handle_disconnect_nodes(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
) -> Any:
    """Handle disconnect_nodes tool call."""
    if "source_node_id" not in function_args or "target_node_id" not in function_args:
        return tool_response(tool_call, {"status": "error", "message": "source_node_id and target_node_id are required"})
    workflow_changes["edges_to_delete"].append({
        "source": function_args["source_node_id"],
        "target": function_args["target_node_id"],
    })
    return tool_response(tool_call, {"status": "success", "action": "disconnected_nodes"})


async def handle_get_workflow_info(
    tool_call: Any,
    function_args: dict,
    workflow_context: str,
) -> Any:
    """Handle get_workflow_info tool call."""
    return tool_response(tool_call, workflow_context)


async def handle_save_workflow(
    tool_call: Any,
    function_args: dict,
    workflow_id: Optional[str],
    workflow_changes: Dict[str, List[Any]],
    saved_changes: Dict[str, List[Any]],
    workflow_service: Any,
    user_id: Optional[str] = None,
) -> Any:
    """Handle save_workflow tool call. Persists via WorkflowService."""
    if not workflow_id:
        return tool_response(tool_call, {"status": "error", "message": "No workflow ID provided. Cannot save workflow."})
    try:
        result = await workflow_service.apply_chat_changes(
            workflow_id=workflow_id,
            nodes_to_add=workflow_changes["nodes_to_add"],
            nodes_to_update=workflow_changes["nodes_to_update"],
            nodes_to_delete=workflow_changes["nodes_to_delete"],
            edges_to_add=workflow_changes["edges_to_add"],
            edges_to_delete=workflow_changes["edges_to_delete"],
            name=function_args.get("name") or None,
            description=function_args.get("description") if "description" in function_args else None,
            user_id=user_id,
        )
        saved_changes["nodes_to_add"].extend(workflow_changes["nodes_to_add"])
        saved_changes["nodes_to_update"].extend(workflow_changes["nodes_to_update"])
        saved_changes["nodes_to_delete"].extend(workflow_changes["nodes_to_delete"])
        saved_changes["edges_to_add"].extend(workflow_changes["edges_to_add"])
        saved_changes["edges_to_delete"].extend(workflow_changes["edges_to_delete"])
        workflow_changes["nodes_to_add"].clear()
        workflow_changes["nodes_to_update"].clear()
        workflow_changes["nodes_to_delete"].clear()
        workflow_changes["edges_to_add"].clear()
        workflow_changes["edges_to_delete"].clear()
        return tool_response(tool_call, {
            "status": "success",
            "action": "saved_workflow",
            "workflow_id": workflow_id,
            "nodes_count": result["nodes_count"],
            "edges_count": result["edges_count"],
        })
    except Exception as save_error:
        logger.error(f"Error saving workflow: {save_error}", exc_info=True)
        return tool_response(tool_call, {"status": "error", "message": f"Error saving workflow: {str(save_error)}"})


def get_tool_handlers(
    workflow_changes: Dict[str, List[Any]],
    saved_changes: Dict[str, List[Any]],
    workflow_context: str,
    workflow_id: Optional[str],
    workflow_service: Any,
    user_id: Optional[str] = None,
) -> Dict[str, Callable]:
    """Build tool handler registry with context."""
    return {
        "add_node": lambda tc, fa: handle_add_node(tc, fa, workflow_changes),
        "update_node": lambda tc, fa: handle_update_node(tc, fa, workflow_changes),
        "delete_node": lambda tc, fa: handle_delete_node(tc, fa, workflow_changes),
        "delete_nodes": lambda tc, fa: handle_delete_nodes(tc, fa, workflow_changes),
        "select_nodes": lambda tc, fa: handle_select_nodes(tc, fa, workflow_changes),
        "list_isolated_nodes": lambda tc, fa: handle_list_isolated_nodes(tc, fa, workflow_service, workflow_id, user_id),
        "clear_workflow_canvas": lambda tc, fa: handle_clear_workflow_canvas(
            tc, fa, workflow_changes, workflow_service, workflow_id, user_id
        ),
        "connect_nodes": lambda tc, fa: handle_connect_nodes(tc, fa, workflow_changes),
        "disconnect_nodes": lambda tc, fa: handle_disconnect_nodes(tc, fa, workflow_changes),
        "get_workflow_info": lambda tc, fa: handle_get_workflow_info(tc, fa, workflow_context),
        "save_workflow": lambda tc, fa: handle_save_workflow(
            tc, fa, workflow_id, workflow_changes, saved_changes, workflow_service, user_id
        ),
    }
