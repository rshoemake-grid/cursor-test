"""Tool handlers for workflow chat - OCP: register new tools without editing route dispatch."""
import uuid
from typing import Any, Callable, Dict, List, Optional

from backend.utils.logger import get_logger
from backend.services.workflow_service import _apply_chat_changes_merge

from .models import NODE_CONFIG_KEYS
from .tools import tool_response

logger = get_logger(__name__)


async def handle_add_node(
    tool_call: Any,
    function_args: dict,
    workflow_changes: Dict[str, List[Any]],
    workflow_snapshot: Optional[dict],
) -> Any:
    """Handle add_node tool call."""
    if "node_type" not in function_args:
        return tool_response(tool_call, {"status": "error", "message": "node_type is required"})
    node_type = function_args["node_type"]
    if workflow_snapshot is not None and node_type in ("start", "end"):
        merged_nodes, _ = _apply_chat_changes_merge(
            list(workflow_snapshot["nodes"]),
            list(workflow_snapshot["edges"]),
            workflow_changes["nodes_to_add"],
            workflow_changes["nodes_to_update"],
            workflow_changes["nodes_to_delete"],
            workflow_changes["edges_to_add"],
            workflow_changes["edges_to_delete"],
        )
        for n in merged_nodes:
            if n.get("type") == node_type:
                nid = n.get("id", "?")
                return tool_response(
                    tool_call,
                    {
                        "status": "error",
                        "message": (
                            f"A {node_type} node already exists on the canvas (id={nid}). "
                            "Use connect_nodes or update_node instead of add_node."
                        ),
                    },
                )
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
    return tool_response(tool_call, {"status": "success", "action": "added_node", "node_id": node_id})


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
    live_workflow_summary: Dict[str, str],
) -> Any:
    """Handle get_workflow_info tool call."""
    return tool_response(tool_call, live_workflow_summary["text"])


async def handle_save_workflow(
    tool_call: Any,
    function_args: dict,
    workflow_id: Optional[str],
    workflow_changes: Dict[str, List[Any]],
    saved_changes: Dict[str, List[Any]],
    workflow_service: Any,
    workflow_snapshot: Optional[dict] = None,
    user_id: Optional[str] = None,
) -> Any:
    """Handle save_workflow tool call. Persists via WorkflowService."""
    if not workflow_id:
        return tool_response(tool_call, {"status": "error", "message": "No workflow ID provided. Cannot save workflow."})
    merged_nodes: Optional[List[dict]] = None
    merged_edges: Optional[List[dict]] = None
    if workflow_snapshot is not None:
        merged_nodes, merged_edges = _apply_chat_changes_merge(
            list(workflow_snapshot["nodes"]),
            list(workflow_snapshot["edges"]),
            workflow_changes["nodes_to_add"],
            workflow_changes["nodes_to_update"],
            workflow_changes["nodes_to_delete"],
            workflow_changes["edges_to_add"],
            workflow_changes["edges_to_delete"],
        )
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
        if workflow_snapshot is not None and merged_nodes is not None and merged_edges is not None:
            workflow_snapshot["nodes"] = merged_nodes
            workflow_snapshot["edges"] = merged_edges
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
    live_workflow_summary: Dict[str, str],
    workflow_snapshot: Optional[dict],
    workflow_id: Optional[str],
    workflow_service: Any,
    user_id: Optional[str] = None,
) -> Dict[str, Callable]:
    """Build tool handler registry with context."""
    return {
        "add_node": lambda tc, fa: handle_add_node(tc, fa, workflow_changes, workflow_snapshot),
        "update_node": lambda tc, fa: handle_update_node(tc, fa, workflow_changes),
        "delete_node": lambda tc, fa: handle_delete_node(tc, fa, workflow_changes),
        "connect_nodes": lambda tc, fa: handle_connect_nodes(tc, fa, workflow_changes),
        "disconnect_nodes": lambda tc, fa: handle_disconnect_nodes(tc, fa, workflow_changes),
        "get_workflow_info": lambda tc, fa: handle_get_workflow_info(tc, fa, live_workflow_summary),
        "save_workflow": lambda tc, fa: handle_save_workflow(
            tc, fa, workflow_id, workflow_changes, saved_changes, workflow_service, workflow_snapshot, user_id
        ),
    }
