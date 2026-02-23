"""
Execution routes.
Handles workflow execution and execution history.
"""
import asyncio
from datetime import datetime
from typing import Optional, Annotated
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from typing import Optional, List
from fastapi import Query

from ...models.schemas import ExecutionRequest, ExecutionResponse, WorkflowDefinition, ExecutionStatus
from ...database import get_db, WorkflowDB, ExecutionDB
from ...database.db import AsyncSessionLocal
from ...database.models import UserDB
from ...engine import WorkflowExecutor
from ...auth import get_optional_user
from ...utils.logger import get_logger
from ...dependencies import WorkflowServiceDep, SettingsServiceDep, ExecutionServiceDep
from ...services.settings_service import ISettingsService
from ...exceptions import WorkflowNotFoundError, ExecutionNotFoundError

logger = get_logger(__name__)

router = APIRouter()


def reconstruct_workflow_definition(definition: dict) -> WorkflowDefinition:
    """Reconstruct WorkflowDefinition from database JSON"""
    from ...models.schemas import Node, Edge, NodeType, AgentConfig, ConditionConfig, LoopConfig
    import json
    
    nodes_data = definition.get("nodes", [])
    nodes = []
    
    logger.debug(f"Found {len(nodes_data)} nodes in workflow definition")
    
    for i, node_data in enumerate(nodes_data):
        node_id = node_data.get('id', f'unknown-{i}')
        node_type = node_data.get('type', 'unknown')
        logger.debug(f"Node {i}: id={node_id}, type={node_type}")
        
        # Handle config extraction from data object if needed
        # Extract configs from data object first, then check if still missing
        if "data" in node_data and node_data.get("data") and isinstance(node_data.get("data"), dict):
            data_obj = node_data.get("data")
            
            # Extract loop_config from data if missing at top level
            if node_data.get('type') == 'loop' and not node_data.get('loop_config'):
                data_loop_config = data_obj.get('loop_config')
                if data_loop_config:
                    logger.debug(f"Extracting loop_config from data object for node {node_id}")
                    node_data['loop_config'] = data_loop_config
            
            # Extract condition_config from data if missing at top level
            if node_data.get('type') == 'condition' and not node_data.get('condition_config'):
                data_condition_config = data_obj.get('condition_config')
                if data_condition_config:
                    logger.debug(f"Extracting condition_config from data object for node {node_id}")
                    node_data['condition_config'] = data_condition_config
            
            # Extract agent_config from data if missing at top level
            if node_data.get('type') == 'agent' and not node_data.get('agent_config'):
                data_agent_config = data_obj.get('agent_config')
                if data_agent_config:
                    logger.debug(f"Extracting agent_config from data object for node {node_id}")
                    node_data['agent_config'] = data_agent_config
        
        # Log at debug level if config is still missing after extraction attempt
        # These configs are optional in the Node model, so this is informational only
        if node_data.get('type') == 'loop' and not node_data.get('loop_config'):
            logger.debug(f"Loop node {node_id} missing loop_config after extraction attempt")
        
        if node_data.get('type') == 'condition' and not node_data.get('condition_config'):
            logger.debug(f"Condition node {node_id} missing condition_config after extraction attempt")
        
        if node_data.get('type') == 'agent' and not node_data.get('agent_config'):
            logger.debug(f"Agent node {node_id} missing agent_config after extraction attempt")
        
        try:
            node = Node(**node_data)
            logger.debug(f"Successfully reconstructed node {i}: {node.id} ({node.type})")
            nodes.append(node)
        except Exception as e:
            logger.error(f"Error reconstructing node {i} (id={node_data.get('id', 'unknown')}): {e}, node data: {json.dumps(node_data, indent=2, default=str)}", exc_info=True)
            raise HTTPException(status_code=422, detail=f"Invalid node data at index {i}: {str(e)}")
    
    edges = [Edge(**edge_data) for edge_data in definition.get("edges", [])]
    
    return WorkflowDefinition(
        id=definition.get("id"),
        name=definition.get("name", ""),
        description=definition.get("description"),
        nodes=nodes,
        edges=edges,
        variables=definition.get("variables", {})
    )


