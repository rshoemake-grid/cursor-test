"""
Extended tests for repository pattern - additional edge cases.
"""
import pytest
from datetime import datetime
from backend.repositories.workflow_repository import WorkflowRepository
from backend.repositories.execution_repository import ExecutionRepository
from backend.database.models import WorkflowDB, ExecutionDB


@pytest.mark.asyncio
async def test_workflow_repository_get_by_name(db_session):
    """Test getting workflow by name"""
    repo = WorkflowRepository(db_session)
    
    workflow = WorkflowDB(
        id="test-workflow-1",
        name="Unique Workflow Name",
        description="Test",
        definition={"nodes": [], "edges": [], "variables": {}},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await repo.create(workflow)
    
    retrieved = await repo.get_by_name("Unique Workflow Name")
    assert retrieved is not None
    assert retrieved.name == "Unique Workflow Name"


@pytest.mark.asyncio
async def test_workflow_repository_get_by_name_not_found(db_session):
    """Test getting workflow by name when not found"""
    repo = WorkflowRepository(db_session)
    
    retrieved = await repo.get_by_name("Non-existent")
    assert retrieved is None


@pytest.mark.asyncio
async def test_workflow_repository_get_public_workflows(db_session):
    """Test getting public workflows"""
    repo = WorkflowRepository(db_session)
    
    # Create public and private workflows
    public1 = WorkflowDB(
        id="public-1",
        name="Public 1",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        is_public=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    public2 = WorkflowDB(
        id="public-2",
        name="Public 2",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        is_public=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    private = WorkflowDB(
        id="private-1",
        name="Private 1",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        is_public=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await repo.create(public1)
    await repo.create(public2)
    await repo.create(private)
    
    public_workflows = await repo.get_public_workflows()
    assert len(public_workflows) == 2
    assert all(w.is_public is True for w in public_workflows)


@pytest.mark.asyncio
async def test_workflow_repository_get_anonymous_workflows(db_session):
    """Test getting anonymous workflows (no owner)"""
    repo = WorkflowRepository(db_session)
    
    # Create workflows with and without owners
    anonymous1 = WorkflowDB(
        id="anon-1",
        name="Anonymous 1",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    anonymous2 = WorkflowDB(
        id="anon-2",
        name="Anonymous 2",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    owned = WorkflowDB(
        id="owned-1",
        name="Owned 1",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id="user-1",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await repo.create(anonymous1)
    await repo.create(anonymous2)
    await repo.create(owned)
    
    anonymous_workflows = await repo.get_anonymous_workflows()
    assert len(anonymous_workflows) == 2
    assert all(w.owner_id is None for w in anonymous_workflows)


@pytest.mark.asyncio
async def test_workflow_repository_get_anonymous_and_public(db_session):
    """Test getting anonymous and public workflows"""
    repo = WorkflowRepository(db_session)
    
    anonymous = WorkflowDB(
        id="anon-1",
        name="Anonymous",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    public = WorkflowDB(
        id="public-1",
        name="Public",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id="user-1",
        is_public=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    private = WorkflowDB(
        id="private-1",
        name="Private",
        description="",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id="user-1",
        is_public=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await repo.create(anonymous)
    await repo.create(public)
    await repo.create(private)
    
    workflows = await repo.get_anonymous_and_public_workflows()
    assert len(workflows) == 2
    workflow_ids = {w.id for w in workflows}
    assert "anon-1" in workflow_ids
    assert "public-1" in workflow_ids
    assert "private-1" not in workflow_ids


@pytest.mark.asyncio
async def test_execution_repository_get_by_id(db_session):
    """Test getting execution by ID"""
    repo = ExecutionRepository(db_session)
    
    execution = ExecutionDB(
        id="exec-1",
        workflow_id="workflow-1",
        user_id="user-1",
        status="running",
        state={},
        started_at=datetime.utcnow()
    )
    
    await repo.create(execution)
    
    retrieved = await repo.get_by_id("exec-1")
    assert retrieved is not None
    assert retrieved.id == "exec-1"
    assert retrieved.status == "running"


@pytest.mark.asyncio
async def test_execution_repository_update_status(db_session):
    """Test updating execution status"""
    repo = ExecutionRepository(db_session)
    
    execution = ExecutionDB(
        id="exec-1",
        workflow_id="workflow-1",
        user_id="user-1",
        status="running",
        state={},
        started_at=datetime.utcnow()
    )
    
    await repo.create(execution)
    
    updated = await repo.update("exec-1", status="completed")
    assert updated is not None
    assert updated.status == "completed"

