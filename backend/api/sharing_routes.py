"""Workflow sharing and collaboration API routes for Phase 4"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException

from backend.database.models import UserDB
from backend.models.schemas import (
    WorkflowShareCreate,
    WorkflowShareResponse,
    WorkflowVersionCreate,
    WorkflowVersionResponse,
)
from backend.auth import get_current_active_user
from backend.dependencies import WorkflowOwnershipServiceDep, SharingServiceDep
from backend.exceptions import UserNotFoundError, VersionNotFoundError
from backend.utils.response_serializers import share_db_to_response, version_db_to_response

router = APIRouter(prefix="/sharing", tags=["Sharing & Collaboration"])


@router.post("/share", response_model=WorkflowShareResponse, status_code=201)
async def share_workflow(
    share_data: WorkflowShareCreate,
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
    sharing_service: SharingServiceDep = ...,
):
    """Share a workflow with another user"""
    await ownership_service.get_workflow_and_assert_owner(
        share_data.workflow_id, current_user.id, "share"
    )
    try:
        share = await sharing_service.share_workflow(
            workflow_id=share_data.workflow_id,
            shared_with_username=share_data.shared_with_username,
            permission=share_data.permission,
            shared_by=current_user.id,
        )
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    return share_db_to_response(share)


@router.get("/shared-with-me", response_model=List[WorkflowShareResponse])
async def get_shared_workflows(
    current_user: UserDB = Depends(get_current_active_user),
    sharing_service: SharingServiceDep = ...,
):
    """Get workflows shared with current user"""
    shares = await sharing_service.get_shared_with_me(current_user.id)
    return [share_db_to_response(share) for share in shares]


@router.get("/shared-by-me", response_model=List[WorkflowShareResponse])
async def get_my_shares(
    current_user: UserDB = Depends(get_current_active_user),
    sharing_service: SharingServiceDep = ...,
):
    """Get workflows current user has shared"""
    shares = await sharing_service.get_shared_by_me(current_user.id)
    return [share_db_to_response(share) for share in shares]


@router.delete("/share/{share_id}", status_code=204)
async def revoke_share(
    share_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
    sharing_service: SharingServiceDep = ...,
):
    """Revoke workflow share"""
    share = await sharing_service.get_share_by_id(share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    await ownership_service.get_workflow_and_assert_owner(
        share.workflow_id, current_user.id, "revoke share"
    )
    await sharing_service.revoke_share(share)


# ============================================================================
# Workflow Versioning
# ============================================================================

@router.post("/versions", response_model=WorkflowVersionResponse, status_code=201)
async def create_workflow_version(
    version_data: WorkflowVersionCreate,
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
    sharing_service: SharingServiceDep = ...,
):
    """Create a new version of a workflow"""
    workflow = await ownership_service.get_workflow_and_assert_owner(
        version_data.workflow_id, current_user.id, "create version"
    )
    version = await sharing_service.create_workflow_version(
        workflow_id=version_data.workflow_id,
        definition=workflow.definition,
        change_notes=version_data.change_notes,
        created_by=current_user.id,
    )
    return version_db_to_response(version)


@router.get("/versions/{workflow_id}", response_model=List[WorkflowVersionResponse])
async def get_workflow_versions(
    workflow_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
    sharing_service: SharingServiceDep = ...,
):
    """Get all versions of a workflow"""
    await ownership_service.get_workflow_and_assert_can_read_or_share(
        workflow_id, current_user.id
    )
    versions = await sharing_service.get_workflow_versions(workflow_id)
    return [version_db_to_response(v) for v in versions]


@router.post("/versions/{version_id}/restore", status_code=200)
async def restore_workflow_version(
    version_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
    sharing_service: SharingServiceDep = ...,
):
    """Restore a workflow to a previous version"""
    try:
        version = await sharing_service.get_version_by_id(version_id)
    except VersionNotFoundError:
        raise HTTPException(status_code=404, detail="Version not found")
    workflow = await ownership_service.get_workflow_and_assert_owner(
        version.workflow_id, current_user.id, "restore version"
    )
    version_number = await sharing_service.restore_workflow_version(
        version_id, workflow
    )
    return {"message": f"Restored to version {version_number}"}

