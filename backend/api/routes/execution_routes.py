"""
Execution routes.
Handles workflow execution and execution history.
"""
import asyncio
from datetime import datetime
from typing import Optional, List, Annotated
from fastapi import APIRouter, HTTPException, Depends, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.schemas import ExecutionRequest, ExecutionResponse, ExecutionStatus, ExecutionLogsResponse
from ...database import get_db, ExecutionDB
from ...database.models import UserDB
from ...auth import get_optional_user, get_current_active_user
from ...utils.logger import get_logger
from ...dependencies import WorkflowServiceDep, WorkflowOwnershipServiceDep, SettingsServiceDep, ExecutionServiceDep
from ...services.execution_orchestrator import ExecutionOrchestrator
from ...exceptions import ExecutionNotFoundError, ExecutionForbiddenError, WorkflowNotFoundError
from ...utils.log_utils import serialize_log_for_json
from ...utils.error_handling import handle_execution_errors

logger = get_logger(__name__)

# P3-5, P3-11: Log download limit. Large values may use significant memory; consider streaming for 100k+ lines.
LOG_DOWNLOAD_LIMIT = 100000

router = APIRouter()


@router.post(
    "/workflows/{workflow_id}/execute",
    response_model=ExecutionResponse,
    summary="Execute Workflow",
    description="Execute a workflow with optional input data",
    responses={
        200: {
            "description": "Workflow execution started",
            "content": {
                "application/json": {
                    "example": {
                        "execution_id": "exec-123",
                        "workflow_id": "workflow-123",
                        "status": "running",
                        "current_node": "start-1",
                        "result": None,
                        "error": None,
                        "started_at": "2026-02-23T12:00:00",
                        "completed_at": None,
                        "logs": []
                    }
                }
            }
        }
    }
)
@handle_execution_errors
async def execute_workflow(
    workflow_id: str,
    execution_request: Optional[ExecutionRequest] = Body(
        None,
        example={
            "workflow_id": "workflow-123",
            "inputs": {
                "user_name": "John Doe",
                "task": "Process data",
                "priority": "high"
            }
        }
    ),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    settings_service: SettingsServiceDep = ...,
    workflow_service: WorkflowServiceDep = ...,
    ownership_service: WorkflowOwnershipServiceDep = ...,
):
    """
    Execute a workflow (optionally authenticated).
    Requires read access to workflow (owner, public, or shared).
    Error handling via @handle_execution_errors (DRY).
    """
    user_id = current_user.id if current_user else None
    logger.info(f"Executing workflow {workflow_id} for user_id: {user_id}")

    await ownership_service.get_workflow_and_assert_can_read_or_share(
        workflow_id, user_id
    )

    orchestrator = ExecutionOrchestrator(db, settings_service, workflow_service)

    execution_id, workflow_def, inputs, executor = await orchestrator.prepare_execution(
        workflow_id=workflow_id,
        user_id=user_id,
        execution_request=execution_request
    )

    await orchestrator.create_execution_record(
        execution_id=execution_id,
        workflow_id=workflow_id,
        user_id=user_id
    )

    asyncio.create_task(
        orchestrator.run_execution_in_background(executor, execution_id, inputs)
    )
    logger.debug(f"Background task created for execution_id={execution_id}")

    response = orchestrator.create_response(execution_id, workflow_id)
    logger.info(f"Workflow execution started: execution_id={execution_id}")
    return response


@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: str,
    execution_service: ExecutionServiceDep = ...,
    current_user: UserDB = Depends(get_current_active_user)
):
    """
    Get execution by ID. C-2: Requires auth; users can only access their own executions.
    """
    try:
        return await execution_service.get_execution(execution_id, user_id=current_user.id)
    except ExecutionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ExecutionForbiddenError:
        raise HTTPException(status_code=403, detail="Not authorized to access this execution")


