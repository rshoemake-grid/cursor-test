"""Anthropic provider strategy."""
import httpx
from typing import Any, Dict

from .base import ILLMProviderStrategy
from ...utils.logger import get_logger

logger = get_logger(__name__)


class AnthropicProviderStrategy(ILLMProviderStrategy):
    """Execute using Anthropic API - supports text and vision models"""

    @property
    def provider_type(self) -> str:
        return "anthropic"

    async def execute(
        self,
        user_message: Any,
        model: str,
        config: Dict[str, Any],
        agent_config: Any,
    ) -> Any:
        base_url = config.get("base_url", "https://api.anthropic.com/v1")
        api_key = config["api_key"]

        messages = [{
            "role": "user",
            "content": user_message if isinstance(user_message, list) else user_message,
        }]

        request_data = {
            "model": model,
            "messages": messages,
            "max_tokens": agent_config.max_tokens or 1024,
            "temperature": agent_config.temperature,
        }

        if agent_config.system_prompt:
            request_data["system"] = agent_config.system_prompt

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{base_url}/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json=request_data,
            )

            if response.status_code != 200:
                raise RuntimeError(
                    f"Anthropic API request failed with status {response.status_code}: {response.text}"
                )

            data = response.json()
            return data["content"][0]["text"]
