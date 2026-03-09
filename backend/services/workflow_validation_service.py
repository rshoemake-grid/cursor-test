"""
Workflow validation service (SRP).
Extracts validation logic from debug routes.
"""
from typing import Dict, Any, List


def validate_workflow_definition(
    workflow_id: str,
    definition: dict,
) -> Dict[str, Any]:
    """
    Validate a workflow definition for potential issues.
    Returns dict with workflow_id, valid, issues, warnings, node_count, edge_count.
    """
    nodes = definition.get("nodes", [])
    edges = definition.get("edges", [])

    issues: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    # Check for nodes without edges
    node_ids = {node["id"] for node in nodes}
    connected_nodes = set()
    for edge in edges:
        connected_nodes.add(edge["source"])
        connected_nodes.add(edge["target"])

    orphan_nodes = node_ids - connected_nodes
    if orphan_nodes:
        warnings.append({
            "type": "orphan_nodes",
            "message": f"Found {len(orphan_nodes)} disconnected nodes",
            "nodes": list(orphan_nodes),
        })

    # Check for missing start/end nodes
    node_types = [node.get("type") for node in nodes]
    if "start" not in node_types:
        issues.append({
            "type": "missing_start",
            "message": "Workflow has no START node",
            "severity": "error",
        })

    if "end" not in node_types:
        warnings.append({
            "type": "missing_end",
            "message": "Workflow has no END node",
            "severity": "warning",
        })

    # Check for cycles
    if _has_cycle(node_ids, edges):
        issues.append({
            "type": "cycle_detected",
            "message": "Workflow contains a cycle (except for loops)",
            "severity": "error",
        })

    # Check agent nodes for configuration
    for node in nodes:
        if node.get("type") == "agent":
            node_data = node.get("data", {})
            agent_config = node_data.get("agent_config", {})

            if not agent_config.get("system_prompt"):
                warnings.append({
                    "type": "missing_system_prompt",
                    "message": f"Agent node '{node.get('id')}' has no system prompt",
                    "node_id": node.get("id"),
                })

    return {
        "workflow_id": workflow_id,
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "node_count": len(nodes),
        "edge_count": len(edges),
    }


def _has_cycle(node_ids: set, edges: list) -> bool:
    """Check if workflow graph has a cycle."""
    visited = set()
    rec_stack = set()

    def dfs(node_id: str) -> bool:
        visited.add(node_id)
        rec_stack.add(node_id)

        for edge in edges:
            if edge["source"] == node_id:
                target = edge["target"]
                if target not in visited:
                    if dfs(target):
                        return True
                elif target in rec_stack:
                    return True

        rec_stack.remove(node_id)
        return False

    for nid in node_ids:
        if nid not in visited:
            if dfs(nid):
                return True
    return False
