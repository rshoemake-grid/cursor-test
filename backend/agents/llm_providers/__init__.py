"""
LLM Provider Strategy Module - OCP compliant provider execution.
Each provider implements a common interface; new providers can be added without modifying existing code.
"""
from .base import ILLMProviderStrategy
from .registry import ProviderRegistry, get_provider_registry

__all__ = [
    "ILLMProviderStrategy",
    "ProviderRegistry",
    "get_provider_registry",
]