@router.get("/executions", response_model=List[ExecutionResponse])
async def list_executions(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    status: Optional[str] = Query(None, description="Filter by status (running, completed, failed)"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    execution_service: ExecutionServiceDep = ...,
    current_user: UserDB = Depends(get_current_active_user)
):
    """
    List executions with filtering and pagination.
    M-3/C-2: Requires auth; always filters by current user (user_id from query ignored).
    """
    executions = await execution_service.list_executions(
        workflow_id=workflow_id,
        user_id=current_user.id,
        status=status,
        limit=limit,
        offset=offset
    )
    return executions


@router.get("/workflows/{workflow_id}/executions", response_model=List[ExecutionResponse])
async def list_workflow_executions(
    workflow_id: str,
    status: Optional[str] = Query(None, description="Filter by status (running, completed, failed)"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    execution_service: ExecutionServiceDep = ...,
    ownership_service: WorkflowOwnershipServiceDep = ...,
    current_user: UserDB = Depends(get_current_active_user)
):
    """
    List executions for a specific workflow.
    C-2: Requires auth; only workflows owned by current user.
    """
    await ownership_service.get_workflow_and_assert_owner(
        workflow_id, current_user.id, "list executions"
    )
    executions = await execution_service.list_executions(
        workflow_id=workflow_id,
        user_id=current_user.id,
        status=status,
        limit=limit,
        offset=offset
    )
    return executions


@router.get("/users/{user_id}/executions", response_model=List[ExecutionResponse])
async def list_user_executions(
    user_id: str,
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    status: Optional[str] = Query(None, description="Filter by status (running, completed, failed)"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    execution_service: ExecutionServiceDep = ...,
    current_user: UserDB = Depends(get_current_active_user)
):
    """
    List executions for a specific user.
    P2-2: Users can only list their own executions (IDOR prevention). Requires auth.
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to list executions for this user")
    executions = await execution_service.list_executions(
        workflow_id=workflow_id,
        user_id=user_id,
        status=status,
        limit=limit,
        offset=offset
    )
    
    return executions


@router.get("/executions/running", response_model=List[ExecutionResponse])
async def list_running_executions(
    execution_service: ExecutionServiceDep = ...,
    current_user: UserDB = Depends(get_current_active_user)
):
    """
    List currently running executions for the current user. C-2: Requires auth.
    """
    executions = await execution_service.get_running_executions(user_id=current_user.id)
    return executions


@router.get("/executions/{execution_id}/logs", response_model=ExecutionLogsResponse)
async def get_execution_logs(
    execution_id: str,
    level: Optional[str] = Query(None, description="Filter by log level (INFO, WARNING, ERROR)"),
    node_id: Optional[str] = Query(None, description="Filter by node ID"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of logs to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    execution_service: ExecutionServiceDep = ...,
    current_user: UserDB = Depends(get_current_active_user)
):
    """
    Get execution logs. C-2: Requires auth; users can only access their own execution logs.
    """
    try:
        return await execution_service.get_execution_logs(
            execution_id=execution_id,
            level=level,
            node_id=node_id,
            limit=limit,
            offset=offset,
            user_id=current_user.id
        )
    except ExecutionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ExecutionForbiddenError:
        raise HTTPException(status_code=403, detail="Not authorized to access this execution")


@router.get("/executions/{execution_id}/logs/download")
async def download_execution_logs(
    execution_id: str,
    format: str = Query("text", regex="^(text|json)$", description="Download format (text or json)"),
    level: Optional[str] = Query(None, description="Filter by log level (INFO, WARNING, ERROR)"),
    node_id: Optional[str] = Query(None, description="Filter by node ID"),
    execution_service: ExecutionServiceDep = ...,
    current_user: UserDB = Depends(get_current_active_user)
):
    """
    Download execution logs as a file
    
    Returns logs in text or JSON format with proper download headers.
    Uses ExecutionService for business logic (Dependency Inversion).
    """
    from fastapi.responses import Response
    from datetime import datetime
    
    try:
        logs_response = await execution_service.get_execution_logs(
            execution_id=execution_id,
            level=level,
            node_id=node_id,
            limit=LOG_DOWNLOAD_LIMIT,
            offset=0,
            user_id=current_user.id
        )
        
        if format == "json":
            import json
            content = json.dumps({
                "execution_id": execution_id,
                "logs": [serialize_log_for_json(log) for log in logs_response.logs],
                "total": logs_response.total
            }, indent=2, default=str)
            media_type = "application/json"
            filename = f"execution_{execution_id}_logs.json"
        else:  # text format
            content_lines = []
            content_lines.append(f"Execution Logs for {execution_id}")
            content_lines.append(f"Total Logs: {logs_response.total}")
            content_lines.append("=" * 80)
            content_lines.append("")
            
            for log in logs_response.logs:
                log_dict = serialize_log_for_json(log)
                timestamp = log_dict.get('timestamp', '')
                log_level = log_dict.get('level', 'INFO')
                node = log_dict.get('node_id', '')
                message = log_dict.get('message', '')
                
                node_str = f" [{node}]" if node else ""
                content_lines.append(f"[{timestamp}] {log_level}{node_str}: {message}")
            
            content = "\n".join(content_lines)
            media_type = "text/plain"
            filename = f"execution_{execution_id}_logs.txt"
        
        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except ExecutionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ExecutionForbiddenError:
        raise HTTPException(status_code=403, detail="Not authorized to access this execution")


@router.post("/executions/{execution_id}/cancel", response_model=ExecutionResponse)
async def cancel_execution(
    execution_id: str,
    execution_service: ExecutionServiceDep = ...,
    current_user: UserDB = Depends(get_current_active_user)
):
    """
    Cancel a running execution. C-2: Requires auth; users can only cancel their own executions.
    """
    try:
        return await execution_service.cancel_execution(execution_id, user_id=current_user.id)
    except ExecutionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ExecutionForbiddenError:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this execution")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

