"""
Tests for service layer.
"""
import pytest
from backend.services.workflow_service import WorkflowService
from backend.models.schemas import WorkflowCreate, Node, Edge, NodeType, AgentConfig
from backend.exceptions import WorkflowNotFoundError, WorkflowValidationError


def _create_nodes_from_data(nodes_data):
    """Helper to create Node objects from dict data"""
    nodes = []
    for n in nodes_data:
        node_dict = dict(n)
        node_dict["type"] = NodeType(node_dict["type"])
        if node_dict.get("agent_config"):
            node_dict["agent_config"] = AgentConfig(**node_dict["agent_config"])
        nodes.append(Node(**node_dict))
    return nodes


@pytest.mark.asyncio
async def test_workflow_service_create(db_session, sample_workflow_data):
    """Test creating a workflow via service"""
    service = WorkflowService(db_session)
    
    workflow_create = WorkflowCreate(
        name=sample_workflow_data["name"],
        description=sample_workflow_data["description"],
        nodes=[Node(**n) for n in sample_workflow_data["nodes"]],
        edges=[Edge(**e) for e in sample_workflow_data["edges"]],
        variables=sample_workflow_data["variables"]
    )
    
    workflow = await service.create_workflow(workflow_create, user_id="test-user")
    
    assert workflow.id is not None
    assert workflow.name == sample_workflow_data["name"]
    assert workflow.owner_id == "test-user"


@pytest.mark.asyncio
async def test_workflow_service_get(db_session, sample_workflow_data):
    """Test getting a workflow via service"""
    service = WorkflowService(db_session)
    
    # Create workflow first
    nodes_data = _create_nodes_from_data(sample_workflow_data["nodes"])
    
    workflow_create = WorkflowCreate(
        name=sample_workflow_data["name"],
        description=sample_workflow_data["description"],
        nodes=nodes_data,
        edges=[Edge(**e) for e in sample_workflow_data["edges"]],
        variables=sample_workflow_data["variables"]
    )
    
    created = await service.create_workflow(workflow_create)
    workflow_id = created.id
    
    # Retrieve it
    retrieved = await service.get_workflow(workflow_id)
    assert retrieved.id == workflow_id
    assert retrieved.name == sample_workflow_data["name"]


@pytest.mark.asyncio
async def test_workflow_service_get_not_found(db_session):
    """Test getting a non-existent workflow raises exception"""
    service = WorkflowService(db_session)
    
    with pytest.raises(WorkflowNotFoundError) as exc_info:
        await service.get_workflow("non-existent")
    
    assert exc_info.value.workflow_id == "non-existent"


@pytest.mark.asyncio
async def test_workflow_service_list(db_session, sample_workflow_data):
    """Test listing workflows"""
    service = WorkflowService(db_session)
    
    # Create multiple workflows for a specific user
    user_id = "test-user-list"
    for i in range(3):
        workflow_create = WorkflowCreate(
            name=f"Workflow {i}",
            description="",
            nodes=[],
            edges=[],
            variables={}
        )
        await service.create_workflow(workflow_create, user_id=user_id)
    
    # List workflows for that user
    workflows = await service.list_workflows(user_id=user_id)
    assert len(workflows) == 3
    
    # List all workflows (without user_id and include_public=False, uses get_all)
    all_workflows = await service.list_workflows(user_id=None, include_public=False)
    assert len(all_workflows) >= 3


@pytest.mark.asyncio
async def test_workflow_service_update(db_session, sample_workflow_data):
    """Test updating a workflow"""
    service = WorkflowService(db_session)
    
    # Create workflow
    nodes_data = _create_nodes_from_data(sample_workflow_data["nodes"])
    
    workflow_create = WorkflowCreate(
        name=sample_workflow_data["name"],
        description=sample_workflow_data["description"],
        nodes=nodes_data,
        edges=[Edge(**e) for e in sample_workflow_data["edges"]],
        variables=sample_workflow_data["variables"]
    )
    
    created = await service.create_workflow(workflow_create)
    workflow_id = created.id
    
    # Update it
    updated_create = WorkflowCreate(
        name="Updated Name",
        description="Updated Description",
        nodes=nodes_data,
        edges=[Edge(**e) for e in sample_workflow_data["edges"]],
        variables={}
    )
    
    updated = await service.update_workflow(workflow_id, updated_create)
    assert updated.name == "Updated Name"
    assert updated.description == "Updated Description"


@pytest.mark.asyncio
async def test_workflow_service_update_not_found(db_session, sample_workflow_data):
    """Test updating non-existent workflow raises exception"""
    service = WorkflowService(db_session)
    
    workflow_create = WorkflowCreate(
        name="Test",
        description="",
        nodes=[],
        edges=[],
        variables={}
    )
    
    with pytest.raises(WorkflowNotFoundError):
        await service.update_workflow("non-existent", workflow_create)


@pytest.mark.asyncio
async def test_workflow_service_delete(db_session, sample_workflow_data):
    """Test deleting a workflow"""
    service = WorkflowService(db_session)
    
    # Create workflow
    nodes_data = _create_nodes_from_data(sample_workflow_data["nodes"])
    
    workflow_create = WorkflowCreate(
        name=sample_workflow_data["name"],
        description=sample_workflow_data["description"],
        nodes=nodes_data,
        edges=[Edge(**e) for e in sample_workflow_data["edges"]],
        variables=sample_workflow_data["variables"]
    )
    
    created = await service.create_workflow(workflow_create)
    workflow_id = created.id
    
    # Delete it
    deleted = await service.delete_workflow(workflow_id)
    assert deleted is True
    
    # Verify it's gone
    with pytest.raises(WorkflowNotFoundError):
        await service.get_workflow(workflow_id)


@pytest.mark.asyncio
async def test_workflow_service_edges_get_ids(db_session):
    """Test that edges without IDs get auto-generated IDs"""
    service = WorkflowService(db_session)
    
    workflow_create = WorkflowCreate(
        name="Test",
        description="",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start", position={"x": 0, "y": 0}),
            Node(id="end-1", type=NodeType.END, name="End", position={"x": 100, "y": 100})
        ],
        edges=[
            Edge(source="start-1", target="end-1")  # No ID provided
        ],
        variables={}
    )
    
    workflow = await service.create_workflow(workflow_create)
    
    # Check that edges in definition have IDs
    edges = workflow.definition.get("edges", [])
    assert len(edges) == 1
    assert edges[0].get("id") is not None
    assert edges[0]["id"].startswith("e-")

