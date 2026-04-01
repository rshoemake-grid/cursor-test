"""
Workflow CRUD routes.
Handles creation, reading, updating, and deletion of workflows.
"""
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.schemas import (
    WorkflowCreate,
    WorkflowResponse,
    Edge,
    Node,
    WorkflowPublishRequest,
    WorkflowTemplateResponse
)
from ...utils.workflow_serialization import workflow_db_to_response
from ...utils.response_serializers import template_db_to_response
from ...database.models import UserDB, WorkflowTemplateDB
from ...auth import get_optional_user, get_current_active_user
from uuid import uuid4
from ...utils.logger import get_logger
from ...dependencies import get_workflow_service, WorkflowOwnershipServiceDep
from ...services.workflow_service import WorkflowService
from ...database import get_db
from ...exceptions import WorkflowNotFoundError, WorkflowValidationError, WorkflowForbiddenError
logger = get_logger(__name__)

router = APIRouter()


@router.post(
    "/workflows",
    response_model=WorkflowResponse,
    summary="Create Workflow",
    description="Create a new workflow with nodes, edges, and variables",
    responses={
        200: {
            "description": "Workflow created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "workflow-123",
                        "name": "My Workflow",
                        "description": "A sample workflow",
                        "version": "1.0.0",
                        "nodes": [
                            {
                                "id": "start-1",
                                "type": "start",
                                "position": {"x": 100, "y": 100},
                                "data": {}
                            }
                        ],
                        "edges": [],
                        "variables": {},
                        "created_at": "2026-02-23T12:00:00",
                        "updated_at": "2026-02-23T12:00:00"
                    }
                }
            }
        }
    }
)
async def create_workflow(
    workflow: WorkflowCreate = Body(
        ...,
        example={
            "name": "My Workflow",
            "description": "A sample workflow for processing data",
            "nodes": [
                {
                    "id": "start-1",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {}
                },
                {
                    "id": "agent-1",
                    "type": "agent",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "model": "gpt-4o-mini",
                        "system_prompt": "You are a helpful assistant",
                        "temperature": 0.7
                    }
                },
                {
                    "id": "end-1",
                    "type": "end",
                    "position": {"x": 500, "y": 100},
                    "data": {}
                }
            ],
            "edges": [
                {
                    "id": "edge-1",
                    "source": "start-1",
                    "target": "agent-1"
                },
                {
                    "id": "edge-2",
                    "source": "agent-1",
                    "target": "end-1"
                }
            ],
            "variables": {
                "input_data": "sample value"
            }
        }
    ),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Create a new workflow (optionally authenticated)"""
    try:
        workflow_service = get_workflow_service(db)
        user_id = current_user.id if current_user else None
        db_workflow = await workflow_service.create_workflow(workflow, user_id=user_id)
        
    except WorkflowValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    return workflow_db_to_response(db_workflow)


@router.get(
    "/workflows",
    response_model=List[WorkflowResponse],
    summary="List Workflows",
    description="List workflows owned by the signed-in user. Returns an empty list when not authenticated.",
    responses={
        200: {
            "description": "List of workflows",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "workflow-123",
                            "name": "Data Processing Workflow",
                            "description": "Processes and transforms data",
                            "version": "1.0.0",
                            "nodes": [
                                {
                                    "id": "start-1",
                                    "type": "start",
                                    "position": {"x": 100, "y": 100},
                                    "data": {}
                                }
                            ],
                            "edges": [],
                            "variables": {},
                            "created_at": "2026-02-23T12:00:00",
                            "updated_at": "2026-02-23T12:00:00"
                        }
                    ]
                }
            }
        }
    }
)
async def list_workflows(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """List workflows for the authenticated user. Guests get an empty list (use marketplace for templates)."""
    try:
        workflow_service = get_workflow_service(db)
        user_id = current_user.id if current_user else None
        workflows = await workflow_service.list_workflows(user_id=user_id, include_public=True)
        return [workflow_db_to_response(w) for w in workflows]
    except Exception as e:
        logger.error(f"Error listing workflows: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error loading workflows: {str(e)}")


@router.get(
    "/workflows/{workflow_id}",
    response_model=WorkflowResponse,
    summary="Get Workflow",
    description="Get a specific workflow by ID",
    responses={
        200: {
            "description": "Workflow details",
            "content": {
                "application/json": {
                    "example": {
                        "id": "workflow-123",
                        "name": "My Workflow",
                        "description": "A sample workflow",
                        "version": "1.0.0",
                        "nodes": [
                            {
                                "id": "start-1",
                                "type": "start",
                                "position": {"x": 100, "y": 100},
                                "data": {}
                            }
                        ],
                        "edges": [],
                        "variables": {},
                        "created_at": "2026-02-23T12:00:00",
                        "updated_at": "2026-02-23T12:00:00"
                    }
                }
            }
        },
        404: {
            "description": "Workflow not found",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "404",
                            "message": "Workflow not found",
                            "path": "/api/workflows/workflow-123",
                            "timestamp": "2026-02-23T12:00:00"
                        }
                    }
                }
            }
        }
    }
)
async def get_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
):
    """Get a workflow by ID. Requires read access (owner, public, or shared)."""
    try:
        workflow = await ownership_service.get_workflow_and_assert_can_read_or_share(
            workflow_id, current_user.id if current_user else None
        )
        
        # Validate workflow definition exists
        if not workflow.definition or not isinstance(workflow.definition, dict):
            logger.error(f"Workflow {workflow_id} has invalid definition: {workflow.definition}")
            raise HTTPException(status_code=422, detail="Workflow definition is invalid or missing")
        
        try:
            return workflow_db_to_response(workflow)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reconstructing workflow: {e}", exc_info=True)
            raise HTTPException(status_code=422, detail=f"Invalid workflow data: {str(e)}")
    except HTTPException:
        raise  # Re-raise HTTPException (422, 404, etc.)
    except WorkflowNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except WorkflowForbiddenError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error loading workflow: {str(e)}")


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Update an existing workflow"""
    try:
        workflow_service = get_workflow_service(db)
        user_id = current_user.id if current_user else None
        updated_workflow = await workflow_service.update_workflow(workflow_id, workflow, user_id=user_id)
        return workflow_db_to_response(updated_workflow)
    except WorkflowNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except WorkflowForbiddenError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except WorkflowValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error updating workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating workflow: {str(e)}")


