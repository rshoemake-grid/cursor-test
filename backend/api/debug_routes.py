"""Advanced debugging API routes for Phase 4"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone
import json

from backend.database.db import get_db
from backend.database.models import WorkflowDB, ExecutionDB, UserDB
from backend.models.schemas import ExecutionResponse, ExecutionStatus
from backend.auth import get_current_active_user
from backend.dependencies import WorkflowOwnershipServiceDep, ExecutionServiceDep
from backend.exceptions import ExecutionNotFoundError, ExecutionForbiddenError
from backend.services.workflow_validation_service import validate_workflow_definition

router = APIRouter(prefix="/debug", tags=["Debugging"])


@router.get("/workflow/{workflow_id}/validate")
async def validate_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
):
    """Validate a workflow for potential issues. Requires read access (owner or shared)."""
    workflow = await ownership_service.get_workflow_and_assert_can_read_or_share(
        workflow_id, current_user.id
    )
    definition = workflow.definition or {}
    return validate_workflow_definition(workflow_id, definition)


@router.get("/workflow/{workflow_id}/executions/history")
async def get_execution_history(
    workflow_id: str,
    limit: int = Query(10, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
):
    """Get execution history for a workflow. Requires read access (owner or shared)."""
    await ownership_service.get_workflow_and_assert_can_read_or_share(
        workflow_id, current_user.id
    )
    query = select(ExecutionDB).where(ExecutionDB.workflow_id == workflow_id)
    
    if status:
        query = query.where(ExecutionDB.status == status)
    
    query = query.order_by(desc(ExecutionDB.started_at)).limit(limit)
    
    result = await db.execute(query)
    executions = result.scalars().all()
    
    return [
        {
            "execution_id": e.id,
            "workflow_id": e.workflow_id,
            "status": e.status,
            "started_at": e.started_at,
            "completed_at": e.completed_at,
            "duration_seconds": (
                (e.completed_at - e.started_at).total_seconds()
                if e.completed_at else None
            )
        }
        for e in executions
    ]


@router.get("/execution/{execution_id}/timeline")
async def get_execution_timeline(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user),
    execution_service: ExecutionServiceDep = ...,
):
    """Get detailed timeline of execution. Requires execution ownership."""
    execution = await execution_service.get_execution_db(execution_id, current_user.id)
    
    state = execution.state
    logs = state.get("logs", [])
    node_states = state.get("node_states", {})
    
    # Build timeline
    timeline = []
    for log in logs:
        timeline.append({
            "timestamp": log.get("timestamp"),
            "level": log.get("level"),
            "node_id": log.get("node_id"),
            "message": log.get("message")
        })
    
    return {
        "execution_id": execution_id,
        "status": execution.status,
        "started_at": execution.started_at,
        "completed_at": execution.completed_at,
        "timeline": timeline,
        "node_states": node_states
    }


@router.get("/execution/{execution_id}/node/{node_id}")
async def get_node_execution_details(
    execution_id: str,
    node_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user),
    execution_service: ExecutionServiceDep = ...,
):
    """Get detailed execution information for a specific node. Requires execution ownership."""
    execution = await execution_service.get_execution_db(execution_id, current_user.id)
    
    state = execution.state
    node_states = state.get("node_states", {})
    
    if node_id not in node_states:
        raise HTTPException(status_code=404, detail="Node not found in execution")
    
    node_state = node_states[node_id]
    
    # Get logs for this node
    logs = [
        log for log in state.get("logs", [])
        if log.get("node_id") == node_id
    ]
    
    return {
        "execution_id": execution_id,
        "node_id": node_id,
        "status": node_state.get("status"),
        "inputs": node_state.get("inputs"),
        "output": node_state.get("output"),
        "error": node_state.get("error"),
        "logs": logs
    }


@router.get("/workflow/{workflow_id}/stats")
async def get_workflow_stats(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user),
    ownership_service: WorkflowOwnershipServiceDep = ...,
):
    """Get statistics for a workflow. Requires read access (owner or shared)."""
    await ownership_service.get_workflow_and_assert_can_read_or_share(
        workflow_id, current_user.id
    )
    # Get all executions
    result = await db.execute(
        select(ExecutionDB).where(ExecutionDB.workflow_id == workflow_id)
    )
    executions = result.scalars().all()
    
    if not executions:
        return {
            "workflow_id": workflow_id,
            "total_executions": 0,
            "success_count": 0,
            "failure_count": 0,
            "average_duration_seconds": None
        }
    
    from ...models.schemas import ExecutionStatus
    success_count = sum(1 for e in executions if e.status == ExecutionStatus.COMPLETED.value)
    failure_count = sum(1 for e in executions if e.status == ExecutionStatus.FAILED.value)
    
    # Calculate average duration
    durations = [
        (e.completed_at - e.started_at).total_seconds()
        for e in executions
        if e.completed_at
    ]
    avg_duration = sum(durations) / len(durations) if durations else None
    
    return {
        "workflow_id": workflow_id,
        "total_executions": len(executions),
        "success_count": success_count,
        "failure_count": failure_count,
        "success_rate": success_count / len(executions) if executions else 0,
        "average_duration_seconds": avg_duration
    }


@router.post("/execution/{execution_id}/export")
async def export_execution(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user),
    execution_service: ExecutionServiceDep = ...,
):
    """Export execution data for debugging. Requires execution ownership."""
    execution = await execution_service.get_execution_db(execution_id, current_user.id)
    
    # Get workflow
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == execution.workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    return {
        "export_version": "1.0",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "execution": {
            "id": execution.id,
            "workflow_id": execution.workflow_id,
            "status": execution.status,
            "started_at": execution.started_at.isoformat(),
            "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
            "state": execution.state
        },
        "workflow": {
            "id": workflow.id if workflow else None,
            "name": workflow.name if workflow else None,
            "definition": workflow.definition if workflow else None
        }
    }

