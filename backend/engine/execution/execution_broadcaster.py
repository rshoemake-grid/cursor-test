"""Logging and WebSocket broadcasting for workflow execution (SRP)"""
from datetime import datetime, timezone
from typing import Optional

from ...models.schemas import ExecutionState, ExecutionLogEntry, NodeState
from ...websocket.manager import manager as ws_manager


class ExecutionBroadcaster:
    """Handles execution logging and WebSocket broadcasts."""

    def __init__(
        self,
        execution_id: str,
        execution_state: ExecutionState,
        stream_updates: bool = False,
    ):
        self.execution_id = execution_id
        self.execution_state = execution_state
        self.stream_updates = stream_updates

    async def log(self, level: str, node_id: Optional[str], message: str) -> None:
        """Add a log entry and broadcast it"""
        if self.execution_state:
            log_entry = ExecutionLogEntry(
                timestamp=datetime.now(timezone.utc),
                level=level,
                node_id=node_id,
                message=message,
            )
            self.execution_state.logs.append(log_entry)
            if self.stream_updates:
                await ws_manager.broadcast_log(
                    self.execution_id,
                    log_entry.model_dump(mode="json"),
                )

    async def broadcast_status(self, status: str) -> None:
        """Broadcast execution status update"""
        if self.stream_updates:
            await ws_manager.broadcast_status(
                self.execution_id,
                status,
                {
                    "workflow_id": self.execution_state.workflow_id,
                    "started_at": str(self.execution_state.started_at),
                },
            )

    async def broadcast_node_update(self, node_id: str, node_state: NodeState) -> None:
        """Broadcast node execution update"""
        if self.stream_updates:
            await ws_manager.broadcast_node_update(
                self.execution_id,
                node_id,
                node_state.model_dump(mode="json"),
            )

    async def broadcast_completion(self) -> None:
        """Broadcast execution completion"""
        if self.stream_updates:
            await ws_manager.broadcast_completion(
                self.execution_id,
                {
                    "status": self.execution_state.status.value,
                    "result": self.execution_state.result,
                    "completed_at": str(self.execution_state.completed_at),
                },
            )

    async def broadcast_error(self, error: str) -> None:
        """Broadcast execution error"""
        if self.stream_updates:
            await ws_manager.broadcast_error(self.execution_id, error)