@router.delete("/workflows/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Delete a workflow"""
    try:
        workflow_service = get_workflow_service(db)
        user_id = current_user.id if current_user else None
        deleted = await workflow_service.delete_workflow(workflow_id, user_id=user_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    except WorkflowNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except WorkflowForbiddenError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting workflow: {str(e)}")


@router.post("/workflows/{workflow_id}/publish", response_model=WorkflowTemplateResponse, status_code=201)
async def publish_workflow(
    workflow_id: str,
    publish_request: WorkflowPublishRequest,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    ownership_service: WorkflowOwnershipServiceDep = ...,
):
    """Publish a workflow as a marketplace template"""
    workflow = await ownership_service.get_workflow_and_assert_owner(
        workflow_id, current_user.id, "publish"
    )
    template = WorkflowTemplateDB(
        id=str(uuid4()),
        name=workflow.name,
        description=workflow.description,
        category=publish_request.category.value,
        tags=publish_request.tags,
        definition=workflow.definition,
        author_id=current_user.id,
        is_official=current_user.is_admin,
        difficulty=publish_request.difficulty.value,
        estimated_time=publish_request.estimated_time
    )

    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template_db_to_response(template, author_name=current_user.username)


class BulkDeleteRequest(BaseModel):
    """Request model for bulk delete"""
    workflow_ids: List[str]


@router.post("/workflows/bulk-delete", status_code=200)
async def bulk_delete_workflows(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Delete multiple workflows"""
    if not request.workflow_ids:
        raise HTTPException(status_code=400, detail="No workflow IDs provided")
    
    workflow_service = get_workflow_service(db)
    user_id = current_user.id if current_user else None
    deleted_count = 0
    failed_ids = []
    
    for workflow_id in request.workflow_ids:
        try:
            deleted = await workflow_service.delete_workflow(workflow_id, user_id=user_id)
            if deleted:
                deleted_count += 1
            else:
                failed_ids.append(workflow_id)
        except WorkflowNotFoundError:
            failed_ids.append(workflow_id)
        except Exception as e:
            logger.error(f"Error deleting workflow {workflow_id}: {e}", exc_info=True)
            failed_ids.append(workflow_id)
    
    if failed_ids:
        return {
            "message": f"Deleted {deleted_count} workflow(s). {len(failed_ids)} workflow(s) could not be deleted.",
            "deleted_count": deleted_count,
            "failed_ids": failed_ids
        }
    
    return {
        "message": f"Successfully deleted {deleted_count} workflow(s)",
        "deleted_count": deleted_count
    }

