"""Workflow marketplace and discovery API routes for Phase 4"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc
import uuid

from backend.database.db import get_db
from backend.database.models import WorkflowDB, WorkflowLikeDB, UserDB, WorkflowTemplateDB
from backend.models.schemas import WorkflowLike, WorkflowResponseV2
from backend.auth import get_current_active_user, get_optional_user

router = APIRouter(prefix="/api/marketplace", tags=["Marketplace"])


@router.get("/discover", response_model=List[WorkflowResponseV2])
async def discover_workflows(
    category: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated
    search: Optional[str] = Query(None),
    sort_by: str = Query("popular", regex="^(popular|recent|likes)$"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Discover public workflows and templates"""
    query = select(WorkflowDB).where(
        or_(
            WorkflowDB.is_public == True,
            WorkflowDB.is_template == True
        )
    )
    
    # Apply filters
    filters = []
    if category:
        filters.append(WorkflowDB.category == category)
    
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        # Check if any of the tags match
        for tag in tag_list:
            filters.append(WorkflowDB.tags.contains([tag]))
    
    if search:
        filters.append(
            or_(
                WorkflowDB.name.ilike(f"%{search}%"),
                WorkflowDB.description.ilike(f"%{search}%")
            )
        )
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting
    if sort_by == "popular":
        query = query.order_by(desc(WorkflowDB.uses_count))
    elif sort_by == "recent":
        query = query.order_by(desc(WorkflowDB.created_at))
    elif sort_by == "likes":
        query = query.order_by(desc(WorkflowDB.likes_count))
    
    # Apply pagination
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    workflows = result.scalars().all()
    
    return [
        WorkflowResponseV2(
            id=w.id,
            name=w.name,
            description=w.description,
            version=w.version,
            nodes=w.definition.get("nodes", []),
            edges=w.definition.get("edges", []),
            variables=w.definition.get("variables", {}),
            owner_id=w.owner_id,
            is_public=w.is_public,
            is_template=w.is_template,
            category=w.category,
            tags=w.tags or [],
            likes_count=w.likes_count,
            views_count=w.views_count,
            uses_count=w.uses_count,
            created_at=w.created_at,
            updated_at=w.updated_at
        )
        for w in workflows
    ]


@router.post("/like", status_code=201)
async def like_workflow(
    like_data: WorkflowLike,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Like a workflow"""
    # Check if workflow exists
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == like_data.workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check if already liked
    result = await db.execute(
        select(WorkflowLikeDB).where(
            and_(
                WorkflowLikeDB.workflow_id == like_data.workflow_id,
                WorkflowLikeDB.user_id == current_user.id
            )
        )
    )
    existing_like = result.scalar_one_or_none()
    
    if existing_like:
        return {"message": "Already liked"}
    
    # Create like
    like = WorkflowLikeDB(
        id=str(uuid.uuid4()),
        workflow_id=like_data.workflow_id,
        user_id=current_user.id
    )
    
    # Increment likes count
    workflow.likes_count += 1
    
    db.add(like)
    await db.commit()
    
    return {"message": "Liked successfully"}


@router.delete("/like/{workflow_id}", status_code=204)
async def unlike_workflow(
    workflow_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlike a workflow"""
    # Find like
    result = await db.execute(
        select(WorkflowLikeDB).where(
            and_(
                WorkflowLikeDB.workflow_id == workflow_id,
                WorkflowLikeDB.user_id == current_user.id
            )
        )
    )
    like = result.scalar_one_or_none()
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    # Decrement likes count
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if workflow:
        workflow.likes_count = max(0, workflow.likes_count - 1)
    
    await db.delete(like)
    await db.commit()


@router.get("/trending", response_model=List[WorkflowResponseV2])
async def get_trending_workflows(
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get trending workflows based on recent activity"""
    # Get workflows with high recent usage
    query = (
        select(WorkflowDB)
        .where(
            or_(
                WorkflowDB.is_public == True,
                WorkflowDB.is_template == True
            )
        )
        .order_by(
            desc(WorkflowDB.uses_count + WorkflowDB.likes_count * 2)
        )
        .limit(limit)
    )
    
    result = await db.execute(query)
    workflows = result.scalars().all()
    
    return [
        WorkflowResponseV2(
            id=w.id,
            name=w.name,
            description=w.description,
            version=w.version,
            nodes=w.definition.get("nodes", []),
            edges=w.definition.get("edges", []),
            variables=w.definition.get("variables", {}),
            owner_id=w.owner_id,
            is_public=w.is_public,
            is_template=w.is_template,
            category=w.category,
            tags=w.tags or [],
            likes_count=w.likes_count,
            views_count=w.views_count,
            uses_count=w.uses_count,
            created_at=w.created_at,
            updated_at=w.updated_at
        )
        for w in workflows
    ]


@router.get("/stats")
async def get_marketplace_stats(
    db: AsyncSession = Depends(get_db)
):
    """Get marketplace statistics"""
    # Count public workflows
    result = await db.execute(
        select(func.count(WorkflowDB.id)).where(WorkflowDB.is_public == True)
    )
    public_count = result.scalar()
    
    # Count templates
    result = await db.execute(
        select(func.count(WorkflowTemplateDB.id))
    )
    template_count = result.scalar()
    
    # Count users
    result = await db.execute(
        select(func.count(UserDB.id))
    )
    user_count = result.scalar()
    
    # Total workflow executions (approximate)
    result = await db.execute(
        select(func.sum(WorkflowDB.uses_count))
    )
    total_executions = result.scalar() or 0
    
    return {
        "public_workflows": public_count,
        "templates": template_count,
        "total_users": user_count,
        "total_executions": total_executions
    }


@router.get("/my-likes", response_model=List[WorkflowResponseV2])
async def get_my_liked_workflows(
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get workflows liked by current user"""
    # Get liked workflow IDs
    result = await db.execute(
        select(WorkflowLikeDB.workflow_id).where(
            WorkflowLikeDB.user_id == current_user.id
        )
    )
    workflow_ids = [row[0] for row in result.all()]
    
    if not workflow_ids:
        return []
    
    # Get workflows
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id.in_(workflow_ids))
    )
    workflows = result.scalars().all()
    
    return [
        WorkflowResponseV2(
            id=w.id,
            name=w.name,
            description=w.description,
            version=w.version,
            nodes=w.definition.get("nodes", []),
            edges=w.definition.get("edges", []),
            variables=w.definition.get("variables", {}),
            owner_id=w.owner_id,
            is_public=w.is_public,
            is_template=w.is_template,
            category=w.category,
            tags=w.tags or [],
            likes_count=w.likes_count,
            views_count=w.views_count,
            uses_count=w.uses_count,
            created_at=w.created_at,
            updated_at=w.updated_at
        )
        for w in workflows
    ]

