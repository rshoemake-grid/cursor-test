from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/executions/{execution_id}")
async def websocket_execution_stream(websocket: WebSocket, execution_id: str):
    """
    WebSocket endpoint for streaming real-time execution updates
    
    Clients connect with execution_id and receive:
    - Status updates
    - Node execution updates
    - Log entries
    - Completion/error notifications
    """
    await manager.connect(websocket, execution_id)
    
    try:
        # Keep connection alive and handle incoming messages if needed
        while True:
            # Receive messages (for potential future bidirectional communication)
            data = await websocket.receive_text()
            
            # Could handle commands like pause/resume here in future
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        await manager.disconnect(websocket, execution_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await manager.disconnect(websocket, execution_id)

