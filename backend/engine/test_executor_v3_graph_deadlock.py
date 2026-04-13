"""Regression: executor must not busy-loop when the graph has unrunnable queued nodes."""
import asyncio
import uuid

import pytest

from backend.engine.executor_v3 import WorkflowExecutorV3
from backend.models.schemas import Edge, Node, NodeType, WorkflowDefinition


@pytest.mark.asyncio
async def test_execute_graph_deadlock_fails_instead_of_spinning():
    """
    Two mutually dependent nodes (cycle) leave the initial queue with a node that
    can never run. Previously _execute_graph used `continue` without sleeping,
    causing an infinite loop and a stuck RUNNING execution.
    """
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="cycle",
        nodes=[
            Node(id="a", type=NodeType.TOOL, name="A"),
            Node(id="b", type=NodeType.TOOL, name="B"),
        ],
        edges=[
            Edge(source="a", target="b"),
            Edge(source="b", target="a"),
        ],
    )
    executor = WorkflowExecutorV3(workflow, stream_updates=False)
    state = await asyncio.wait_for(executor.execute({}), timeout=3.0)
    assert state.status.value == "failed"
    assert state.error is not None
    assert "cannot proceed" in state.error.lower()
