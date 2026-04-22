"""execute_agent forwards execution broadcaster logs to UnifiedLLMAgent."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.engine.nodes import executors
from backend.models.schemas import AgentConfig, Node, NodeType


@pytest.mark.asyncio
async def test_execute_agent_passes_broadcaster_log_as_callback(monkeypatch):
    """So the console shows provider / Gemini progress during long LLM calls."""
    captured = {}

    def fake_get_agent(cls, node, **kwargs):
        captured["log_callback"] = kwargs.get("log_callback")
        agent = MagicMock()
        agent.config = AgentConfig(model="m", system_prompt="hi")
        agent.execute = AsyncMock(return_value="out")
        return agent

    monkeypatch.setattr(
        executors.AgentRegistry, "get_agent", classmethod(fake_get_agent)
    )

    broadcaster = MagicMock()
    broadcaster.log = AsyncMock()

    executor = MagicMock()
    executor.llm_config = {"type": "openai", "model": "gpt-4o-mini", "api_key": "sk-test"}
    executor.user_id = "user-1"
    executor.provider_resolver = None
    executor.settings_service = None
    executor._broadcaster = broadcaster

    node = Node(
        id="n1",
        type=NodeType.AGENT,
        agent_config=AgentConfig(model="m", system_prompt="hi"),
    )

    result = await executors.execute_agent(executor, node, {"data": "x"})
    assert result == "out"
    assert captured["log_callback"] is broadcaster.log
