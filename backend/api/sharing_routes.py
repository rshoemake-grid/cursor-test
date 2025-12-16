"""Workflow sharing and collaboration API routes for Phase 4"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import uuid

from backend.database.db import get_db
from backend.database.models import WorkflowDB, WorkflowShareDB, UserDB, WorkflowVersionDB
from backend.models.schemas import (
    WorkflowShareCreate,
    WorkflowShareResponse,
    WorkflowVersionCreate,
    WorkflowVersionResponse
)
from backend.auth import get_current_active_user

router = APIRouter(prefix="/api/sharing", tags=["Sharing & Collaboration"])


@router.post("/share", response_model=WorkflowShareResponse, status_code=201)
async def share_workflow(
    share_data: WorkflowShareCreate,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Share a workflow with another user"""
    # Check if workflow exists and user owns it
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == share_data.workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to share this workflow")
    
    # Find user to share with
    result = await db.execute(
        select(UserDB).where(UserDB.username == share_data.shared_with_username)
    )
    shared_with_user = result.scalar_one_or_none()
    
    if not shared_with_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already shared
    result = await db.execute(
        select(WorkflowShareDB).where(
            and_(
                WorkflowShareDB.workflow_id == share_data.workflow_id,
                WorkflowShareDB.shared_with_user_id == shared_with_user.id
            )
        )
    )
    existing_share = result.scalar_one_or_none()
    
    if existing_share:
        # Update permission
        existing_share.permission = share_data.permission
        await db.commit()
        await db.refresh(existing_share)
        share = existing_share
    else:
        # Create new share
        share = WorkflowShareDB(
            id=str(uuid.uuid4()),
            workflow_id=share_data.workflow_id,
            shared_with_user_id=shared_with_user.id,
            permission=share_data.permission,
            shared_by=current_user.id
        )
        db.add(share)
        await db.commit()
        await db.refresh(share)
    
    return WorkflowShareResponse(
        id=share.id,
        workflow_id=share.workflow_id,
        shared_with_user_id=share.shared_with_user_id,
        permission=share.permission,
        shared_by=share.shared_by,
        created_at=share.created_at
    )


@router.get("/shared-with-me", response_model=List[WorkflowShareResponse])
async def get_shared_workflows(
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get workflows shared with current user"""
    result = await db.execute(
        select(WorkflowShareDB).where(
            WorkflowShareDB.shared_with_user_id == current_user.id
        )
    )
    shares = result.scalars().all()
    
    return [
        WorkflowShareResponse(
            id=share.id,
            workflow_id=share.workflow_id,
            shared_with_user_id=share.shared_with_user_id,
            permission=share.permission,
            shared_by=share.shared_by,
            created_at=share.created_at
        )
        for share in shares
    ]


@router.get("/shared-by-me", response_model=List[WorkflowShareResponse])
async def get_my_shares(
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get workflows current user has shared"""
    result = await db.execute(
        select(WorkflowShareDB).where(
            WorkflowShareDB.shared_by == current_user.id
        )
    )
    shares = result.scalars().all()
    
    return [
        WorkflowShareResponse(
            id=share.id,
            workflow_id=share.workflow_id,
            shared_with_user_id=share.shared_with_user_id,
            permission=share.permission,
            shared_by=share.shared_by,
            created_at=share.created_at
        )
        for share in shares
    ]


@router.delete("/share/{share_id}", status_code=204)
async def revoke_share(
    share_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke workflow share"""
    result = await db.execute(
        select(WorkflowShareDB).where(WorkflowShareDB.id == share_id)
    )
    share = result.scalar_one_or_none()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    # Check if user owns the workflow
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == share.workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow or workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(share)
    await db.commit()


# ============================================================================
# Workflow Versioning
# ============================================================================

@router.post("/versions", response_model=WorkflowVersionResponse, status_code=201)
async def create_workflow_version(
    version_data: WorkflowVersionCreate,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new version of a workflow"""
    # Check workflow exists and user owns it
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == version_data.workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get current highest version number
    result = await db.execute(
        select(WorkflowVersionDB)
        .where(WorkflowVersionDB.workflow_id == version_data.workflow_id)
        .order_by(WorkflowVersionDB.version_number.desc())
        .limit(1)
    )
    latest_version = result.scalar_one_or_none()
    
    next_version_number = (latest_version.version_number + 1) if latest_version else 1
    
    # Create version snapshot
    version = WorkflowVersionDB(
        id=str(uuid.uuid4()),
        workflow_id=version_data.workflow_id,
        version_number=next_version_number,
        definition=workflow.definition,
        change_notes=version_data.change_notes,
        created_by=current_user.id
    )
    
    db.add(version)
    await db.commit()
    await db.refresh(version)
    
    return WorkflowVersionResponse(
        id=version.id,
        workflow_id=version.workflow_id,
        version_number=version.version_number,
        change_notes=version.change_notes,
        created_by=version.created_by,
        created_at=version.created_at
    )


@router.get("/versions/{workflow_id}", response_model=List[WorkflowVersionResponse])
async def get_workflow_versions(
    workflow_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all versions of a workflow"""
    # Check if user has access
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check access (owner or shared with)
    if workflow.owner_id != current_user.id:
        result = await db.execute(
            select(WorkflowShareDB).where(
                and_(
                    WorkflowShareDB.workflow_id == workflow_id,
                    WorkflowShareDB.shared_with_user_id == current_user.id
                )
            )
        )
        share = result.scalar_one_or_none()
        if not share:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get versions
    result = await db.execute(
        select(WorkflowVersionDB)
        .where(WorkflowVersionDB.workflow_id == workflow_id)
        .order_by(WorkflowVersionDB.version_number.desc())
    )
    versions = result.scalars().all()
    
    return [
        WorkflowVersionResponse(
            id=v.id,
            workflow_id=v.workflow_id,
            version_number=v.version_number,
            change_notes=v.change_notes,
            created_by=v.created_by,
            created_at=v.created_at
        )
        for v in versions
    ]


@router.post("/versions/{version_id}/restore", status_code=200)
async def restore_workflow_version(
    version_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Restore a workflow to a previous version"""
    # Get version
    result = await db.execute(
        select(WorkflowVersionDB).where(WorkflowVersionDB.id == version_id)
    )
    version = result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Get workflow
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == version.workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Restore definition
    workflow.definition = version.definition
    await db.commit()
    
    return {"message": f"Restored to version {version.version_number}"}

