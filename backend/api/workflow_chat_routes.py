"""Re-export for backward compatibility. Use backend.api.workflow_chat instead."""
from openai import AsyncOpenAI  # For test patching

from backend.api.workflow_chat import router
from backend.api.workflow_chat.models import ChatMessage, ChatRequest, ChatResponse, NODE_CONFIG_KEYS
from backend.api.workflow_chat.tools import get_workflow_tools, tool_response
from backend.api.workflow_chat.context import get_workflow_context

__all__ = [
    "router",
    "ChatMessage",
    "ChatRequest",
    "ChatResponse",
    "NODE_CONFIG_KEYS",
    "get_workflow_tools",
    "tool_response",
    "get_workflow_context",
]
