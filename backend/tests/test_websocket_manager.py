"""Tests for WebSocket connection manager"""
import pytest
from unittest.mock import AsyncMock, Mock
from fastapi import WebSocket

from backend.websocket.manager import ConnectionManager


@pytest.fixture
def manager():
    """Create a ConnectionManager instance"""
    return ConnectionManager()


@pytest.fixture
def mock_websocket():
    """Create a mock WebSocket"""
    ws = AsyncMock(spec=WebSocket)
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()
    return ws


@pytest.mark.asyncio
async def test_connect(manager, mock_websocket):
    """Test connecting a WebSocket"""
    execution_id = "test-execution-1"
    
    await manager.connect(mock_websocket, execution_id)
    
    assert execution_id in manager.active_connections
    assert mock_websocket in manager.active_connections[execution_id]
    mock_websocket.accept.assert_called_once()


@pytest.mark.asyncio
async def test_disconnect(manager, mock_websocket):
    """Test disconnecting a WebSocket"""
    execution_id = "test-execution-1"
    
    await manager.connect(mock_websocket, execution_id)
    assert execution_id in manager.active_connections
    
    await manager.disconnect(mock_websocket, execution_id)
    assert execution_id not in manager.active_connections


@pytest.mark.asyncio
async def test_disconnect_removes_empty_execution(manager, mock_websocket):
    """Test that disconnecting removes empty execution entries"""
    execution_id = "test-execution-1"
    
    await manager.connect(mock_websocket, execution_id)
    await manager.disconnect(mock_websocket, execution_id)
    
    assert execution_id not in manager.active_connections


@pytest.mark.asyncio
async def test_send_message(manager, mock_websocket):
    """Test sending a message to connections"""
    execution_id = "test-execution-1"
    message = {"type": "test", "data": "test"}
    
    await manager.connect(mock_websocket, execution_id)
    await manager.send_message(execution_id, message)
    
    mock_websocket.send_json.assert_called_once_with(message)


@pytest.mark.asyncio
async def test_send_message_multiple_connections(manager):
    """Test sending message to multiple connections"""
    execution_id = "test-execution-1"
    message = {"type": "test", "data": "test"}
    
    ws1 = AsyncMock(spec=WebSocket)
    ws1.accept = AsyncMock()
    ws1.send_json = AsyncMock()
    
    ws2 = AsyncMock(spec=WebSocket)
    ws2.accept = AsyncMock()
    ws2.send_json = AsyncMock()
    
    await manager.connect(ws1, execution_id)
    await manager.connect(ws2, execution_id)
    await manager.send_message(execution_id, message)
    
    ws1.send_json.assert_called_once_with(message)
    ws2.send_json.assert_called_once_with(message)


@pytest.mark.asyncio
async def test_send_message_handles_disconnected(manager, mock_websocket):
    """Test that send_message handles disconnected connections"""
    execution_id = "test-execution-1"
    message = {"type": "test", "data": "test"}
    
    # Make send_json raise an exception (simulating disconnected connection)
    mock_websocket.send_json.side_effect = Exception("Connection closed")
    
    await manager.connect(mock_websocket, execution_id)
    await manager.send_message(execution_id, message)
    
    # Connection should be removed
    assert execution_id not in manager.active_connections or mock_websocket not in manager.active_connections[execution_id]


@pytest.mark.asyncio
async def test_broadcast_status(manager, mock_websocket):
    """Test broadcasting status update"""
    execution_id = "test-execution-1"
    
    await manager.connect(mock_websocket, execution_id)
    await manager.broadcast_status(execution_id, "running", {"progress": 50})
    
    call_args = mock_websocket.send_json.call_args[0][0]
    assert call_args["type"] == "status"
    assert call_args["status"] == "running"
    assert call_args["data"]["progress"] == 50


@pytest.mark.asyncio
async def test_broadcast_node_update(manager, mock_websocket):
    """Test broadcasting node update"""
    execution_id = "test-execution-1"
    node_state = {"node_id": "node-1", "status": "completed"}
    
    await manager.connect(mock_websocket, execution_id)
    await manager.broadcast_node_update(execution_id, "node-1", node_state)
    
    call_args = mock_websocket.send_json.call_args[0][0]
    assert call_args["type"] == "node_update"
    assert call_args["node_id"] == "node-1"
    assert call_args["node_state"] == node_state


@pytest.mark.asyncio
async def test_broadcast_log(manager, mock_websocket):
    """Test broadcasting log entry"""
    execution_id = "test-execution-1"
    log_entry = {"level": "INFO", "message": "Test log"}
    
    await manager.connect(mock_websocket, execution_id)
    await manager.broadcast_log(execution_id, log_entry)
    
    call_args = mock_websocket.send_json.call_args[0][0]
    assert call_args["type"] == "log"
    assert call_args["log"] == log_entry


@pytest.mark.asyncio
async def test_broadcast_completion(manager, mock_websocket):
    """Test broadcasting completion"""
    execution_id = "test-execution-1"
    result = {"status": "completed", "output": "result"}
    
    await manager.connect(mock_websocket, execution_id)
    await manager.broadcast_completion(execution_id, result)
    
    call_args = mock_websocket.send_json.call_args[0][0]
    assert call_args["type"] == "completion"
    assert call_args["result"] == result


@pytest.mark.asyncio
async def test_broadcast_error(manager, mock_websocket):
    """Test broadcasting error"""
    execution_id = "test-execution-1"
    error = "Test error message"
    
    await manager.connect(mock_websocket, execution_id)
    await manager.broadcast_error(execution_id, error)
    
    call_args = mock_websocket.send_json.call_args[0][0]
    assert call_args["type"] == "error"
    assert call_args["error"] == error


@pytest.mark.asyncio
async def test_send_message_no_connections(manager):
    """Test sending message when no connections exist"""
    execution_id = "test-execution-1"
    message = {"type": "test", "data": "test"}
    
    # Should not raise an error
    await manager.send_message(execution_id, message)

