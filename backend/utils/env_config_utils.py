"""Environment-based config helpers (DRY)."""
import os
from typing import Any, Dict, Optional


def get_llm_fallback_config_from_env() -> Optional[Dict[str, Any]]:
    """Return first available LLM config from env vars (OPENAI, Anthropic, Gemini)."""
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        return {
            "type": "openai",
            "api_key": openai_key,
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4",
        }

    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        return {
            "type": "anthropic",
            "api_key": anthropic_key,
            "base_url": "https://api.anthropic.com/v1",
            "model": "claude-3-5-sonnet-20241022",
        }

    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        return {
            "type": "gemini",
            "api_key": gemini_key,
            "base_url": "https://generativelanguage.googleapis.com/v1beta",
            "model": "gemini-3-flash-preview",
        }

    return None
