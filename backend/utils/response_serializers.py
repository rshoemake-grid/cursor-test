"""
Response serialization helpers (DRY).
Single source of truth for converting DB models to API response schemas.
"""
from typing import Optional

from backend.models.schemas import (
    WorkflowTemplateResponse,
    WorkflowShareResponse,
    WorkflowVersionResponse,
)


def template_db_to_response(
    template,
    author_name: Optional[str] = None,
) -> WorkflowTemplateResponse:
    """Convert WorkflowTemplateDB to WorkflowTemplateResponse."""
    return WorkflowTemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        category=template.category,
        tags=template.tags,
        difficulty=template.difficulty,
        estimated_time=template.estimated_time,
        is_official=template.is_official,
        uses_count=template.uses_count,
        likes_count=template.likes_count,
        rating=template.rating,
        author_id=template.author_id,
        author_name=author_name,
        thumbnail_url=template.thumbnail_url,
        preview_image_url=template.preview_image_url,
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


def share_db_to_response(share) -> WorkflowShareResponse:
    """Convert WorkflowShareDB to WorkflowShareResponse."""
    return WorkflowShareResponse(
        id=share.id,
        workflow_id=share.workflow_id,
        shared_with_user_id=share.shared_with_user_id,
        permission=share.permission,
        shared_by=share.shared_by,
        created_at=share.created_at,
    )


def version_db_to_response(version) -> WorkflowVersionResponse:
    """Convert WorkflowVersionDB to WorkflowVersionResponse."""
    return WorkflowVersionResponse(
        id=version.id,
        workflow_id=version.workflow_id,
        version_number=version.version_number,
        change_notes=version.change_notes,
        created_by=version.created_by,
        created_at=version.created_at,
    )
