"""Advanced debugging API routes for Phase 4"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
import json

from backend.database.db import get_db
from backend.database.models import WorkflowDB, ExecutionDB, UserDB
from backend.models.schemas import ExecutionResponse, ExecutionStatus
from backend.auth import get_optional_user

router = APIRouter(prefix="/api/debug", tags=["Debugging"])


@router.get("/workflow/{workflow_id}/validate")
async def validate_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Validate a workflow for potential issues"""
    # Get workflow
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    definition = workflow.definition
    nodes = definition.get("nodes", [])
    edges = definition.get("edges", [])
    
    issues = []
    warnings = []
    
    # Check for nodes without edges
    node_ids = {node["id"] for node in nodes}
    connected_nodes = set()
    for edge in edges:
        connected_nodes.add(edge["source"])
        connected_nodes.add(edge["target"])
    
    orphan_nodes = node_ids - connected_nodes
    if orphan_nodes:
        warnings.append({
            "type": "orphan_nodes",
            "message": f"Found {len(orphan_nodes)} disconnected nodes",
            "nodes": list(orphan_nodes)
        })
    
    # Check for missing start/end nodes
    node_types = [node.get("type") for node in nodes]
    if "start" not in node_types:
        issues.append({
            "type": "missing_start",
            "message": "Workflow has no START node",
            "severity": "error"
        })
    
    if "end" not in node_types:
        warnings.append({
            "type": "missing_end",
            "message": "Workflow has no END node",
            "severity": "warning"
        })
    
    # Check for cycles
    def has_cycle():
        visited = set()
        rec_stack = set()
        
        def dfs(node_id):
            visited.add(node_id)
            rec_stack.add(node_id)
            
            # Get outgoing edges
            for edge in edges:
                if edge["source"] == node_id:
                    target = edge["target"]
                    if target not in visited:
                        if dfs(target):
                            return True
                    elif target in rec_stack:
                        return True
            
            rec_stack.remove(node_id)
            return False
        
        for node_id in node_ids:
            if node_id not in visited:
                if dfs(node_id):
                    return True
        return False
    
    if has_cycle():
        issues.append({
            "type": "cycle_detected",
            "message": "Workflow contains a cycle (except for loops)",
            "severity": "error"
        })
    
    # Check agent nodes for configuration
    for node in nodes:
        if node.get("type") == "agent":
            node_data = node.get("data", {})
            agent_config = node_data.get("agent_config", {})
            
            if not agent_config.get("system_prompt"):
                warnings.append({
                    "type": "missing_system_prompt",
                    "message": f"Agent node '{node.get('id')}' has no system prompt",
                    "node_id": node.get("id")
                })
    
    return {
        "workflow_id": workflow_id,
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "node_count": len(nodes),
        "edge_count": len(edges)
    }


@router.get("/workflow/{workflow_id}/executions/history")
async def get_execution_history(
    workflow_id: str,
    limit: int = Query(10, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get execution history for a workflow"""
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
    db: AsyncSession = Depends(get_db)
):
    """Get detailed timeline of execution"""
    result = await db.execute(
        select(ExecutionDB).where(ExecutionDB.id == execution_id)
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
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
    db: AsyncSession = Depends(get_db)
):
    """Get detailed execution information for a specific node"""
    result = await db.execute(
        select(ExecutionDB).where(ExecutionDB.id == execution_id)
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
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
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for a workflow"""
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
    db: AsyncSession = Depends(get_db)
):
    """Export execution data for debugging"""
    result = await db.execute(
        select(ExecutionDB).where(ExecutionDB.id == execution_id)
    )
    execution = result.scalar_one_or_none()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # Get workflow
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == execution.workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    return {
        "export_version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
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

