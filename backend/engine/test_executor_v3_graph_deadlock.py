"""Regression: executor must not busy-loop when the graph has unrunnable queued nodes."""
import asyncio
import uuid
from unittest.mock import patch

import pytest

from backend.engine.executor_v3 import WorkflowExecutorV3
from backend.engine.nodes.node_executor_registry import NodeExecutorRegistry
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


@pytest.mark.asyncio
async def test_start_skip_enqueues_successor_same_scheduler_tick():
    """
    Skipping START appends the next node to the queue, but the scheduler used
    `for node_id in queue[:]`, so successors were not seen until the next outer
    iteration — triggering a false "unmet dependencies" failure while in_progress
    was still empty.
    """
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="start-tool-end",
        nodes=[
            Node(id="s", type=NodeType.START, name="S"),
            Node(id="t", type=NodeType.TOOL, name="T"),
            Node(id="e", type=NodeType.END, name="E"),
        ],
        edges=[
            Edge(source="s", target="t"),
            Edge(source="t", target="e"),
        ],
    )
    real_get = NodeExecutorRegistry.get

    async def fake_tool(_ex, _node, _inputs):
        return {"ok": True}

    def get_side_effect(nt):
        if nt == NodeType.TOOL:
            return fake_tool
        return real_get(nt)

    executor = WorkflowExecutorV3(workflow, stream_updates=False)
    with patch.object(NodeExecutorRegistry, "get", side_effect=get_side_effect):
        state = await asyncio.wait_for(executor.execute({}), timeout=5.0)
    assert state.status.value == "completed"
