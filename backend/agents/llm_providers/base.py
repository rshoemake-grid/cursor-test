"""
Base interface for LLM provider strategies.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict


class ILLMProviderStrategy(ABC):
    """Interface for LLM provider execution strategies"""

    @property
    @abstractmethod
    def provider_type(self) -> str:
        """Provider identifier (e.g. 'openai', 'anthropic', 'gemini', 'custom')"""
        pass

    @abstractmethod
    async def execute(
        self,
        user_message: Any,
        model: str,
        config: Dict[str, Any],
        agent_config: Any,
    ) -> Any:
        """
        Execute the LLM request.

        Args:
            user_message: User message (string or list for vision)
            model: Model name
            config: LLM config dict (api_key, base_url, etc.)
            agent_config: AgentConfig with system_prompt, temperature, max_tokens

        Returns:
            Response content (typically string)
        """
        pass
