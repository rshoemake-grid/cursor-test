"""LLM tools and tool response helpers for workflow chat"""
import json
import uuid
from typing import Any, Dict, List, Optional


def tool_response(tool_call: Any, content: Any) -> dict:
    """Build tool message for LLM (DRY). Content: dict (json.dumps) or str."""
    tool_call_id = tool_call.id if hasattr(tool_call, "id") else str(uuid.uuid4())
    if isinstance(content, dict):
        content = json.dumps(content)
    return {"role": "tool", "tool_call_id": tool_call_id, "content": content}


def get_workflow_tools(workflow_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Define tools available to the LLM for workflow manipulation"""
    return [
        {
            "type": "function",
            "function": {
                "name": "add_node",
                "description": "Add a new node to the workflow",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_type": {
                            "type": "string",
                            "enum": ["start", "end", "agent", "condition", "loop", "gcp_bucket", "aws_s3", "gcp_pubsub", "local_filesystem"],
                            "description": "Type of node to add",
                        },
                        "name": {"type": "string", "description": "Name/label for the node"},
                        "description": {"type": "string", "description": "Description of what the node does"},
                        "position": {
                            "type": "object",
                            "properties": {"x": {"type": "number"}, "y": {"type": "number"}},
                            "description": "Position on canvas (x, y coordinates)",
                        },
                        "config": {
                            "type": "object",
                            "description": "Node-specific configuration (agent_config, condition_config, loop_config, input_config)",
                        },
                        "connect_from_node_id": {
                            "type": "string",
                            "description": "Optional: existing node ID. Creates edge FROM that node TO this new node (use with prior nodes' IDs).",
                        },
                        "connect_to_node_id": {
                            "type": "string",
                            "description": "Optional: existing node ID. Creates edge FROM this new node TO that node.",
                        },
                        "connect_from_source_handle": {
                            "type": "string",
                            "description": "When connect_from_node_id is a condition node, set to 'true' or 'false' for that branch.",
                        },
                    },
                    "required": ["node_type", "name"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "update_node",
                "description": "Update an existing node's properties",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_id": {"type": "string", "description": "ID of the node to update"},
                        "name": {"type": "string", "description": "New name for the node"},
                        "description": {"type": "string", "description": "New description"},
                        "config": {"type": "object", "description": "Updated configuration"},
                    },
                    "required": ["node_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "delete_node",
                "description": "Delete a node from the workflow",
                "parameters": {
                    "type": "object",
                    "properties": {"node_id": {"type": "string", "description": "ID of the node to delete"}},
                    "required": ["node_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "clear_workflow_canvas",
                "description": "Remove every node and edge from the workflow so the user can start fresh. Clears any pending add/update/edge changes from the same chat turn, then marks all nodes currently stored for this workflow for deletion. Call save_workflow after if changes should persist.",
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "connect_nodes",
                "description": "Connect two EXISTING nodes with an edge (required if they are not linked yet). New nodes have no edges until you call this or use add_node connect_from_node_id / connect_to_node_id.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "source_node_id": {"type": "string", "description": "ID of the source node"},
                        "target_node_id": {"type": "string", "description": "ID of the target node"},
                        "source_handle": {
                            "type": "string",
                            "description": "Source handle (e.g., 'true', 'false' for condition nodes)",
                        },
                    },
                    "required": ["source_node_id", "target_node_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "disconnect_nodes",
                "description": "Remove a connection between two nodes",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "source_node_id": {"type": "string", "description": "ID of the source node"},
                        "target_node_id": {"type": "string", "description": "ID of the target node"},
                    },
                    "required": ["source_node_id", "target_node_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_workflow_info",
                "description": "Get information about the current workflow (nodes, edges, structure)",
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "save_workflow",
                "description": "Save the current workflow to the database. Use this after making changes to persist them. Optionally update the workflow name or description.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Optional: New name for the workflow"},
                        "description": {"type": "string", "description": "Optional: New description for the workflow"},
                    },
                    "required": [],
                },
            },
        },
    ]
