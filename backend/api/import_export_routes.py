"""Workflow import/export API routes for Phase 4"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid
import json

from backend.database.db import get_db
from backend.database.models import WorkflowDB, UserDB
from backend.models.schemas import WorkflowExport, WorkflowImport, WorkflowResponseV2
from backend.auth import get_current_active_user, get_optional_user

router = APIRouter(prefix="/api/import-export", tags=["Import/Export"])


@router.get("/export/{workflow_id}")
async def export_workflow(
    workflow_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Export a workflow as JSON"""
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check access
    if not workflow.is_public and workflow.owner_id != (current_user.id if current_user else None):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create export
    export_data = WorkflowExport(
        workflow=WorkflowResponseV2(
            id=workflow.id,
            name=workflow.name,
            description=workflow.description,
            version=workflow.version,
            nodes=workflow.definition.get("nodes", []),
            edges=workflow.definition.get("edges", []),
            variables=workflow.definition.get("variables", {}),
            owner_id=workflow.owner_id,
            is_public=workflow.is_public,
            is_template=workflow.is_template,
            category=workflow.category,
            tags=workflow.tags or [],
            likes_count=workflow.likes_count,
            views_count=workflow.views_count,
            uses_count=workflow.uses_count,
            created_at=workflow.created_at,
            updated_at=workflow.updated_at
        ),
        version="1.0",
        exported_at=datetime.utcnow(),
        exported_by=current_user.username if current_user else None
    )
    
    # Return as downloadable JSON
    return JSONResponse(
        content=json.loads(export_data.model_dump_json()),
        headers={
            "Content-Disposition": f"attachment; filename=workflow-{workflow.name.replace(' ', '_')}.json"
        }
    )


@router.post("/import", response_model=WorkflowResponseV2, status_code=201)
async def import_workflow(
    import_data: WorkflowImport,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Import a workflow from JSON"""
    definition = import_data.definition
    
    # Validate definition
    if "nodes" not in definition or "edges" not in definition:
        raise HTTPException(
            status_code=400,
            detail="Invalid workflow definition: must contain 'nodes' and 'edges'"
        )
    
    # Create workflow
    workflow_id = str(uuid.uuid4())
    workflow = WorkflowDB(
        id=workflow_id,
        name=import_data.name or f"Imported Workflow {workflow_id[:8]}",
        description=import_data.description,
        version="1.0.0",
        definition=definition,
        owner_id=current_user.id if current_user else None,
        is_public=False,
        is_template=False,
        category=definition.get("category"),
        tags=definition.get("tags", [])
    )
    
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    
    return WorkflowResponseV2(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        version=workflow.version,
        nodes=workflow.definition.get("nodes", []),
        edges=workflow.definition.get("edges", []),
        variables=workflow.definition.get("variables", {}),
        owner_id=workflow.owner_id,
        is_public=workflow.is_public,
        is_template=workflow.is_template,
        category=workflow.category,
        tags=workflow.tags or [],
        likes_count=workflow.likes_count,
        views_count=workflow.views_count,
        uses_count=workflow.uses_count,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at
    )


@router.post("/import/file", response_model=WorkflowResponseV2, status_code=201)
async def import_workflow_file(
    file: UploadFile = File(...),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Import a workflow from uploaded JSON file"""
    # Read file
    try:
        content = await file.read()
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    
    # Extract workflow data
    if "workflow" in data:
        # This is an export file
        workflow_data = data["workflow"]
        definition = {
            "nodes": workflow_data.get("nodes", []),
            "edges": workflow_data.get("edges", []),
            "variables": workflow_data.get("variables", {})
        }
        name = workflow_data.get("name")
        description = workflow_data.get("description")
        category = workflow_data.get("category")
        tags = workflow_data.get("tags", [])
    else:
        # Direct definition
        definition = data
        name = data.get("name")
        description = data.get("description")
        category = data.get("category")
        tags = data.get("tags", [])
    
    # Validate
    if "nodes" not in definition or "edges" not in definition:
        raise HTTPException(
            status_code=400,
            detail="Invalid workflow: must contain 'nodes' and 'edges'"
        )
    
    # Create workflow
    workflow_id = str(uuid.uuid4())
    workflow = WorkflowDB(
        id=workflow_id,
        name=name or f"Imported Workflow {workflow_id[:8]}",
        description=description,
        version="1.0.0",
        definition=definition,
        owner_id=current_user.id if current_user else None,
        is_public=False,
        is_template=False,
        category=category,
        tags=tags
    )
    
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    
    return WorkflowResponseV2(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        version=workflow.version,
        nodes=workflow.definition.get("nodes", []),
        edges=workflow.definition.get("edges", []),
        variables=workflow.definition.get("variables", {}),
        owner_id=workflow.owner_id,
        is_public=workflow.is_public,
        is_template=workflow.is_template,
        category=workflow.category,
        tags=workflow.tags or [],
        likes_count=workflow.likes_count,
        views_count=workflow.views_count,
        uses_count=workflow.uses_count,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at
    )


@router.get("/export-all")
async def export_all_workflows(
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Export all user's workflows"""
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.owner_id == current_user.id)
    )
    workflows = result.scalars().all()
    
    exports = []
    for workflow in workflows:
        exports.append({
            "id": workflow.id,
            "name": workflow.name,
            "description": workflow.description,
            "version": workflow.version,
            "definition": workflow.definition,
            "created_at": workflow.created_at.isoformat(),
            "updated_at": workflow.updated_at.isoformat()
        })
    
    return JSONResponse(
        content={
            "export_version": "1.0",
            "exported_at": datetime.utcnow().isoformat(),
            "exported_by": current_user.username,
            "workflows": exports
        },
        headers={
            "Content-Disposition": f"attachment; filename=workflows-{current_user.username}.json"
        }
    )

