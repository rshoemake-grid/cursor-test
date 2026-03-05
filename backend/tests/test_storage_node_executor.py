"""Direct unit tests for storage_node_executor"""
import pytest
from unittest.mock import AsyncMock, patch

from backend.engine.nodes.storage_node_executor import execute_storage_node


@pytest.fixture
def log_fn():
    """Async log function for tests"""
    return AsyncMock()


@pytest.mark.asyncio
async def test_execute_storage_node_read_simple(log_fn):
    """Test read mode returns wrapped output"""
    with patch("backend.engine.nodes.storage_node_executor.read_from_input_source") as mock_read:
        mock_read.return_value = {"key": "value"}

        result = await execute_storage_node(
            node_id="storage-1",
            node_type="gcp_bucket",
            input_config={"bucket_name": "b", "object_path": "p"},
            mode="read",
            node_has_inputs=False,
            has_data_producing_inputs=False,
            node_inputs={},
            data_to_write=None,
            log_fn=log_fn,
        )

        assert result == {"data": {"key": "value"}, "source": "gcp_bucket"}
        mock_read.assert_called_once_with("gcp_bucket", {"bucket_name": "b", "object_path": "p"})


@pytest.mark.asyncio
async def test_execute_storage_node_read_lines_mode(log_fn):
    """Test read mode with read_mode=lines"""
    with patch("backend.engine.nodes.storage_node_executor.read_from_input_source") as mock_read:
        mock_read.return_value = {
            "read_mode": "lines",
            "lines": ["line1", "line2"],
            "total_lines": 2,
            "file_path": "/tmp/test.txt",
        }

        result = await execute_storage_node(
            node_id="storage-1",
            node_type="local_filesystem",
            input_config={"file_path": "/tmp/test.txt"},
            mode="read",
            node_has_inputs=False,
            has_data_producing_inputs=False,
            node_inputs={},
            data_to_write=None,
            log_fn=log_fn,
        )

        assert result["read_mode"] == "lines"
        assert result["lines"] == ["line1", "line2"]
        assert result["items"] == ["line1", "line2"]
        assert result["total_lines"] == 2
        assert result["source"] == "local_filesystem"


@pytest.mark.asyncio
async def test_execute_storage_node_read_none(log_fn):
    """Test read mode when source returns None"""
    with patch("backend.engine.nodes.storage_node_executor.read_from_input_source") as mock_read:
        mock_read.return_value = None

        result = await execute_storage_node(
            node_id="storage-1",
            node_type="gcp_bucket",
            input_config={},
            mode="read",
            node_has_inputs=False,
            has_data_producing_inputs=False,
            node_inputs={},
            data_to_write=None,
            log_fn=log_fn,
        )

        assert result == {"data": None, "source": "gcp_bucket"}


@pytest.mark.asyncio
async def test_execute_storage_node_write(log_fn):
    """Test write mode"""
    with patch("backend.engine.nodes.storage_node_executor.write_to_input_source") as mock_write:
        mock_write.return_value = {"status": "success"}

        result = await execute_storage_node(
            node_id="storage-1",
            node_type="gcp_bucket",
            input_config={"bucket_name": "b", "object_path": "p"},
            mode="write",
            node_has_inputs=True,
            has_data_producing_inputs=False,
            node_inputs={"data": "content"},
            data_to_write="content",
            log_fn=log_fn,
        )

        assert result == {"status": "success"}
        mock_write.assert_called_once()


@pytest.mark.asyncio
async def test_execute_storage_node_write_empty_raises(log_fn):
    """Test write mode with empty data raises ValueError"""
    with pytest.raises(ValueError, match="no data to write"):
        await execute_storage_node(
            node_id="storage-1",
            node_type="gcp_bucket",
            input_config={},
            mode="write",
            node_has_inputs=True,
            has_data_producing_inputs=False,
            node_inputs={},
            data_to_write=None,
            log_fn=log_fn,
        )