@router.post("/workflows/{workflow_id}/execute", response_model=ExecutionResponse)
async def execute_workflow(
    workflow_id: str,
    execution_request: Optional[ExecutionRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    settings_service: SettingsServiceDep = ...
):
    """Execute a workflow (optionally authenticated)"""
    from ...dependencies import get_workflow_service
    
    try:
        logger.info(f"=== EXECUTE WORKFLOW REQUEST START ===")
        logger.info(f"workflow_id={workflow_id}")
        logger.info(f"execution_request={execution_request}")
        logger.info(f"current_user={current_user.id if current_user else None}")
        logger.info(f"has_settings_service={settings_service is not None}")
        logger.info(f"Starting workflow execution request for workflow_id={workflow_id}")
        workflow_service = get_workflow_service(db)
        
        # Get workflow
        try:
            workflow_db = await workflow_service.get_workflow(workflow_id)
            logger.debug(f"Retrieved workflow: {workflow_db.name} (id={workflow_db.id})")
        except WorkflowNotFoundError as e:
            logger.warning(f"Workflow not found: {workflow_id}")
            raise HTTPException(status_code=404, detail=str(e))
        
        user_id = current_user.id if current_user else None
        
        logger.info(f"Executing workflow {workflow_id} for user_id: {user_id}, authenticated: {current_user is not None}")
        
        # Get LLM config for execution using SettingsService
        try:
            llm_config = settings_service.get_active_llm_config(user_id)
            logger.debug(f"Initial LLM config lookup result: {llm_config is not None}")
            
            # If not found in cache, try loading from database
            if not llm_config:
                from ...api.settings_routes import load_settings_into_cache
                logger.info(f"LLM config not found in cache for user_id={user_id}, loading from database...")
                await load_settings_into_cache(db)
                llm_config = settings_service.get_active_llm_config(user_id)
                logger.debug(f"After loading from DB, LLM config result: {llm_config is not None}")
            
            if not llm_config:
                error_msg = f"No LLM provider configured for user_id={user_id}. Please configure an LLM provider in Settings before executing workflows."
                logger.warning(error_msg)
                raise HTTPException(
                    status_code=400, 
                    detail=error_msg
                )
            
            logger.info(f"Using LLM config: type={llm_config.get('type')}, model={llm_config.get('model')}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting LLM config for user_id={user_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to get LLM configuration: {str(e)}")
        
        # Reconstruct workflow definition
        try:
            logger.debug(f"Reconstructing workflow definition for workflow_id={workflow_id}")
            workflow_def_dict = {
                "id": workflow_db.id,
                "name": workflow_db.name,
                "description": workflow_db.description,
                **workflow_db.definition
            }
            logger.debug(f"Workflow definition keys: {list(workflow_def_dict.keys())}")
            workflow_def = reconstruct_workflow_definition(workflow_def_dict)
            logger.info(f"Successfully reconstructed workflow definition with {len(workflow_def.nodes)} nodes")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error reconstructing workflow definition for workflow_id={workflow_id}: {e}", exc_info=True)
            raise HTTPException(status_code=422, detail=f"Invalid workflow definition: {str(e)}")
        
        # Create executor to get execution_id immediately
        try:
            logger.debug(f"Creating WorkflowExecutor with llm_config type={llm_config.get('type')}")
            executor = WorkflowExecutor(workflow_def, stream_updates=True, llm_config=llm_config, user_id=user_id)
            execution_id = executor.execution_id
            logger.info(f"Created executor with execution_id={execution_id}")
        except Exception as e:
            logger.error(f"Error creating executor for workflow_id={workflow_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to create workflow executor: {str(e)}")
        
        inputs = execution_request.inputs if execution_request else {}
        logger.info(f"Execution inputs: {inputs}")
        logger.debug(f"Inputs type: {type(inputs)}, keys: {list(inputs.keys()) if isinstance(inputs, dict) else 'not a dict'}")
        
        # Create initial execution record in database (status: running)
        logger.info(f"Creating execution record in database with execution_id={execution_id}")
        try:
            db_execution = ExecutionDB(
                id=execution_id,
                workflow_id=workflow_id,
                user_id=user_id,
                status='running',
                state={},
                started_at=datetime.utcnow(),
                completed_at=None
            )
            db.add(db_execution)
            await db.commit()
        except Exception as e:
            logger.error(f"Error creating execution record: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to create execution record: {str(e)}")
        
        # Define background task to run execution and update database
        async def run_execution():
            try:
                logger.info(f"=== BACKGROUND EXECUTION START ===")
                logger.info(f"execution_id={execution_id}, workflow_id={workflow_id}")
                logger.info(f"inputs={inputs}, inputs_type={type(inputs)}")
                logger.info(f"executor type={type(executor)}")
                execution_state = await executor.execute(inputs)
                logger.info(f"Execution completed: status={execution_state.status}")
                logger.info(f"Execution result: {execution_state.result}")
                
                # Update execution in database
                logger.info(f"Updating execution record in database for execution_id={execution_id}")
                async with AsyncSessionLocal() as db_session:
                    result = await db_session.execute(
                        select(ExecutionDB).where(ExecutionDB.id == execution_id)
                    )
                    db_exec = result.scalar_one_or_none()
                    if db_exec:
                        logger.info(f"Found execution record, updating status to {execution_state.status.value}")
                        db_exec.status = execution_state.status.value
                        db_exec.state = execution_state.model_dump(mode='json')
                        db_exec.completed_at = execution_state.completed_at
                        await db_session.commit()
                        logger.info(f"Execution record updated successfully")
                    else:
                        logger.warning(f"Execution record not found in database for execution_id={execution_id}")
            except Exception as e:
                logger.error(f"=== BACKGROUND EXECUTION ERROR ===")
                logger.error(f"Execution {execution_id} failed: {e}", exc_info=True)
                logger.error(f"Exception type: {type(e).__name__}")
                # Update execution status to failed
                async with AsyncSessionLocal() as db_session:
                    result = await db_session.execute(
                        select(ExecutionDB).where(ExecutionDB.id == execution_id)
                    )
                    db_exec = result.scalar_one_or_none()
                    if db_exec:
                        db_exec.status = 'failed'
                        db_exec.completed_at = datetime.utcnow()
                        await db_session.commit()
                        logger.info(f"Updated execution record status to 'failed'")
        
        # Start execution in background
        logger.info(f"Creating background task for execution_id={execution_id}")
        task = asyncio.create_task(run_execution())
        logger.info(f"Background task created: task={task}, done={task.done()}")
        
        started_at = datetime.utcnow()
        response = ExecutionResponse(
            execution_id=execution_id,
            workflow_id=workflow_id,
            status=ExecutionStatus.RUNNING,
            started_at=started_at
        )
        logger.info(f"=== EXECUTE WORKFLOW REQUEST END ===")
        logger.info(f"Returning response: execution_id={response.execution_id}, status={response.status}")
        return response
    except HTTPException as e:
        logger.error(f"=== EXECUTE WORKFLOW HTTP ERROR ===")
        logger.error(f"HTTPException: status={e.status_code}, detail={e.detail}")
        # Re-raise HTTP exceptions (404, 422, etc.)
        raise
    except Exception as e:
        logger.error(f"=== EXECUTE WORKFLOW UNEXPECTED ERROR ===")
        logger.error(f"Unexpected error executing workflow: {e}", exc_info=True)
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception args: {e.args}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: str,
    execution_service: ExecutionServiceDep = ...
):
    """
    Get execution by ID
    
    Uses ExecutionService following SOLID principles (Dependency Inversion)
    """
    try:
        return await execution_service.get_execution(execution_id)
    except ExecutionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/executions", response_model=List[ExecutionResponse])
