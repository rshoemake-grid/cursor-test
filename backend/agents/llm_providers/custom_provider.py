"""Custom (OpenAI-compatible) provider strategy."""
from typing import Any, Dict

from .base import ILLMProviderStrategy
from .openai_compatible import execute_openai_compatible


class CustomProviderStrategy(ILLMProviderStrategy):
    """Execute using custom OpenAI-compatible API - supports text and vision models"""

    @property
    def provider_type(self) -> str:
        return "custom"

    async def execute(
        self,
        user_message: Any,
        model: str,
        config: Dict[str, Any],
        agent_config: Any,
    ) -> Any:
        base_url = config.get("base_url")
        if not base_url:
            raise ValueError("base_url is required for custom providers")

        return await execute_openai_compatible(
            user_message, model, config, agent_config,
            base_url=base_url,
            error_prefix="Custom API",
        )
