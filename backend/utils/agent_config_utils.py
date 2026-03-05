"""
Agent config extraction utilities - DRY helper for node config extraction.
Agents often need to get config from either node.agent_config, node.condition_config,
node.loop_config, or node.data.<config_key>.
"""
from typing import Any, Optional, TypeVar

T = TypeVar("T")


def get_node_config(
    node: Any,
    config_key: str,
    config_class: Optional[type] = None,
) -> Optional[Any]:
    """
    Extract config from node - checks top-level attribute and node.data.

    Args:
        node: Node object
        config_key: Key name (e.g. 'agent_config', 'condition_config', 'loop_config')
        config_class: Optional Pydantic/model class to instantiate if config is dict

    Returns:
        Config object or None
    """
    config = getattr(node, config_key, None)
    if not config and hasattr(node, "data") and node.data and isinstance(node.data, dict):
        config = node.data.get(config_key)

    if config and config_class and isinstance(config, dict):
        return config_class(**config)

    return config
