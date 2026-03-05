"""Provider strategy registry - OCP compliant provider lookup."""
from typing import Dict, Optional

from .base import ILLMProviderStrategy
from .openai_provider import OpenAIProviderStrategy
from .anthropic_provider import AnthropicProviderStrategy
from .custom_provider import CustomProviderStrategy

# Lazy import for Gemini to avoid loading heavy dependencies at module load
_gemini_strategy: Optional[ILLMProviderStrategy] = None


def _get_gemini_strategy() -> ILLMProviderStrategy:
    global _gemini_strategy
    if _gemini_strategy is None:
        from .gemini_provider import GeminiProviderStrategy
        _gemini_strategy = GeminiProviderStrategy()
    return _gemini_strategy


class ProviderRegistry:
    """Registry for LLM provider strategies - new providers can be registered without modifying callers."""

    _strategies: Dict[str, ILLMProviderStrategy] = {
        "openai": OpenAIProviderStrategy(),
        "anthropic": AnthropicProviderStrategy(),
        "custom": CustomProviderStrategy(),
    }

    @classmethod
    def get(cls, provider_type: str) -> Optional[ILLMProviderStrategy]:
        """Get strategy for provider type. Gemini is loaded lazily."""
        if provider_type in cls._strategies:
            return cls._strategies[provider_type]
        if provider_type == "gemini":
            return _get_gemini_strategy()
        return None

    @classmethod
    def register(cls, provider_type: str, strategy: ILLMProviderStrategy) -> None:
        """Register a new provider strategy (OCP - open for extension)."""
        cls._strategies[provider_type] = strategy


def get_provider_registry() -> ProviderRegistry:
    """Get the default provider registry."""
    return ProviderRegistry
