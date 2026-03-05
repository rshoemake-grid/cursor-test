"""Unit tests for backend.agents.llm_providers - provider strategy pattern."""
import pytest
from unittest.mock import AsyncMock, Mock, patch

from backend.agents.llm_providers.base import ILLMProviderStrategy
from backend.agents.llm_providers.registry import ProviderRegistry
from backend.agents.llm_providers.openai_provider import OpenAIProviderStrategy
from backend.agents.llm_providers.anthropic_provider import AnthropicProviderStrategy
from backend.agents.llm_providers.custom_provider import CustomProviderStrategy
from backend.models.schemas import AgentConfig


class TestILLMProviderStrategy:
    def test_provider_type_is_abstract(self):
        with pytest.raises(TypeError):
            class IncompleteStrategy(ILLMProviderStrategy):
                pass
            IncompleteStrategy()


class TestOpenAIProviderStrategy:
    def test_provider_type(self):
        strategy = OpenAIProviderStrategy()
        assert strategy.provider_type == "openai"

    @pytest.mark.asyncio
    async def test_execute_returns_content(self):
        strategy = OpenAIProviderStrategy()
        agent_config = AgentConfig(model="gpt-4", temperature=0.7)
        config = {"api_key": "sk-test", "base_url": "https://api.openai.com/v1"}
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"choices": [{"message": {"content": "Hello"}}]}
        with patch("backend.agents.llm_providers.openai_compatible.httpx.AsyncClient") as m:
            mc = AsyncMock()
            mc.post = AsyncMock(return_value=mock_response)
            mc.__aenter__ = AsyncMock(return_value=mc)
            mc.__aexit__ = AsyncMock(return_value=None)
            m.return_value = mc
            result = await strategy.execute("Hello", "gpt-4", config, agent_config)
            assert result == "Hello"


class TestProviderRegistry:
    def test_get_openai(self):
        assert ProviderRegistry.get("openai").provider_type == "openai"
    def test_get_unknown_returns_none(self):
        assert ProviderRegistry.get("unknown") is None
