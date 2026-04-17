"""UnifiedLLMAgent: Gemini model + Vertex ADC when model missing from Settings providers."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.agents.unified_llm_agent import UnifiedLLMAgent
from backend.models.schemas import AgentConfig, InputMapping, Node, NodeType


def _agent_node(model_id: str) -> Node:
    return Node(
        id="n1",
        type=NodeType.AGENT,
        name="Test",
        agent_config=AgentConfig(
            model=model_id,
            system_prompt="hi",
        ),
        inputs=[InputMapping(name="data", source_field="output")],
    )


@pytest.mark.asyncio
async def test_gemini_model_not_in_settings_uses_vertex_when_configured():
    node = _agent_node("gemini-3.1-pro-preview")
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-1234567890",
        "model": "gpt-4o-mini",
    }
    mock_strategy = MagicMock()
    mock_strategy.execute = AsyncMock(return_value="ok")

    def resolver(_model, _uid):
        return None

    agent = UnifiedLLMAgent(
        node,
        llm_config=llm_config,
        user_id="user-1",
        provider_resolver=resolver,
    )

    with (
        patch.object(UnifiedLLMAgent, "_resolve_gemini_studio_api_key", return_value=None),
        patch(
            "backend.utils.vertex_gemini.vertex_ai_configured",
            return_value=True,
        ),
        patch(
            "backend.agents.llm_providers.registry.ProviderRegistry.get",
            return_value=mock_strategy,
        ) as mock_registry_get,
    ):
        out = await agent.execute({"data": "x"})

    assert out == "ok"
    mock_registry_get.assert_called_once_with("gemini")
    call_kw = mock_strategy.execute.call_args
    assert call_kw[0][2]["type"] == "gemini"
    assert call_kw[0][2].get("api_key") in ("", None) or not str(call_kw[0][2].get("api_key", "")).strip()
    assert call_kw[0][1] == "gemini-3.1-pro-preview"


@pytest.mark.asyncio
async def test_gemini_model_not_in_settings_prefers_studio_key_over_vertex():
    node = _agent_node("gemini-3.1-pro-preview")
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-1234567890",
        "model": "gpt-4o-mini",
    }
    mock_strategy = MagicMock()
    mock_strategy.execute = AsyncMock(return_value="ok")
    studio = "ai-studio-key-12345678901234567890123456789012"

    def resolver(_model, _uid):
        return None

    agent = UnifiedLLMAgent(
        node,
        llm_config=llm_config,
        user_id="user-1",
        provider_resolver=resolver,
    )

    with (
        patch.object(UnifiedLLMAgent, "_resolve_gemini_studio_api_key", return_value=studio),
        patch(
            "backend.utils.vertex_gemini.vertex_ai_configured",
            return_value=True,
        ),
        patch(
            "backend.agents.llm_providers.registry.ProviderRegistry.get",
            return_value=mock_strategy,
        ),
    ):
        out = await agent.execute({"data": "x"})

    assert out == "ok"
    assert mock_strategy.execute.call_args[0][2]["api_key"] == studio


@pytest.mark.asyncio
async def test_gemini_model_not_in_settings_raises_when_vertex_not_configured():
    node = _agent_node("gemini-3.1-pro-preview")
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-1234567890",
        "model": "gpt-4o-mini",
    }

    def resolver(_model, _uid):
        return None

    agent = UnifiedLLMAgent(
        node,
        llm_config=llm_config,
        user_id="user-1",
        provider_resolver=resolver,
    )

    with (
        patch.object(UnifiedLLMAgent, "_resolve_gemini_studio_api_key", return_value=None),
        patch(
            "backend.utils.vertex_gemini.vertex_ai_configured",
            return_value=False,
        ),
        pytest.raises(ValueError, match="not found in any enabled provider"),
    ):
        await agent.execute({"data": "x"})
