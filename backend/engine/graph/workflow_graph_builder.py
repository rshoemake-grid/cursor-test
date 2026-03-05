"""Build adjacency and in-degree maps from workflow definition (SRP: graph building only)"""
from typing import Dict, List, Tuple

from ...models.schemas import WorkflowDefinition, NodeType
from ...utils.logger import get_logger

logger = get_logger(__name__)


def build_graph(workflow: WorkflowDefinition) -> Tuple[Dict[str, List[str]], Dict[str, int]]:
    """
    Build adjacency map and in-degree map, filtering out edges to deleted nodes and invalid nodes.
    Returns (adjacency, in_degree).
    """
    # Filter out nodes that don't have required configuration
    valid_nodes = []
    for node in workflow.nodes:
        if node.type == NodeType.CONDITION:
            if not node.condition_config or not node.condition_config.field:
                logger.warning(f"Skipping condition node {node.id} - missing required field configuration")
                continue
        valid_nodes.append(node)

    workflow.nodes = valid_nodes
    valid_node_ids = {node.id for node in workflow.nodes}

    adjacency: Dict[str, List[str]] = {node.id: [] for node in workflow.nodes}
    in_degree: Dict[str, int] = {node.id: 0 for node in workflow.nodes}

    valid_edges = []
    for edge in workflow.edges:
        if edge.source not in valid_node_ids:
            logger.warning(f"Skipping edge {edge.id} - source node {edge.source} is invalid or missing")
            continue
        if edge.target not in valid_node_ids:
            logger.warning(f"Skipping edge {edge.id} - target node {edge.target} is invalid or missing")
            continue

        if edge.source in adjacency and edge.target in in_degree:
            adjacency[edge.source].append(edge.target)
            in_degree[edge.target] += 1
            valid_edges.append(edge)

    workflow.edges = valid_edges
    return adjacency, in_degree
