"""OpenAI provider strategy."""
import httpx
from typing import Any, Dict

from .base import ILLMProviderStrategy
from ...utils.logger import get_logger

logger = get_logger(__name__)


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
        api_key = config["api_key"]

        messages = []
        if agent_config.system_prompt:
            messages.append({"role": "system", "content": agent_config.system_prompt})

        if isinstance(user_message, list):
            messages.append({"role": "user", "content": user_message})
        else:
            messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": agent_config.temperature,
                    "max_tokens": agent_config.max_tokens,
                },
            )

            if response.status_code != 200:
                raise RuntimeError(
                    f"OpenAI API request failed with status {response.status_code}: {response.text}"
                )

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            if content is None:
                message = data["choices"][0]["message"]
                if "image" in message:
                    return message["image"]
                return ""

            return content
