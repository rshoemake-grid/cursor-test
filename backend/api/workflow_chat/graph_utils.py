"""Pure helpers for workflow graph analysis (workflow chat tools)."""
from typing import Any, Dict, List


def isolated_node_summaries(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Nodes that have no incident edges (neither as source nor target).
    Each item: id, type, name for tool / LLM consumption.
    """
    touched: set[str] = set()
    for edge in edges or []:
        s = edge.get("source")
        t = edge.get("target")
        if s:
            touched.add(str(s))
        if t:
            touched.add(str(t))

    out: List[Dict[str, Any]] = []
    for node in nodes or []:
        nid = node.get("id")
        if not nid:
            continue
        sid = str(nid)
        if sid in touched:
            continue
        ntype = node.get("type", "unknown")
        name = node.get("name") or (node.get("data") or {}).get("name") or (node.get("data") or {}).get("label") or sid
        out.append({"id": sid, "type": ntype, "name": name})
    return out
