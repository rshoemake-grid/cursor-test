"""
Workflow reconstruction utilities.
Extracted to eliminate code duplication (DRY principle).
"""
import json
from typing import Dict, List, Optional
from fastapi import HTTPException
from pydantic import ValidationError

from ..models.schemas import (
    Node,
    Edge,
    WorkflowDefinition,
    AgentConfig,
    ConditionConfig,
    LoopConfig
)
from ..utils.logger import get_logger

logger = get_logger(__name__)

# Constants - DRY: Single source of truth for config mappings
NODE_CONFIG_MAPPING = {
    'loop': 'loop_config',
    'condition': 'condition_config',
    'agent': 'agent_config'
}

# Constants - DRY: Single source of truth for default values
UNKNOWN_NODE_ID_PREFIX = "unknown"


def extract_node_configs_from_data(node_data: dict) -> dict:
    """
    Extract configs from data object if missing at top level (DRY).
    
    This handles the common pattern where React Flow stores configs
    in the 'data' object instead of at the top level of the node.
    
    Args:
        node_data: Node dictionary that may have configs in 'data' object
        
    Returns:
        Modified node_data with configs extracted to top level
    """
    if "data" not in node_data or not isinstance(node_data.get("data"), dict):
        return node_data
    
    data_obj = node_data.get("data")
    node_type = node_data.get('type')
    
    config_key = NODE_CONFIG_MAPPING.get(node_type)
    if config_key:
        # Extract config from data object if missing at top level
        if not node_data.get(config_key) and data_obj.get(config_key):
            logger.debug(
                f"Extracting {config_key} from data object for node {node_data.get('id', 'unknown')}"
            )
            node_data[config_key] = data_obj[config_key]
    
    return node_data


def log_missing_configs(node_data: dict, node_id: str) -> None:
    """
    Log debug messages for missing optional configs (DRY).
    
    Args:
        node_data: Node dictionary
        node_id: Node identifier for logging
    """
    node_type = node_data.get('type')
    config_key = NODE_CONFIG_MAPPING.get(node_type)
    
    if config_key and not node_data.get(config_key):
        logger.debug(
            f"{node_type.capitalize()} node {node_id} missing {config_key} after extraction attempt"
        )


def _build_node_error_message(
    index: int,
    node_id: str,
    node_type: str,
    error_detail: str
) -> str:
    """
    Build error message for node reconstruction failures (DRY).
    
    Args:
        index: Node index
        node_id: Node identifier
        node_type: Node type
        error_detail: Error detail string
        
    Returns:
        Formatted error message
    """
    return f"Invalid node data at index {index} (id={node_id}, type={node_type}): {error_detail}"


def _log_node_reconstruction_error(
    index: int,
    node_id: str,
    node_type: str,
    error_detail: str,
    node_data: dict
) -> None:
    """
    Log node reconstruction error (DRY - extracted logging).
    
    Args:
        index: Node index
        node_id: Node identifier
        node_type: Node type
        error_detail: Error detail string
        node_data: Node data dictionary
    """
    logger.error(
        f"Error reconstructing node {index} (id={node_id}, type={node_type}): {error_detail}, "
        f"node data: {json.dumps(node_data, indent=2, default=str)}",
        exc_info=True
    )


def _extract_error_detail(exception: Exception) -> str:
    """
    Extract error detail from exception (DRY - consolidated error detail extraction).
    
    Args:
        exception: Exception object
        
    Returns:
        Error detail string
    """
    if isinstance(exception, ValidationError):
        return f"Validation error: {exception.errors()}"
    return str(exception)


def reconstruct_node(node_data: dict, index: int) -> Node:
    """
    Reconstruct a single Node from dictionary data (DRY - reusable).
    
    Refactored to consolidate error handling (DRY).
    
    Args:
        node_data: Node dictionary data
        index: Index of node in list (for error messages)
        
    Returns:
        Reconstructed Node object
        
    Raises:
        HTTPException: If node data is invalid
    """
    node_id = node_data.get('id', f'{UNKNOWN_NODE_ID_PREFIX}-{index}')
    node_type = node_data.get('type', 'unknown')
    
    logger.debug(f"Node {index}: id={node_id}, type={node_type}")
    
    # Extract configs from data object if needed
    node_data = extract_node_configs_from_data(node_data)
    
    # Log missing configs (informational only - configs are optional)
    log_missing_configs(node_data, node_id)
    
    try:
        node = Node(**node_data)
        logger.debug(f"Successfully reconstructed node {index}: {node.id} ({node.type})")
        return node
    except HTTPException:
        # Re-raise HTTP exceptions (from reconstruct_workflow_definition, etc.)
        raise
    except Exception as e:
        error_detail = _extract_error_detail(e)
        _log_node_reconstruction_error(index, node_id, node_type, error_detail, node_data)
        raise HTTPException(
            status_code=422,
            detail=_build_node_error_message(index, node_id, node_type, error_detail)
        )


def reconstruct_nodes(nodes_data: List[dict]) -> List[Node]:
    """
    Reconstruct Node objects from dictionary data (DRY - single source of truth).
    
    Args:
        nodes_data: List of node dictionaries
        
    Returns:
        List of reconstructed Node objects
        
    Raises:
        HTTPException: If any node data is invalid
    """
    nodes = []
    all_node_data = nodes_data if isinstance(nodes_data, list) else []
    
    logger.debug(f"Found {len(all_node_data)} nodes in workflow definition")
    
    for i, node_data in enumerate(all_node_data):
        node = reconstruct_node(node_data, i)
        nodes.append(node)
    
    logger.info(f"Successfully reconstructed {len(nodes)} nodes")
    return nodes


def reconstruct_workflow_definition(definition: dict) -> WorkflowDefinition:
    """
    Reconstruct WorkflowDefinition from database JSON (DRY - single source of truth).
    
    Args:
        definition: Workflow definition dictionary from database
        
    Returns:
        Reconstructed WorkflowDefinition object
        
    Raises:
        HTTPException: If workflow definition is invalid
    """
    nodes = reconstruct_nodes(definition.get("nodes", []))
    edges = [Edge(**edge_data) for edge_data in definition.get("edges", [])]
    
    return WorkflowDefinition(
        id=definition.get("id"),
        name=definition.get("name", ""),
        description=definition.get("description"),
        nodes=nodes,
        edges=edges,
        variables=definition.get("variables", {})
    )
