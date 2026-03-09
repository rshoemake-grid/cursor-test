"""
Workflow serialization utilities (DRY).
"""
from typing import TYPE_CHECKING

from backend.models.schemas import WorkflowResponseV2, WorkflowResponse, Edge
from backend.utils.workflow_reconstruction import reconstruct_nodes

if TYPE_CHECKING:
    from backend.database.models import WorkflowDB


def workflow_db_to_response(w: "WorkflowDB") -> WorkflowResponse:
    """Convert WorkflowDB to WorkflowResponse (DRY: single source of truth)."""
    definition = w.definition or {}
    return WorkflowResponse(
        id=w.id,
        name=w.name,
        description=w.description,
        version=w.version,
        nodes=reconstruct_nodes(definition.get("nodes", [])),
        edges=[Edge(**e) for e in definition.get("edges", [])],
        variables=definition.get("variables", {}),
        created_at=w.created_at,
        updated_at=w.updated_at,
    )


def workflow_db_to_response_v2(w: "WorkflowDB") -> WorkflowResponseV2:
    """Convert WorkflowDB to WorkflowResponseV2 (DRY: single source of truth)."""
    definition = w.definition or {}
    return WorkflowResponseV2(
        id=w.id,
        name=w.name,
        description=w.description,
        version=w.version,
        nodes=definition.get("nodes", []),
        edges=definition.get("edges", []),
        variables=definition.get("variables", {}),
        owner_id=w.owner_id,
        is_public=w.is_public,
        is_template=w.is_template,
        category=w.category,
        tags=w.tags or [],
        likes_count=w.likes_count or 0,
        views_count=w.views_count or 0,
        uses_count=w.uses_count or 0,
        created_at=w.created_at,
        updated_at=w.updated_at,
    )
