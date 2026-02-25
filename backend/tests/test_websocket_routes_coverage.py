"""
Tests for websocket_routes.py coverage gaps
Tests WebSocket connection, ping/pong, disconnection
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.websockets import WebSocketDisconnect
from backend.api.websocket_routes import websocket_execution_stream


@pytest.mark.asyncio
async def test_websocket_disconnect():
    """Test WebSocket disconnect handling (lines 30-31)"""
    mock_websocket = AsyncMock()
    mock_websocket.receive_text = AsyncMock(side_effect=WebSocketDisconnect())
    
    mock_manager = MagicMock()
    mock_manager.connect = AsyncMock()
    mock_manager.disconnect = AsyncMock()
    
    with patch('backend.api.websocket_routes.manager', mock_manager):
        await websocket_execution_stream(mock_websocket, "exec-123")
    
    mock_manager.disconnect.assert_called_once_with(mock_websocket, "exec-123")


@pytest.mark.asyncio
async def test_websocket_exception_handling():
    """Test WebSocket exception handling (lines 32-34)"""
    mock_websocket = AsyncMock()
    mock_websocket.receive_text = AsyncMock(side_effect=Exception("Connection error"))
    
    mock_manager = MagicMock()
    mock_manager.connect = AsyncMock()
    mock_manager.disconnect = AsyncMock()
    
    with patch('backend.api.websocket_routes.manager', mock_manager):
        with patch('builtins.print'):  # Suppress print output
            await websocket_execution_stream(mock_websocket, "exec-123")
    
    mock_manager.disconnect.assert_called_once_with(mock_websocket, "exec-123")
