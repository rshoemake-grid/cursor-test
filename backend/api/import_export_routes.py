"""Workflow import/export API routes for Phase 4"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import json

from backend.database.db import get_db
from backend.database.models import UserDB
from backend.models.schemas import WorkflowExport, WorkflowImport, WorkflowResponseV2
from backend.utils.workflow_serialization import workflow_db_to_response_v2
from backend.auth import get_current_active_user, get_optional_user
from backend.dependencies import WorkflowOwnershipServiceDep, ImportExportServiceDep

router = APIRouter(prefix="/import-export", tags=["Import/Export"])


@router.get("/export/{workflow_id}")
async def export_workflow(
    workflow_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
    ownership_service: WorkflowOwnershipServiceDep = ...,
):
    """Export a workflow as JSON"""
    workflow = await ownership_service.get_workflow_and_assert_can_read(
        workflow_id, current_user.id if current_user else None
    )
    
    # Create export
    export_data = WorkflowExport(
        workflow=workflow_db_to_response_v2(workflow),
        version="1.0",
        exported_at=datetime.now(timezone.utc),
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
    db: AsyncSession = Depends(get_db),
    import_export_service: ImportExportServiceDep = ...,
):
    """Import a workflow from JSON"""
    definition = import_data.definition
    if "nodes" not in definition or "edges" not in definition:
        raise HTTPException(
            status_code=400,
            detail="Invalid workflow definition: must contain 'nodes' and 'edges'"
        )
    workflow = await import_export_service.import_workflow(
        definition=definition,
        name=import_data.name,
        description=import_data.description,
        owner_id=current_user.id if current_user else None,
    )
    return workflow_db_to_response_v2(workflow)


@router.post("/import/file", response_model=WorkflowResponseV2, status_code=201)
async def import_workflow_file(
    file: UploadFile = File(...),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
    import_export_service: ImportExportServiceDep = ...,
):
    """Import a workflow from uploaded JSON file"""
    try:
        content = await file.read()
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    try:
        workflow = await import_export_service.import_workflow_from_file_data(
            data=data,
            owner_id=current_user.id if current_user else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return workflow_db_to_response_v2(workflow)


@router.get("/export-all")
async def export_all_workflows(
    current_user: UserDB = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    import_export_service: ImportExportServiceDep = ...,
):
    """Export all user's workflows"""
    content = await import_export_service.export_all_workflows(
        user_id=current_user.id,
        username=current_user.username or "user",
    )
    return JSONResponse(
        content=content,
        headers={
            "Content-Disposition": f"attachment; filename=workflows-{current_user.username or 'user'}.json"
        }
    )

