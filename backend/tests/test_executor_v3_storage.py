"""Tests for WorkflowExecutorV3 storage node functionality"""
import pytest
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime
import uuid

from backend.engine.executor_v3 import WorkflowExecutorV3
from backend.models.schemas import (
    WorkflowDefinition,
    Node,
    Edge,
    NodeType,
    ExecutionStatus,
    AgentConfig
)


@pytest.mark.asyncio
async def test_execute_storage_node_read():
    """Test executing storage node in read mode"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Storage Read Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="storage-1",
                type=NodeType.GCP_BUCKET,
                name="Storage Node",
                input_config={
                    "bucket_name": "test-bucket",
                    "object_path": "test-key"
                }
            ),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="storage-1"),
            Edge(id="e2", source="storage-1", target="end-1")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    # Mock GCP bucket read
    with patch("backend.engine.executor_v3.read_from_input_source") as mock_read:
        mock_read.return_value = "stored_value"
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED


@pytest.mark.asyncio
async def test_execute_storage_node_write():
    """Test executing storage node in write mode"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Storage Write Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="agent-1",
                type=NodeType.AGENT,
                name="Agent 1",
                agent_config=AgentConfig(model="gpt-4")
            ),
            Node(
                id="storage-1",
                type=NodeType.GCP_BUCKET,
                name="Storage Node",
                input_config={
                    "bucket_name": "test-bucket",
                    "object_path": "test-key"
                }
            ),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="agent-1"),
            Edge(id="e2", source="agent-1", target="storage-1"),
            Edge(id="e3", source="storage-1", target="end-1")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    # Mock agent and GCP bucket write
    with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent, \
         patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="test-data")
        mock_get_agent.return_value = mock_agent
        
        mock_write.return_value = {"status": "success"}
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED
        mock_write.assert_called_once()




@pytest.mark.asyncio
async def test_execute_storage_node_write_with_previous_output():
    """Test storage node write with value from previous node"""
    workflow = WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Storage Write with Input Workflow",
        nodes=[
            Node(id="start-1", type=NodeType.START, name="Start"),
            Node(
                id="agent-1",
                type=NodeType.AGENT,
                name="Agent 1",
                agent_config=AgentConfig(model="gpt-4")
            ),
            Node(
                id="storage-1",
                type=NodeType.GCP_BUCKET,
                name="Storage Node",
                input_config={
                    "bucket_name": "test-bucket",
                    "object_path": "test-key"
                }
            ),
            Node(id="end-1", type=NodeType.END, name="End")
        ],
        edges=[
            Edge(id="e1", source="start-1", target="agent-1"),
            Edge(id="e2", source="agent-1", target="storage-1"),
            Edge(id="e3", source="storage-1", target="end-1")
        ],
        variables={}
    )
    
    executor = WorkflowExecutorV3(workflow)
    
    with patch("backend.engine.executor_v3.AgentRegistry.get_agent") as mock_get_agent, \
         patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
        mock_agent = AsyncMock()
        mock_agent.execute = AsyncMock(return_value="agent-output")
        mock_get_agent.return_value = mock_agent
        
        mock_write.return_value = {"status": "success"}
        
        result = await executor.execute({})
        assert result.status == ExecutionStatus.COMPLETED
        # Verify write was called
        mock_write.assert_called_once()

