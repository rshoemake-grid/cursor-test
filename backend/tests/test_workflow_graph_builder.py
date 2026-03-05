"""Tests for workflow graph builder"""
import pytest
import uuid

from backend.engine.graph.workflow_graph_builder import build_graph
from backend.models.schemas import WorkflowDefinition, Node, Edge, NodeType, ConditionConfig


@pytest.fixture
def simple_workflow():
    """Create a simple workflow definition"""
    return WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Test Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(id="end-1", type=NodeType.END, name="End"),
        ],
        edges=[Edge(id="e1", source="start-1", target="end-1")],
        variables={},
    )


def test_build_graph_simple(simple_workflow):
    """Test building graph from simple workflow"""
    adjacency, in_degree = build_graph(simple_workflow)

    assert "start-1" in adjacency
    assert "end-1" in adjacency
    assert adjacency["start-1"] == ["end-1"]
    assert adjacency["end-1"] == []
    assert in_degree["start-1"] == 0
    assert in_degree["end-1"] == 1


def test_build_graph_empty_workflow():
    """Test building graph from workflow with no nodes"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Empty Workflow",
        nodes=[],
        edges=[],
        variables={},
    )

    adjacency, in_degree = build_graph(workflow)

    assert adjacency == {}
    assert in_degree == {}
    assert workflow.edges == []


def test_build_graph_filters_invalid_condition_node():
    """Test that condition nodes without field config are filtered out"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Condition Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="cond-1",
                type=NodeType.CONDITION,
                name="Bad Condition",
                condition_config=ConditionConfig(field=None),
            ),
            Node(id="end-1", type=NodeType.END, name="End"),
        ],
        edges=[
            Edge(id="e1", source="start-1", target="cond-1"),
            Edge(id="e2", source="cond-1", target="end-1"),
        ],
        variables={},
    )

    adjacency, in_degree = build_graph(workflow)

    assert "cond-1" not in adjacency
    assert "start-1" in adjacency
    assert "end-1" in adjacency
    assert adjacency["start-1"] == []
    assert len(workflow.nodes) == 2


def test_build_graph_keeps_valid_condition_node():
    """Test that condition nodes with field config are kept"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Condition Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="cond-1",
                type=NodeType.CONDITION,
                name="Valid Condition",
                condition_config=ConditionConfig(field="value", operator="equals", value="test"),
            ),
            Node(id="end-1", type=NodeType.END, name="End"),
        ],
        edges=[
            Edge(id="e1", source="start-1", target="cond-1"),
            Edge(id="e2", source="cond-1", target="end-1"),
        ],
        variables={},
    )

    adjacency, in_degree = build_graph(workflow)

    assert "cond-1" in adjacency
    assert adjacency["start-1"] == ["cond-1"]
    assert adjacency["cond-1"] == ["end-1"]
    assert in_degree["cond-1"] == 1
    assert in_degree["end-1"] == 1


def test_build_graph_filters_edges_to_invalid_nodes():
    """Test that edges referencing invalid/missing nodes are filtered out"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(id="end-1", type=NodeType.END, name="End"),
        ],
        edges=[
            Edge(id="e1", source="start-1", target="end-1"),
            Edge(id="e2", source="start-1", target="nonexistent"),
            Edge(id="e3", source="ghost", target="end-1"),
        ],
        variables={},
    )

    adjacency, in_degree = build_graph(workflow)

    assert adjacency["start-1"] == ["end-1"]
    assert len(workflow.edges) == 1
    assert workflow.edges[0].source == "start-1" and workflow.edges[0].target == "end-1"
