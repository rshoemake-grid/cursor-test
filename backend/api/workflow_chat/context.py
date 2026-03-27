"""Workflow context retrieval for LLM"""
from typing import Optional, TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.models import WorkflowDB

if TYPE_CHECKING:
    from backend.services.workflow_ownership_service import WorkflowOwnershipService


async def get_workflow_context(
    db: AsyncSession,
    workflow_id: Optional[str],
    user_id: Optional[str] = None,
    ownership_service: Optional["WorkflowOwnershipService"] = None,
) -> str:
    """
    Get current workflow context as a string for the LLM.
    When workflow_id is provided, asserts user can read (owner, public, or shared) before returning.
    """
    if not workflow_id:
        return "No workflow loaded. You can create a new workflow."

    result = await db.execute(select(WorkflowDB).where(WorkflowDB.id == workflow_id))
    workflow = result.scalar_one_or_none()

    if not workflow:
        return f"Workflow {workflow_id} not found."

    # Access control: assert user can read workflow (owner, public, or shared)
    if ownership_service:
        await ownership_service.assert_can_read_or_share(workflow, user_id)

    definition = workflow.definition
    nodes = definition.get("nodes", [])
    edges = definition.get("edges", [])

    context = f"Workflow: {workflow.name}\n"
    context += f"Description: {workflow.description or 'None'}\n\n"
    context += f"Nodes ({len(nodes)}):\n"
    for node in nodes:
        node_id = node.get("id", "unknown")
        node_type = node.get("type", "unknown")
        node_name = node.get("name") or node.get("data", {}).get("name") or node_id
        context += f"  - {node_id}: {node_type} ({node_name})\n"

    context += f"\nEdges ({len(edges)}) — this is the complete connection list; nodes not listed here are not connected:\n"
    for edge in edges:
        source = edge.get("source", "unknown")
        target = edge.get("target", "unknown")
        handle = edge.get("sourceHandle")
        suffix = f" (sourceHandle={handle})" if handle else ""
        context += f"  - {source} -> {target}{suffix}\n"

    if len(edges) == 0 and len(nodes) > 1:
        context += "\nNote: Multiple nodes but zero edges — the graph is disconnected until edges are added.\n"

    return context
