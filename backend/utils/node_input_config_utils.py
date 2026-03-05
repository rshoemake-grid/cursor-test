"""
Node input_config extraction - DRY helper for storage nodes.
Merges node.data.input_config with top-level node.input_config.
"""
from typing import Any, Dict


def get_node_input_config(node: Any) -> Dict[str, Any]:
    """
    Extract and merge input_config from node.
    Prioritizes node.data.input_config (UI storage), then top-level node.input_config.

    Args:
        node: Node object with optional data and input_config

    Returns:
        Merged input_config dict (never None)
    """
    input_config: Dict[str, Any] = {}

    if hasattr(node, "data") and node.data and isinstance(node.data, dict):
        data_input_config = node.data.get("input_config")
        if data_input_config and isinstance(data_input_config, dict):
            input_config = data_input_config.copy()

    if hasattr(node, "input_config") and node.input_config:
        top_input_config = node.input_config if isinstance(node.input_config, dict) else {}
        for key, value in top_input_config.items():
            if value and (not isinstance(value, str) or value.strip()):
                input_config[key] = value
            elif key not in input_config:
                input_config[key] = value

    return input_config if isinstance(input_config, dict) else {}
