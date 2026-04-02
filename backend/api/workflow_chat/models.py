"""Pydantic models and constants for workflow chat"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# OCP: Node type -> config key for add_node (add new types without editing if/elif)
NODE_CONFIG_KEYS = {
    "agent": "agent_config",
    "condition": "condition_config",
    "loop": "loop_config",
    "gcp_bucket": "input_config",
    "aws_s3": "input_config",
    "gcp_pubsub": "input_config",
    "local_filesystem": "input_config",
}


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class CanvasSnapshot(BaseModel):
    """Current graph from the client canvas (API-shaped nodes/edges). When sent, the chat agent uses this instead of the last saved DB definition so unsaved edits match the UI."""

    nodes: List[Any] = Field(default_factory=list)
    edges: List[Any] = Field(default_factory=list)


class ChatRequest(BaseModel):
    workflow_id: Optional[str] = None
    message: str
    conversation_history: List[ChatMessage] = []
    iteration_limit: Optional[int] = Field(
        default=None,
        ge=1,
        le=100,
        description="Override max tool–LLM cycles for this request (optional).",
    )
    canvas_snapshot: Optional[CanvasSnapshot] = Field(
        default=None,
        description="Optional live canvas from the UI; overrides stored workflow definition for context only.",
    )


class ChatResponse(BaseModel):
    message: str
    workflow_changes: Optional[Dict[str, Any]] = None  # nodes/edges to add/update/delete
    workflow_id: Optional[str] = None
