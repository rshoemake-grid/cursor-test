"""Workflow marketplace and discovery API routes for Phase 4"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc

from backend.database.db import get_db
from backend.database.models import UserDB, PublishedAgentDB
from backend.dependencies import (
    WorkflowOwnershipServiceDep,
    MarketplaceServiceDep,
    WorkflowLikeServiceDep,
)
from backend.exceptions import LikeNotFoundError
from backend.models.schemas import (
    WorkflowLike,
    WorkflowResponseV2,
    PublishedAgentCreate,
    PublishedAgentResponse,
)
from backend.utils.workflow_serialization import workflow_db_to_response_v2
from backend.auth import get_current_active_user, get_optional_user

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/discover", response_model=List[WorkflowResponseV2])
async def discover_workflows(
    category: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated
    search: Optional[str] = Query(None),
    sort_by: str = Query("popular", regex="^(popular|recent|likes)$"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    marketplace_service: MarketplaceServiceDep = ...,
):
    """Discover public workflows and templates"""
    workflows = await marketplace_service.discover_workflows(
        category=category, tags=tags, search=search,
        sort_by=sort_by, limit=limit, offset=offset
    )
    return [workflow_db_to_response_v2(w) for w in workflows]


@router.post("/like", status_code=201)
async def like_workflow(
    like_data: WorkflowLike,
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
    like_service: WorkflowLikeServiceDep = ...,
):
    """Like a workflow (only workflows the user can read: owner or public)."""
    workflow = await ownership_service.get_workflow_and_assert_can_read(
        like_data.workflow_id, current_user.id
    )
    return await like_service.like_workflow(
        like_data.workflow_id, current_user.id, workflow
    )


@router.delete("/like/{workflow_id}", status_code=204)
async def unlike_workflow(
    workflow_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    like_service: WorkflowLikeServiceDep = ...,
):
    """Unlike a workflow"""
    try:
        await like_service.unlike_workflow(workflow_id, current_user.id)
    except LikeNotFoundError:
        raise HTTPException(status_code=404, detail="Like not found")


@router.get("/trending", response_model=List[WorkflowResponseV2])
async def get_trending_workflows(
    limit: int = Query(10, le=50),
    marketplace_service: MarketplaceServiceDep = ...,
):
    """Get trending workflows based on recent activity"""
    workflows = await marketplace_service.get_trending_workflows(limit=limit)
    return [workflow_db_to_response_v2(w) for w in workflows]


@router.get("/stats")
async def get_marketplace_stats(
    marketplace_service: MarketplaceServiceDep = ...,
):
    """Get marketplace statistics"""
    return await marketplace_service.get_marketplace_stats()


@router.get("/my-likes", response_model=List[WorkflowResponseV2])
async def get_my_liked_workflows(
    current_user: UserDB = Depends(get_current_active_user),
    marketplace_service: MarketplaceServiceDep = ...,
):
    """Get workflows liked by current user"""
    workflows = await marketplace_service.get_my_liked_workflows(current_user.id)
    return [workflow_db_to_response_v2(w) for w in workflows]


@router.post("/agents", response_model=PublishedAgentResponse, status_code=201)
async def publish_agent(
    agent_data: PublishedAgentCreate,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Publish an agent to the marketplace"""
    agent = PublishedAgentDB(
        id=str(uuid.uuid4()),
        name=agent_data.name,
        description=agent_data.description,
        category=agent_data.category,
        tags=agent_data.tags,
        difficulty=agent_data.difficulty or "beginner",
        estimated_time=agent_data.estimated_time,
        agent_config=agent_data.agent_config,
        author_id=current_user.id,
        is_official=current_user.is_admin
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    author_name = current_user.username or current_user.full_name or current_user.email
    return PublishedAgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        category=agent.category,
        tags=agent.tags or [],
        difficulty=agent.difficulty,
        estimated_time=agent.estimated_time,
        agent_config=agent.agent_config,
        published_at=agent.created_at,
        author_id=agent.author_id,
        author_name=author_name,
        is_official=agent.is_official
    )


@router.get("/agents", response_model=List[PublishedAgentResponse])
async def list_agents(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """List published agents from the marketplace"""
    query = select(PublishedAgentDB, UserDB.username).join(
        UserDB, PublishedAgentDB.author_id == UserDB.id, isouter=True
    )
    if category:
        query = query.where(PublishedAgentDB.category == category)
    if search:
        query = query.where(
            or_(
                PublishedAgentDB.name.ilike(f"%{search}%"),
                PublishedAgentDB.description.ilike(f"%{search}%")
            )
        )
    query = query.order_by(desc(PublishedAgentDB.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    rows = result.all()
    return [
        PublishedAgentResponse(
            id=a.id,
            name=a.name,
            description=a.description,
            category=a.category,
            tags=a.tags or [],
            difficulty=a.difficulty,
            estimated_time=a.estimated_time,
            agent_config=a.agent_config,
            published_at=a.created_at,
            author_id=a.author_id,
            author_name=author_username if author_username else None,
            is_official=a.is_official
        )
        for a, author_username in rows
    ]

