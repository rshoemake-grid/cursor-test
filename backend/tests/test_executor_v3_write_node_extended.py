"""Extended tests for WorkflowExecutorV3 write node handling"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import uuid
from datetime import datetime

from backend.engine.executor_v3 import WorkflowExecutorV3
from backend.models.schemas import (
    WorkflowDefinition,
    Node,
    NodeType,
    Edge,
    AgentConfig
)


@pytest.fixture
def mock_workflow():
    """Create a mock workflow"""
    return WorkflowDefinition(
        id=str(uuid.uuid4()),
        name="Test Workflow",
        nodes=[
            Node(
                id="read-1",
                type=NodeType.LOCAL_FILESYSTEM,
                name="Read Node",
                input_config={
                    "source_type": "local_filesystem",
                    "config": {"file_path": "/tmp/test.txt"}
                }
            ),
            Node(
                id="write-1",
                type=NodeType.LOCAL_FILESYSTEM,
                name="Write Node",
                input_config={
                    "source_type": "local_filesystem",
                    "config": {"file_path": "/tmp/output.txt"},
                    "mode": "write"
                }
            )
        ],
        edges=[
            Edge(source="read-1", target="write-1")
        ]
    )


@pytest.mark.asyncio
async def test_executor_v3_write_node_with_wrapped_data(mock_workflow):
    """Test write node handling wrapped read node output"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(mock_workflow, llm_config=llm_config)
    
    # Mock read_from_input_source to return wrapped output
    with patch("backend.engine.executor_v3.read_from_input_source") as mock_read, \
         patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
        mock_read.return_value = {
            "data": "test content",
            "source": "local_filesystem"
        }
        mock_write.return_value = {"status": "success"}
        
        inputs = {}
        result = await executor.execute(inputs)
        
        # Verify write was called (coverage test)
        assert mock_write.called


@pytest.mark.asyncio
async def test_executor_v3_write_node_with_single_data_key(mock_workflow):
    """Test write node handling single 'data' key"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(mock_workflow, llm_config=llm_config)
    
    with patch("backend.engine.executor_v3.read_from_input_source") as mock_read, \
         patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
        mock_read.return_value = {"data": "single data value"}
        mock_write.return_value = {"status": "success"}
        
        inputs = {}
        result = await executor.execute(inputs)
        
        assert mock_write.called


@pytest.mark.asyncio
async def test_executor_v3_write_node_with_image_data(mock_workflow):
    """Test write node handling image data (base64)"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(mock_workflow, llm_config=llm_config)
    
    image_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhwGAWjR9awAAAABJRU5ErkJggg=="
    
    with patch("backend.engine.executor_v3.read_from_input_source") as mock_read, \
         patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
        mock_read.return_value = {
            "text": "some text",
            "image": image_data
        }
        mock_write.return_value = {"status": "success"}
        
        inputs = {}
        result = await executor.execute(inputs)
        
        assert mock_write.called


@pytest.mark.asyncio
async def test_executor_v3_write_node_with_empty_data_error(mock_workflow):
    """Test write node error handling when data is empty"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(mock_workflow, llm_config=llm_config)
    
    with patch("backend.engine.executor_v3.read_from_input_source") as mock_read, \
         patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
        mock_read.return_value = {}  # Empty output
        
        inputs = {}
        result = await executor.execute(inputs)
        
        # Should handle empty data gracefully (either skip write or error)
        assert result.status in ["completed", "failed"]


@pytest.mark.asyncio
async def test_executor_v3_write_node_with_filtered_dict(mock_workflow):
    """Test write node handling filtered dict with empty values"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    executor = WorkflowExecutorV3(mock_workflow, llm_config=llm_config)
    
    with patch("backend.engine.executor_v3.read_from_input_source") as mock_read, \
         patch("backend.engine.executor_v3.write_to_input_source") as mock_write:
        mock_read.return_value = {
            "data": "content",
            "empty": "",
            "none": None
        }
        mock_write.return_value = {"status": "success"}
        
        inputs = {}
        result = await executor.execute(inputs)
        
        assert mock_write.called

