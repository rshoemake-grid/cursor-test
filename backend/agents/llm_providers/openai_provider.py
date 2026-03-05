"""OpenAI provider strategy."""
from typing import Any, Dict

from .base import ILLMProviderStrategy
from .openai_compatible import execute_openai_compatible


class OpenAIProviderStrategy(ILLMProviderStrategy):
    """Execute using OpenAI API - supports text and vision models"""

    @property
    def provider_type(self) -> str:
        return "openai"

    async def execute(
        self,
        user_message: Any,
        model: str,
        config: Dict[str, Any],
        agent_config: Any,
    ) -> Any:
        base_url = config.get("base_url", "https://api.openai.com/v1")
        return await execute_openai_compatible(
            user_message, model, config, agent_config,
            base_url=base_url,
            error_prefix="OpenAI API",
        )