async def list_executions(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by status (running, completed, failed)"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    execution_service: ExecutionServiceDep = ...,
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """
    List executions with filtering and pagination
    
    If user_id is not provided and user is authenticated, filters by current user.
    Follows SOLID principles with service layer abstraction.
    """
    # If user_id not provided but user is authenticated, use current user (DRY - avoid duplication)
    effective_user_id = user_id if user_id else (current_user.id if current_user else None)
    
    executions = await execution_service.list_executions(
        workflow_id=workflow_id,
        user_id=effective_user_id,
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
    execution_service: ExecutionServiceDep = ...
):
    """
    List executions for a specific workflow
    
    Follows Single Responsibility Principle - dedicated endpoint for workflow executions.
    Uses ExecutionService for business logic (Dependency Inversion).
    """
    executions = await execution_service.list_executions(
        workflow_id=workflow_id,
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
    execution_service: ExecutionServiceDep = ...
):
    """
    List executions for a specific user
    
    Follows Single Responsibility Principle - dedicated endpoint for user executions.
    Uses ExecutionService for business logic (Dependency Inversion).
    """
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
    execution_service: ExecutionServiceDep = ...
):
    """
    List all currently running executions
    
    Follows Single Responsibility Principle - dedicated endpoint for running executions.
    Uses ExecutionService for business logic (Dependency Inversion).
    """
    executions = await execution_service.get_running_executions()
    return executions

