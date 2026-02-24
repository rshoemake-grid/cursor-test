"""
Additional tests for websocket_routes.py - ping/pong
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.websockets import WebSocketDisconnect
from backend.api.websocket_routes import websocket_execution_stream


@pytest.mark.asyncio
async def test_websocket_ping_pong():
    """Test WebSocket ping/pong handling (lines 27-28)"""
    mock_websocket = AsyncMock()
    mock_websocket.receive_text = AsyncMock(side_effect=["ping", WebSocketDisconnect()])
    mock_websocket.send_json = AsyncMock()
    
    mock_manager = MagicMock()
    mock_manager.connect = AsyncMock()
    mock_manager.disconnect = AsyncMock()
    
    with patch('backend.api.websocket_routes.manager', mock_manager):
        try:
            await websocket_execution_stream(mock_websocket, "exec-123")
        except WebSocketDisconnect:
            pass
    
    mock_websocket.send_json.assert_called_once_with({"type": "pong"})
