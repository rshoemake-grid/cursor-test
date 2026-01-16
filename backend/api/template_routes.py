"""Workflow template API routes for Phase 4"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
import uuid

from backend.database.db import get_db
from backend.database.models import WorkflowTemplateDB, UserDB, WorkflowDB
from backend.models.schemas import (
    WorkflowTemplateCreate,
    WorkflowTemplateResponse,
    TemplateCategory,
    TemplateDifficulty,
    WorkflowCreate,
    WorkflowResponse
)
from backend.auth import get_current_active_user, get_optional_user

router = APIRouter(prefix="/api/templates", tags=["Templates"])


@router.post("/", response_model=WorkflowTemplateResponse, status_code=201)
async def create_template(
    template_data: WorkflowTemplateCreate,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workflow template"""
    template = WorkflowTemplateDB(
        id=str(uuid.uuid4()),
        name=template_data.name,
        description=template_data.description,
        category=template_data.category,
        tags=template_data.tags,
        definition=template_data.definition,
        author_id=current_user.id,
        is_official=template_data.is_official if current_user.is_admin else False,
        difficulty=template_data.difficulty,
        estimated_time=template_data.estimated_time
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
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
        author_name=current_user.username,
        thumbnail_url=template.thumbnail_url,
        preview_image_url=template.preview_image_url,
        created_at=template.created_at,
        updated_at=template.updated_at
    )


@router.get("/", response_model=List[WorkflowTemplateResponse])
async def list_templates(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("popular", regex="^(popular|recent|rating)$"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """List workflow templates with filtering"""
    # Select both WorkflowTemplateDB and UserDB.username
    query = select(WorkflowTemplateDB, UserDB.username).join(
        UserDB, WorkflowTemplateDB.author_id == UserDB.id, isouter=True
    )
    
    # Apply filters
    filters = []
    if category:
        filters.append(WorkflowTemplateDB.category == category)
    if difficulty:
        filters.append(WorkflowTemplateDB.difficulty == difficulty)
    if search:
        filters.append(
            or_(
                WorkflowTemplateDB.name.ilike(f"%{search}%"),
                WorkflowTemplateDB.description.ilike(f"%{search}%")
            )
        )
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting
    if sort_by == "popular":
        query = query.order_by(WorkflowTemplateDB.uses_count.desc())
    elif sort_by == "recent":
        query = query.order_by(WorkflowTemplateDB.created_at.desc())
    elif sort_by == "rating":
        query = query.order_by(WorkflowTemplateDB.rating.desc())
    
    # Apply pagination
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    templates = result.all()
    
    return [
        WorkflowTemplateResponse(
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
            author_name=author_username,
            thumbnail_url=template.thumbnail_url,
            preview_image_url=template.preview_image_url,
            created_at=template.created_at,
            updated_at=template.updated_at
        )
        for template, author_username in templates
    ]


@router.get("/categories", response_model=List[str])
async def list_categories():
    """Get list of all template categories"""
    return [category.value for category in TemplateCategory]


@router.get("/difficulties", response_model=List[str])
async def list_difficulties():
    """Get list of all difficulty levels"""
    return [difficulty.value for difficulty in TemplateDifficulty]


@router.get("/{template_id}", response_model=WorkflowTemplateResponse)
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific template by ID"""
    result = await db.execute(
        select(WorkflowTemplateDB).where(WorkflowTemplateDB.id == template_id)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get author username if author_id exists
    author_username = None
    if template.author_id:
        author_result = await db.execute(
            select(UserDB.username).where(UserDB.id == template.author_id)
        )
        author_username = author_result.scalar_one_or_none()
    
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
        author_name=author_username,
        thumbnail_url=template.thumbnail_url,
        preview_image_url=template.preview_image_url,
        created_at=template.created_at,
        updated_at=template.updated_at
    )


@router.post("/{template_id}/use", response_model=WorkflowResponse, status_code=201)
async def use_template(
    template_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workflow from a template"""
    # Get template
    result = await db.execute(
        select(WorkflowTemplateDB).where(WorkflowTemplateDB.id == template_id)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Increment uses count
    template.uses_count += 1
    
    # Create workflow from template
    workflow_id = str(uuid.uuid4())
    workflow = WorkflowDB(
        id=workflow_id,
        name=name or f"{template.name} (from template)",
        description=description or template.description,
        version="1.0.0",
        definition=template.definition,
        owner_id=current_user.id if current_user else None,
        is_public=False,
        is_template=False,
        category=template.category,
        tags=template.tags
    )
    
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    
    # Parse definition
    definition = workflow.definition
    
    # Ensure edges preserve sourceHandle and targetHandle
    edges = definition.get("edges", [])
    # Log condition edges for debugging
    condition_edges = [e for e in edges if e.get("source") == "condition-1"]
    if condition_edges:
        print(f"Template edges for condition-1: {condition_edges}")
        for edge in condition_edges:
            print(f"  Edge {edge.get('id')}: sourceHandle={edge.get('sourceHandle')}, type={type(edge.get('sourceHandle'))}")
    
    return WorkflowResponse(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        version=workflow.version,
        nodes=definition.get("nodes", []),
        edges=edges,
        variables=definition.get("variables", {}),
        created_at=workflow.created_at,
        updated_at=workflow.updated_at
    )


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: str,
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a template (author or admin only)"""
    result = await db.execute(
        select(WorkflowTemplateDB).where(WorkflowTemplateDB.id == template_id)
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check permissions
    if template.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this template")
    
    await db.delete(template)
    await db.commit()

