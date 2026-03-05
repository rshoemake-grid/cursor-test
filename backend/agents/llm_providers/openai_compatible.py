"""Shared logic for OpenAI and OpenAI-compatible (custom) providers."""
import httpx
from typing import Any, Dict


async def execute_openai_compatible(
    user_message: Any,
    model: str,
    config: Dict[str, Any],
    agent_config: Any,
    base_url: str,
    error_prefix: str = "OpenAI API",
) -> Any:
    """
    Execute a chat completion against an OpenAI-compatible API.
    Used by both OpenAIProviderStrategy and CustomProviderStrategy.
    """
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
                f"{error_prefix} request failed with status {response.status_code}: {response.text}"
            )

        data = response.json()
        content = data["choices"][0]["message"]["content"]

        if content is None:
            message = data["choices"][0]["message"]
            if "image" in message:
                return message["image"]
            return ""

        return content
