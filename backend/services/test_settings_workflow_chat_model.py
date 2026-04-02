"""Settings: chat_assistant_model resolution for workflow chat."""
import pytest

from backend.api.settings_routes import LLMProvider, LLMSettings
from backend.services.settings_service import SettingsService


def _provider(**kwargs):
    base = dict(
        id="p1",
        name="OpenAI",
        type="openai",
        apiKey="sk-test-key-123456789012345678901234567890",
        baseUrl=None,
        defaultModel="gpt-4o-mini",
        models=["gpt-4o-mini", "gpt-4o"],
        enabled=True,
    )
    base.update(kwargs)
    return LLMProvider(**base)


def test_chat_config_uses_chat_assistant_model_when_set():
    cache = {}
    svc = SettingsService(cache=cache)
    settings = LLMSettings(
        providers=[_provider()],
        iteration_limit=10,
        default_model="gpt-4o-mini",
        chat_assistant_model="gpt-4o",
    )
    cache["user-1"] = settings
    cfg = svc.get_llm_config_for_workflow_chat("user-1")
    assert cfg is not None
    assert cfg.get("model") == "gpt-4o"


def test_chat_config_falls_back_when_chat_model_unknown():
    cache = {}
    svc = SettingsService(cache=cache)
    settings = LLMSettings(
        providers=[_provider()],
        iteration_limit=10,
        default_model="gpt-4o-mini",
        chat_assistant_model="unknown-model-xyz",
    )
    cache["user-1"] = settings
    cfg = svc.get_llm_config_for_workflow_chat("user-1")
    assert cfg is not None
    assert cfg.get("model") == "gpt-4o-mini"


def test_chat_config_empty_string_uses_active():
    cache = {}
    svc = SettingsService(cache=cache)
    settings = LLMSettings(
        providers=[_provider()],
        iteration_limit=10,
        default_model="gpt-4o",
        chat_assistant_model="",
    )
    cache["user-1"] = settings
    cfg = svc.get_llm_config_for_workflow_chat("user-1")
    assert cfg is not None
    assert cfg.get("model") == "gpt-4o"
