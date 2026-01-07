"""
Execution routes.
Handles workflow execution and execution history.
"""
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.schemas import ExecutionRequest, ExecutionResponse, WorkflowDefinition
from ...database import get_db, WorkflowDB, ExecutionDB
from ...database.db import AsyncSessionLocal
from ...database.models import UserDB
from ...engine import WorkflowExecutor
from ...auth import get_optional_user
from ...utils.logger import get_logger
from ...dependencies import WorkflowServiceDep
from ...exceptions import WorkflowNotFoundError

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
        if node_data.get('type') == 'loop' and not node_data.get('loop_config'):
            logger.warning(f"Loop node {node_id} missing loop_config after reconstruction")
            if "data" in node_data and node_data.get("data"):
                data_obj = node_data.get("data") if isinstance(node_data.get("data"), dict) else {}
                data_loop_config = data_obj.get('loop_config')
                if data_loop_config:
                    node_data['loop_config'] = data_loop_config
        
        if node_data.get('type') == 'condition' and not node_data.get('condition_config'):
            logger.warning(f"Condition node {node_id} missing condition_config after reconstruction")
            if "data" in node_data and node_data.get("data"):
                data_obj = node_data.get("data") if isinstance(node_data.get("data"), dict) else {}
                data_condition_config = data_obj.get('condition_config')
                if data_condition_config:
                    node_data['condition_config'] = data_condition_config
        
        if node_data.get('type') == 'agent' and not node_data.get('agent_config'):
            logger.warning(f"Agent node {node_id} missing agent_config after reconstruction")
            if "data" in node_data and node_data.get("data"):
                data_obj = node_data.get("data") if isinstance(node_data.get("data"), dict) else {}
                data_agent_config = data_obj.get('agent_config')
                if data_agent_config:
                    node_data['agent_config'] = data_agent_config
        
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
    execution_request: ExecutionRequest = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Execute a workflow (optionally authenticated)"""
    from ...api.settings_routes import get_active_llm_config
    from ...dependencies import get_workflow_service
    
    try:
        workflow_service = get_workflow_service(db)
        
        # Get workflow
        try:
            workflow_db = await workflow_service.get_workflow(workflow_id)
        except WorkflowNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
        
        user_id = current_user.id if current_user else None
        
        # Get LLM config for execution
        try:
            llm_config = get_active_llm_config(user_id)
            
            # If not found in cache, try loading from database
            if not llm_config:
                from ...api.settings_routes import load_settings_into_cache
                logger.info("LLM config not found in cache, loading from database...")
                await load_settings_into_cache(db)
                llm_config = get_active_llm_config(user_id)
            
            if not llm_config:
                raise HTTPException(
                    status_code=400, 
                    detail="No LLM provider configured. Please configure an LLM provider in Settings before executing workflows."
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting LLM config: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to get LLM configuration: {str(e)}")
        
        # Reconstruct workflow definition
        try:
            workflow_def = reconstruct_workflow_definition({
                "id": workflow_db.id,
                "name": workflow_db.name,
                "description": workflow_db.description,
                **workflow_db.definition
            })
        except Exception as e:
            logger.error(f"Error reconstructing workflow definition: {e}", exc_info=True)
            raise HTTPException(status_code=422, detail=f"Invalid workflow definition: {str(e)}")
        
        # Create executor to get execution_id immediately
        try:
            executor = WorkflowExecutor(workflow_def, stream_updates=True, llm_config=llm_config, user_id=user_id)
            execution_id = executor.execution_id
        except Exception as e:
            logger.error(f"Error creating executor: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to create workflow executor: {str(e)}")
        
        inputs = execution_request.inputs if execution_request else {}
        
        # Create initial execution record in database (status: running)
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
                execution_state = await executor.execute(inputs)
                
                # Update execution in database
                async with AsyncSessionLocal() as db_session:
                    result = await db_session.execute(
                        select(ExecutionDB).where(ExecutionDB.id == execution_id)
                    )
                    db_exec = result.scalar_one_or_none()
                    if db_exec:
                        db_exec.status = execution_state.status.value
                        db_exec.state = execution_state.model_dump(mode='json')
                        db_exec.completed_at = execution_state.completed_at
                        await db_session.commit()
            except Exception as e:
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
                logger.error(f"Execution {execution_id} failed: {e}", exc_info=True)
        
        # Start execution in background
        asyncio.create_task(run_execution())
        
        return ExecutionResponse(
            execution_id=execution_id,
            workflow_id=workflow_id,
            status="running"
        )
    except HTTPException:
        # Re-raise HTTP exceptions (404, 422, etc.)
        raise
    except Exception as e:
        logger.error(f"Unexpected error executing workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get execution by ID"""
    result = await db.execute(
        select(ExecutionDB).where(ExecutionDB.id == execution_id)
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")
    
    return ExecutionResponse(
        execution_id=execution.id,
        workflow_id=execution.workflow_id,
        status=execution.status
    )

