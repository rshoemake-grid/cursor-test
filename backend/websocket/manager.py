import json
from typing import Dict, Set
from fastapi import WebSocket
import asyncio


class ConnectionManager:
    """Manages WebSocket connections for real-time execution updates"""
    
    def __init__(self):
        # Maps execution_id to set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, execution_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        async with self._lock:
            if execution_id not in self.active_connections:
                self.active_connections[execution_id] = set()
            self.active_connections[execution_id].add(websocket)
    
    async def disconnect(self, websocket: WebSocket, execution_id: str):
        """Remove a WebSocket connection"""
        async with self._lock:
            if execution_id in self.active_connections:
                self.active_connections[execution_id].discard(websocket)
                if not self.active_connections[execution_id]:
                    del self.active_connections[execution_id]
    
    async def send_message(self, execution_id: str, message: dict):
        """Send a message to all connections watching this execution"""
        async with self._lock:
            if execution_id in self.active_connections:
                disconnected = set()
                
                for connection in self.active_connections[execution_id]:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        disconnected.add(connection)
                
                # Remove disconnected connections
                for conn in disconnected:
                    self.active_connections[execution_id].discard(conn)
    
    async def broadcast_status(self, execution_id: str, status: str, data: dict = None):
        """Broadcast execution status update"""
        message = {
            "type": "status",
            "execution_id": execution_id,
            "status": status,
            "data": data or {},
            "timestamp": str(asyncio.get_event_loop().time())
        }
        await self.send_message(execution_id, message)
    
    async def broadcast_node_update(self, execution_id: str, node_id: str, node_state: dict):
        """Broadcast node execution update"""
        message = {
            "type": "node_update",
            "execution_id": execution_id,
            "node_id": node_id,
            "node_state": node_state,
            "timestamp": str(asyncio.get_event_loop().time())
        }
        await self.send_message(execution_id, message)
    
    async def broadcast_log(self, execution_id: str, log_entry: dict):
        """Broadcast log entry"""
        message = {
            "type": "log",
            "execution_id": execution_id,
            "log": log_entry,
            "timestamp": str(asyncio.get_event_loop().time())
        }
        await self.send_message(execution_id, message)
    
    async def broadcast_completion(self, execution_id: str, result: dict):
        """Broadcast execution completion"""
        message = {
            "type": "completion",
            "execution_id": execution_id,
            "result": result,
            "timestamp": str(asyncio.get_event_loop().time())
        }
        await self.send_message(execution_id, message)
    
    async def broadcast_error(self, execution_id: str, error: str):
        """Broadcast execution error"""
        message = {
            "type": "error",
            "execution_id": execution_id,
            "error": error,
            "timestamp": str(asyncio.get_event_loop().time())
        }
        await self.send_message(execution_id, message)


# Global connection manager instance
manager = ConnectionManager()

