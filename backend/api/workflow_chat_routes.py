"""
P3-12: Re-export for backward compatibility. DEPRECATED.
Use: from backend.api.workflow_chat import router, ...
Migration: Replace workflow_chat_routes with workflow_chat. Removal planned v2.0.
"""
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
