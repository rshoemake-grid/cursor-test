import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.schemas import (
    WorkflowCreate,
    WorkflowResponse,
    WorkflowDefinition,
    ExecutionRequest,
    ExecutionResponse
)
from ..database import get_db, WorkflowDB, ExecutionDB
from ..database.models import UserDB
from ..engine.executor_v3 import WorkflowExecutorV3 as WorkflowExecutor
from ..auth import get_optional_user

router = APIRouter()


@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Create a new workflow (optionally authenticated)"""
    workflow_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Create workflow definition
    workflow_def = WorkflowDefinition(
        id=workflow_id,
        name=workflow.name,
        description=workflow.description,
        nodes=workflow.nodes,
        edges=workflow.edges,
        variables=workflow.variables,
        created_at=now,
        updated_at=now
    )
    
    # Save to database with Phase 4 fields
    db_workflow = WorkflowDB(
        id=workflow_id,
        name=workflow.name,
        description=workflow.description,
        definition={
            "nodes": [node.model_dump() for node in workflow.nodes],
            "edges": [edge.model_dump() for edge in workflow.edges],
            "variables": workflow.variables
        },
        # Phase 4 fields (optional)
        owner_id=current_user.id if current_user else None,
        is_public=False,
        is_template=False,
        category=None,
        tags=[],
        created_at=now,
        updated_at=now
    )
    
    db.add(db_workflow)
    await db.commit()
    await db.refresh(db_workflow)
    
    return WorkflowResponse(
        id=db_workflow.id,
        name=db_workflow.name,
        description=db_workflow.description,
        version=db_workflow.version,
        nodes=workflow.nodes,
        edges=workflow.edges,
        variables=workflow.variables,
        created_at=db_workflow.created_at,
        updated_at=db_workflow.updated_at
    )


@router.get("/workflows", response_model=List[WorkflowResponse])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    """List all workflows"""
    result = await db.execute(select(WorkflowDB))
    workflows = result.scalars().all()
    
    response = []
    for wf in workflows:
        definition = wf.definition
        response.append(WorkflowResponse(
            id=wf.id,
            name=wf.name,
            description=wf.description,
            version=wf.version,
            nodes=[],  # Can expand if needed
            edges=[],
            variables=definition.get("variables", {}),
            created_at=wf.created_at,
            updated_at=wf.updated_at
        ))
    
    return response


@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific workflow"""
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    from ..models.schemas import Node, Edge
    
    definition = workflow.definition
    nodes = [Node(**node_data) for node_data in definition.get("nodes", [])]
    edges = [Edge(**edge_data) for edge_data in definition.get("edges", [])]
    
    return WorkflowResponse(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        version=workflow.version,
        nodes=nodes,
        edges=edges,
        variables=definition.get("variables", {}),
        created_at=workflow.created_at,
        updated_at=workflow.updated_at
    )


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Update an existing workflow"""
    # Get existing workflow
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    db_workflow = result.scalar_one_or_none()
    
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check permissions (if user is authenticated, they must own the workflow)
    if current_user and db_workflow.owner_id and db_workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this workflow")
    
    # Update workflow
    db_workflow.name = workflow.name
    db_workflow.description = workflow.description
    db_workflow.definition = {
        "nodes": [node.model_dump() for node in workflow.nodes],
        "edges": [edge.model_dump() for edge in workflow.edges],
        "variables": workflow.variables
    }
    db_workflow.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(db_workflow)
    
    return WorkflowResponse(
        id=db_workflow.id,
        name=db_workflow.name,
        description=db_workflow.description,
        version=db_workflow.version,
        nodes=workflow.nodes,
        edges=workflow.edges,
        variables=workflow.variables,
        created_at=db_workflow.created_at,
        updated_at=db_workflow.updated_at
    )


@router.delete("/workflows/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Delete a workflow"""
    # Get existing workflow
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    db_workflow = result.scalar_one_or_none()
    
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check permissions (if user is authenticated, they must own the workflow)
    if current_user and db_workflow.owner_id and db_workflow.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this workflow")
    
    await db.delete(db_workflow)
    await db.commit()


@router.post("/workflows/{workflow_id}/execute", response_model=ExecutionResponse)
async def execute_workflow(
    workflow_id: str,
    execution_request: ExecutionRequest = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Execute a workflow (optionally authenticated)"""
    # Get workflow
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    workflow_db = result.scalar_one_or_none()
    
    if not workflow_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Reconstruct workflow definition
    from ..models.schemas import Node, Edge
    
    definition = workflow_db.definition
    
    # Helper function to reconstruct nodes from database
    def reconstruct_node(node_data: dict) -> Node:
        """Reconstruct a Node, handling both flat and nested data structures"""
        # If data object exists, merge it with top-level fields
        if "data" in node_data and node_data["data"]:
            data_obj = node_data["data"]
            # Merge data object fields into top level if not already present
            for key in ["name", "description", "agent_config", "condition_config", "loop_config", "inputs"]:
                if key not in node_data or node_data[key] is None:
                    if key in data_obj:
                        node_data[key] = data_obj[key]
        
        # Debug logging
        print(f"Reconstructing node {node_data.get('id')}: has agent_config={node_data.get('agent_config') is not None}")
        
        return Node(**node_data)
    
    nodes = [reconstruct_node(node_data) for node_data in definition.get("nodes", [])]
    edges = [Edge(**edge_data) for edge_data in definition.get("edges", [])]
    
    workflow_def = WorkflowDefinition(
        id=workflow_db.id,
        name=workflow_db.name,
        description=workflow_db.description,
        version=workflow_db.version,
        nodes=nodes,
        edges=edges,
        variables=definition.get("variables", {}),
        created_at=workflow_db.created_at,
        updated_at=workflow_db.updated_at
    )
    
    # Get LLM configuration from settings
    from .settings_routes import get_active_llm_config
    llm_config = get_active_llm_config(current_user.id if current_user else None)
    
    # Execute workflow with WebSocket streaming enabled
    executor = WorkflowExecutor(workflow_def, stream_updates=True, llm_config=llm_config)
    inputs = execution_request.inputs if execution_request else {}
    execution_state = await executor.execute(inputs)
    
    # Save execution to database (with optional user_id)
    db_execution = ExecutionDB(
        id=execution_state.execution_id,
        workflow_id=workflow_id,
        user_id=current_user.id if current_user else None,
        status=execution_state.status.value,
        state=execution_state.model_dump(mode='json'),
        started_at=execution_state.started_at,
        completed_at=execution_state.completed_at
    )
    
    db.add(db_execution)
    await db.commit()
    
    return ExecutionResponse(
        execution_id=execution_state.execution_id,
        workflow_id=execution_state.workflow_id,
        status=execution_state.status,
        current_node=execution_state.current_node,
        result=execution_state.result,
        error=execution_state.error,
        started_at=execution_state.started_at,
        completed_at=execution_state.completed_at,
        logs=execution_state.logs
    )


@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution(execution_id: str, db: AsyncSession = Depends(get_db)):
    """Get execution details"""
    result = await db.execute(
        select(ExecutionDB).where(ExecutionDB.id == execution_id)
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    state = execution.state
    
    return ExecutionResponse(
        execution_id=execution.id,
        workflow_id=execution.workflow_id,
        status=state.get("status"),
        current_node=state.get("current_node"),
        result=state.get("result"),
        error=state.get("error"),
        started_at=state.get("started_at"),
        completed_at=state.get("completed_at"),
        logs=state.get("logs", [])
    )


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a workflow"""
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await db.delete(workflow)
    await db.commit()
    
    return {"message": "Workflow deleted successfully"}

