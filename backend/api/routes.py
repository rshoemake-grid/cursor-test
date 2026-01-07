import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from ..models.schemas import (
    WorkflowCreate,
    WorkflowResponse,
    WorkflowDefinition,
    ExecutionRequest,
    ExecutionResponse
)
from ..database import get_db, WorkflowDB, ExecutionDB
from ..database.db import AsyncSessionLocal
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
    try:
        workflow_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Validate and process edges - ensure all have IDs
        processed_edges = []
        for i, edge in enumerate(workflow.edges):
            if not hasattr(edge, 'id') or not edge.id:
                # Generate ID if missing
                edge_id = f"e-{edge.source}-{edge.target}-{i}"
                edge_dict = edge.model_dump() if hasattr(edge, 'model_dump') else dict(edge)
                edge_dict['id'] = edge_id
                processed_edges.append(edge_dict)
            else:
                processed_edges.append(edge.model_dump() if hasattr(edge, 'model_dump') else dict(edge))
        
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
                "edges": processed_edges,
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
        
        # Convert processed edges back to Edge objects for response
        from ..models.schemas import Edge
        response_edges = [Edge(**e) for e in processed_edges]
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error creating workflow: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    
    return WorkflowResponse(
        id=db_workflow.id,
        name=db_workflow.name,
        description=db_workflow.description,
        version=db_workflow.version,
        nodes=workflow.nodes,
        edges=response_edges if 'response_edges' in locals() else workflow.edges,
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
    try:
        result = await db.execute(
            select(WorkflowDB).where(WorkflowDB.id == workflow_id)
        )
        workflow = result.scalar_one_or_none()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        from ..models.schemas import Node, Edge
        
        definition = workflow.definition
        
        # Reconstruct nodes with error handling
        nodes = []
        for i, node_data in enumerate(definition.get("nodes", [])):
            try:
                nodes.append(Node(**node_data))
            except Exception as e:
                print(f"Error reconstructing node {i}: {e}")
                print(f"Node data: {node_data}")
                raise HTTPException(status_code=422, detail=f"Invalid node data at index {i}: {str(e)}")
        
        # Reconstruct edges with error handling - ensure all have IDs
        edges = []
        for i, edge_data in enumerate(definition.get("edges", [])):
            try:
                # Ensure edge has an ID
                if "id" not in edge_data or not edge_data["id"]:
                    edge_data["id"] = f"e-{edge_data.get('source', 'unknown')}-{edge_data.get('target', 'unknown')}-{i}"
                edges.append(Edge(**edge_data))
            except Exception as e:
                print(f"Error reconstructing edge {i}: {e}")
                print(f"Edge data: {edge_data}")
                raise HTTPException(status_code=422, detail=f"Invalid edge data at index {i}: {str(e)}")
        
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
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error getting workflow: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=422, detail=f"Error loading workflow: {str(e)}")


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Update an existing workflow"""
    import traceback
    try:
        # Debug: Log incoming workflow data
        print(f"Updating workflow {workflow_id} with {len(workflow.nodes)} nodes and {len(workflow.edges)} edges")
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
        
        # Validate and process edges - ensure all have IDs
        processed_edges = []
        for i, edge in enumerate(workflow.edges):
            if not hasattr(edge, 'id') or not edge.id:
                # Generate ID if missing
                edge_id = f"e-{edge.source}-{edge.target}-{i}"
                edge_dict = edge.model_dump() if hasattr(edge, 'model_dump') else dict(edge)
                edge_dict['id'] = edge_id
                processed_edges.append(edge_dict)
            else:
                processed_edges.append(edge.model_dump() if hasattr(edge, 'model_dump') else dict(edge))
        
        # Update workflow
        db_workflow.name = workflow.name
        db_workflow.description = workflow.description
        
        # Serialize nodes with error handling
        try:
            nodes_data = []
            for i, node in enumerate(workflow.nodes):
                try:
                    node_dict = node.model_dump(mode='json', exclude_none=False)
                    nodes_data.append(node_dict)
                except Exception as node_error:
                    import traceback
                    print(f"Error serializing node {i} (id: {getattr(node, 'id', 'unknown')}): {node_error}")
                    print(traceback.format_exc())
                    raise ValueError(f"Invalid node at index {i}: {str(node_error)}")
        except ValueError:
            raise
        except Exception as e:
            import traceback
            print(f"Error processing nodes: {e}")
            print(traceback.format_exc())
            raise ValueError(f"Error processing nodes: {str(e)}")
        
        db_workflow.definition = {
            "nodes": nodes_data,
            "edges": processed_edges,
            "variables": workflow.variables
        }
        db_workflow.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(db_workflow)
        
        # Convert processed edges back to Edge objects for response
        from ..models.schemas import Edge
        response_edges = [Edge(**e) for e in processed_edges]
    except HTTPException:
        raise
    except ValueError as ve:
        # Re-raise ValueError as 422
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error updating workflow: {e}")
        print(error_trace)
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    
    return WorkflowResponse(
        id=db_workflow.id,
        name=db_workflow.name,
        description=db_workflow.description,
        version=db_workflow.version,
        nodes=workflow.nodes,
        edges=response_edges if 'response_edges' in locals() else workflow.edges,
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


class BulkDeleteRequest(BaseModel):
    workflow_ids: List[str]


@router.post("/workflows/bulk-delete", status_code=200)
async def bulk_delete_workflows(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Delete multiple workflows"""
    if not request.workflow_ids:
        raise HTTPException(status_code=400, detail="No workflow IDs provided")
    
    # Get all workflows
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id.in_(request.workflow_ids))
    )
    workflows = result.scalars().all()
    
    if len(workflows) != len(request.workflow_ids):
        found_ids = {w.id for w in workflows}
        missing_ids = set(request.workflow_ids) - found_ids
        raise HTTPException(status_code=404, detail=f"Workflows not found: {list(missing_ids)}")
    
    # Check permissions for all workflows
    deleted_count = 0
    failed_ids = []
    
    for workflow in workflows:
        # Check permissions (if user is authenticated, they must own the workflow)
        if current_user and workflow.owner_id and workflow.owner_id != current_user.id:
            failed_ids.append(workflow.id)
            continue
        
        await db.delete(workflow)
        deleted_count += 1
    
    await db.commit()
    
    if failed_ids:
        return {
            "message": f"Deleted {deleted_count} workflow(s). {len(failed_ids)} workflow(s) could not be deleted due to permissions.",
            "deleted_count": deleted_count,
            "failed_ids": failed_ids
        }
    
    return {
        "message": f"Successfully deleted {deleted_count} workflow(s)",
        "deleted_count": deleted_count
    }


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
            for key in ["name", "description", "agent_config", "condition_config", "loop_config", "inputs", "input_config"]:
                # Check if top-level is None or empty dict/list
                top_level_value = node_data.get(key)
                is_empty = top_level_value is None or (isinstance(top_level_value, dict) and len(top_level_value) == 0) or (isinstance(top_level_value, list) and len(top_level_value) == 0)
                
                if is_empty and key in data_obj:
                    data_value = data_obj[key]
                    # Only use data value if it's not empty
                    if data_value is not None and not (isinstance(data_value, dict) and len(data_value) == 0) and not (isinstance(data_value, list) and len(data_value) == 0):
                        node_data[key] = data_value
                elif key == "input_config" and isinstance(node_data[key], dict) and isinstance(data_obj.get(key), dict):
                    # For input_config, merge data.input_config into top-level if data.input_config has values
                    data_input_config = data_obj.get(key, {})
                    top_input_config = node_data[key] or {}
                    # If top-level is empty but data has values, use data
                    if (not top_input_config or all(not v or (isinstance(v, str) and not v.strip()) for v in top_input_config.values())):
                        if data_input_config:
                            node_data[key] = data_input_config
                    # Otherwise merge: data values override empty top-level values
                    else:
                        merged = {**top_input_config}
                        for k, v in data_input_config.items():
                            if k not in merged or not merged[k] or (isinstance(merged[k], str) and not merged[k].strip()):
                                merged[k] = v
                        node_data[key] = merged
        
        # Debug logging
        node_id = node_data.get('id')
        node_type = node_data.get('type')
        has_input_config = node_data.get('input_config') is not None
        has_loop_config = node_data.get('loop_config') is not None
        has_condition_config = node_data.get('condition_config') is not None
        has_agent_config = node_data.get('agent_config') is not None
        
        # Log config presence for debugging and try to extract from data object
        if node_type == 'loop' and not has_loop_config:
            print(f"⚠️  WARNING: Loop node {node_id} missing loop_config after reconstruction")
            print(f"   Top-level loop_config: {node_data.get('loop_config')}")
            if "data" in node_data and node_data.get("data"):
                data_obj = node_data["data"]
                data_loop_config = data_obj.get("loop_config")
                print(f"   Data object has loop_config: {data_loop_config is not None}")
                print(f"   Data loop_config value: {data_loop_config}")
                print(f"   Data object keys: {list(data_obj.keys())}")
                # Try to extract it manually if it exists
                if data_loop_config and isinstance(data_loop_config, dict) and len(data_loop_config) > 0:
                    print(f"   Extracting loop_config from data object...")
                    node_data['loop_config'] = data_loop_config
        elif node_type == 'condition' and not has_condition_config:
            print(f"⚠️  WARNING: Condition node {node_id} missing condition_config after reconstruction")
            if "data" in node_data and node_data.get("data"):
                data_obj = node_data["data"]
                data_condition_config = data_obj.get("condition_config")
                if data_condition_config and isinstance(data_condition_config, dict) and len(data_condition_config) > 0:
                    node_data['condition_config'] = data_condition_config
        elif node_type == 'agent' and not has_agent_config:
            print(f"⚠️  WARNING: Agent node {node_id} missing agent_config after reconstruction")
            if "data" in node_data and node_data.get("data"):
                data_obj = node_data["data"]
                data_agent_config = data_obj.get("agent_config")
                if data_agent_config and isinstance(data_agent_config, dict) and len(data_agent_config) > 0:
                    node_data['agent_config'] = data_agent_config
        
        return Node(**node_data)
    
    # Log all nodes in definition before reconstruction
    all_node_data = definition.get("nodes", [])
    print(f"🔍 Found {len(all_node_data)} nodes in workflow definition:")
    for i, node_data in enumerate(all_node_data):
        node_id = node_data.get('id', f'unknown-{i}')
        node_type = node_data.get('type', 'unknown')
        print(f"   Node {i}: id={node_id}, type={node_type}")
    
    # Reconstruct nodes with error handling
    nodes = []
    for i, node_data in enumerate(all_node_data):
        try:
            node = reconstruct_node(node_data)
            nodes.append(node)
            print(f"✅ Successfully reconstructed node {i}: {node.id} ({node.type})")
        except Exception as e:
            print(f"❌ Error reconstructing node {i} (id={node_data.get('id', 'unknown')}): {e}")
            print(f"   Node data: {json.dumps(node_data, indent=2, default=str)}")
            import traceback
            traceback.print_exc()
            # Don't skip - raise the error so we know what's wrong
            raise HTTPException(status_code=422, detail=f"Invalid node data at index {i} (id={node_data.get('id', 'unknown')}): {str(e)}")
    
    print(f"✅ Successfully reconstructed {len(nodes)} nodes")
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
    user_id = current_user.id if current_user else None
    llm_config = get_active_llm_config(user_id)
    
    # Create executor to get execution_id immediately
    executor = WorkflowExecutor(workflow_def, stream_updates=True, llm_config=llm_config, user_id=user_id)
    execution_id = executor.execution_id
    inputs = execution_request.inputs if execution_request else {}
    
    # Create initial execution record in database (status: running)
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
            print(f"Execution {execution_id} failed: {e}")
            import traceback
            traceback.print_exc()
    
    # Start execution in background
    asyncio.create_task(run_execution())
    
    # Return immediately with execution_id
    from ..models.schemas import ExecutionStatus
    return ExecutionResponse(
        execution_id=execution_id,
        workflow_id=workflow_id,
        status=ExecutionStatus.RUNNING,
        current_node=None,
        result=None,
        error=None,
        started_at=datetime.utcnow(),
        completed_at=None,
        logs=[]
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

