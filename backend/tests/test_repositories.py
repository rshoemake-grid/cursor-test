"""
Tests for repository pattern.
"""
import pytest
from datetime import datetime
from backend.repositories.workflow_repository import WorkflowRepository
from backend.repositories.execution_repository import ExecutionRepository
from backend.database.models import WorkflowDB, ExecutionDB


@pytest.mark.asyncio
async def test_workflow_repository_create(db_session, sample_workflow_data):
    """Test creating a workflow via repository"""
    repo = WorkflowRepository(db_session)
    
    workflow = WorkflowDB(
        id="test-workflow-1",
        name=sample_workflow_data["name"],
        description=sample_workflow_data["description"],
        definition={
            "nodes": sample_workflow_data["nodes"],
            "edges": sample_workflow_data["edges"],
            "variables": sample_workflow_data["variables"]
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    created = await repo.create(workflow)
    assert created.id == "test-workflow-1"
    assert created.name == sample_workflow_data["name"]


@pytest.mark.asyncio
async def test_workflow_repository_get_by_id(db_session, sample_workflow_data):
    """Test getting a workflow by ID"""
    repo = WorkflowRepository(db_session)
    
    workflow = WorkflowDB(
        id="test-workflow-1",
        name=sample_workflow_data["name"],
        description=sample_workflow_data["description"],
        definition={
            "nodes": sample_workflow_data["nodes"],
            "edges": sample_workflow_data["edges"],
            "variables": sample_workflow_data["variables"]
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await repo.create(workflow)
    
    retrieved = await repo.get_by_id("test-workflow-1")
    assert retrieved is not None
    assert retrieved.id == "test-workflow-1"
    assert retrieved.name == sample_workflow_data["name"]


@pytest.mark.asyncio
async def test_workflow_repository_get_by_id_not_found(db_session):
    """Test getting a non-existent workflow"""
    repo = WorkflowRepository(db_session)
    
    retrieved = await repo.get_by_id("non-existent")
    assert retrieved is None


@pytest.mark.asyncio
async def test_workflow_repository_update(db_session, sample_workflow_data):
    """Test updating a workflow"""
    repo = WorkflowRepository(db_session)
    
    workflow = WorkflowDB(
        id="test-workflow-1",
        name=sample_workflow_data["name"],
        description=sample_workflow_data["description"],
        definition={
            "nodes": sample_workflow_data["nodes"],
            "edges": sample_workflow_data["edges"],
            "variables": sample_workflow_data["variables"]
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await repo.create(workflow)
    
    updated = await repo.update("test-workflow-1", name="Updated Name")
    assert updated is not None
    assert updated.name == "Updated Name"


@pytest.mark.asyncio
async def test_workflow_repository_delete(db_session, sample_workflow_data):
    """Test deleting a workflow"""
    repo = WorkflowRepository(db_session)
    
    workflow = WorkflowDB(
        id="test-workflow-1",
        name=sample_workflow_data["name"],
        description=sample_workflow_data["description"],
        definition={
            "nodes": sample_workflow_data["nodes"],
            "edges": sample_workflow_data["edges"],
            "variables": sample_workflow_data["variables"]
        },
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await repo.create(workflow)
    
    deleted = await repo.delete("test-workflow-1")
    assert deleted is True
    
    retrieved = await repo.get_by_id("test-workflow-1")
    assert retrieved is None


@pytest.mark.asyncio
async def test_workflow_repository_get_by_owner(db_session, sample_workflow_data):
    """Test getting workflows by owner"""
    repo = WorkflowRepository(db_session)
    
    # Create workflows for different owners
    workflow1 = WorkflowDB(
        id="workflow-1",
        name="Workflow 1",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id="user-1",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    workflow2 = WorkflowDB(
        id="workflow-2",
        name="Workflow 2",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id="user-1",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    workflow3 = WorkflowDB(
        id="workflow-3",
        name="Workflow 3",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id="user-2",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await repo.create(workflow1)
    await repo.create(workflow2)
    await repo.create(workflow3)
    
    user1_workflows = await repo.get_by_owner("user-1")
    assert len(user1_workflows) == 2
    assert all(w.owner_id == "user-1" for w in user1_workflows)


@pytest.mark.asyncio
async def test_execution_repository_create(db_session):
    """Test creating an execution via repository"""
    repo = ExecutionRepository(db_session)
    
    execution = ExecutionDB(
        id="exec-1",
        workflow_id="workflow-1",
        user_id="user-1",
        status="running",
        state={},
        started_at=datetime.utcnow()
    )
    
    created = await repo.create(execution)
    assert created.id == "exec-1"
    assert created.status == "running"


@pytest.mark.asyncio
async def test_execution_repository_get_by_workflow_id(db_session):
    """Test getting executions by workflow ID"""
    repo = ExecutionRepository(db_session)
    
    exec1 = ExecutionDB(
        id="exec-1",
        workflow_id="workflow-1",
        user_id="user-1",
        status="completed",
        state={},
        started_at=datetime.utcnow()
    )
    
    exec2 = ExecutionDB(
        id="exec-2",
        workflow_id="workflow-1",
        user_id="user-1",
        status="running",
        state={},
        started_at=datetime.utcnow()
    )
    
    exec3 = ExecutionDB(
        id="exec-3",
        workflow_id="workflow-2",
        user_id="user-1",
        status="completed",
        state={},
        started_at=datetime.utcnow()
    )
    
    await repo.create(exec1)
    await repo.create(exec2)
    await repo.create(exec3)
    
    workflow_executions = await repo.get_by_workflow_id("workflow-1")
    assert len(workflow_executions) == 2
    assert all(e.workflow_id == "workflow-1" for e in workflow_executions)


@pytest.mark.asyncio
async def test_execution_repository_get_running(db_session):
    """Test getting running executions"""
    repo = ExecutionRepository(db_session)
    
    exec1 = ExecutionDB(
        id="exec-1",
        workflow_id="workflow-1",
        user_id="user-1",
        status="running",
        state={},
        started_at=datetime.utcnow()
    )
    
    exec2 = ExecutionDB(
        id="exec-2",
        workflow_id="workflow-2",
        user_id="user-1",
        status="completed",
        state={},
        started_at=datetime.utcnow()
    )
    
    await repo.create(exec1)
    await repo.create(exec2)
    
    running = await repo.get_running_executions()
    assert len(running) == 1
    assert running[0].status == "running"

