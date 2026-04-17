from collections import deque
from typing import Deque, Dict, Set, Tuple
from fastapi import WebSocket
import asyncio

# Ring buffer per execution so clients that connect after POST /execute still receive
# early log/status events (background task often broadcasts before the browser opens WS).
EXECUTION_WS_BUFFER_MAX_MESSAGES = 500


class ConnectionManager:
    """Manages WebSocket connections for real-time execution updates"""
    
    def __init__(self):
        # Maps execution_id to set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._message_buffers: Dict[str, Deque[Tuple[int, dict]]] = {}
        self._buffer_seq: Dict[str, int] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, execution_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()

        # Deliver buffered history in order, including events that arrive while we catch up.
        # Register only when a lock snapshot shows nothing left to send, so nothing is missed
        # in the gap between the last send_json and add().
        last_delivered = -1
        while True:
            async with self._lock:
                buf = self._message_buffers.get(execution_id)
                if buf:
                    chunk_pairs = [
                        (seq, msg) for seq, msg in buf if seq > last_delivered
                    ]
                else:
                    chunk_pairs = []
                if not chunk_pairs:
                    if execution_id not in self.active_connections:
                        self.active_connections[execution_id] = set()
                    self.active_connections[execution_id].add(websocket)
                    return

            highest = last_delivered
            for seq, message in chunk_pairs:
                try:
                    await websocket.send_json(message)
                except Exception:
                    return
                if seq > highest:
                    highest = seq
            last_delivered = highest
    
    async def disconnect(self, websocket: WebSocket, execution_id: str):
        """Remove a WebSocket connection"""
        async with self._lock:
            if execution_id in self.active_connections:
                self.active_connections[execution_id].discard(websocket)
                if not self.active_connections[execution_id]:
                    del self.active_connections[execution_id]
                    self._message_buffers.pop(execution_id, None)
                    self._buffer_seq.pop(execution_id, None)
    
    async def send_message(self, execution_id: str, message: dict):
        """Send a message to all connections watching this execution"""
        async with self._lock:
            next_seq = self._buffer_seq.get(execution_id, 0) + 1
            self._buffer_seq[execution_id] = next_seq
            if execution_id not in self._message_buffers:
                self._message_buffers[execution_id] = deque(
                    maxlen=EXECUTION_WS_BUFFER_MAX_MESSAGES
                )
            self._message_buffers[execution_id].append((next_seq, message))

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

