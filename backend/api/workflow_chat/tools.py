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
                "name": "connect_nodes",
                "description": "Connect two nodes with an edge",
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
                "description": (
                    "Get the current workflow as shown on the canvas: all nodes (with positions), "
                    "all edges (connections), and a short connectivity summary (isolated nodes, "
                    "nodes missing incoming/outgoing edges). Reflects pending tool edits in this "
                    "request before save. The system context is updated the same way after each tool call."
                ),
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
