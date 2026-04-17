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


def test_get_gemini_studio_api_key_first_enabled_gemini():
    cache = {}
    svc = SettingsService(cache=cache)
    gemini_key = "ai-studio-key-12345678901234567890123456789012"
    settings = LLMSettings(
        providers=[
            _provider(id="o1", name="OpenAI", type="openai"),
            LLMProvider(
                id="g1",
                name="Gemini",
                type="gemini",
                apiKey=gemini_key,
                baseUrl=None,
                defaultModel="gemini-3-flash-preview",
                models=["gemini-3-flash-preview"],
                enabled=True,
            ),
        ],
        iteration_limit=10,
        default_model="gpt-4o-mini",
    )
    cache["user-1"] = settings
    assert svc.get_gemini_studio_api_key("user-1") == gemini_key


def test_get_gemini_studio_api_key_skips_disabled_gemini():
    cache = {}
    svc = SettingsService(cache=cache)
    settings = LLMSettings(
        providers=[
            LLMProvider(
                id="g1",
                name="Gemini",
                type="gemini",
                apiKey="ai-studio-key-12345678901234567890123456789012",
                baseUrl=None,
                defaultModel="gemini-3-flash-preview",
                models=["gemini-3-flash-preview"],
                enabled=False,
            ),
        ],
        iteration_limit=10,
        default_model="gemini-3-flash-preview",
    )
    cache["user-1"] = settings
    assert svc.get_gemini_studio_api_key("user-1") is None


def test_gemini_empty_api_key_is_active_when_vertex_configured(monkeypatch):
    monkeypatch.setattr(
        "backend.utils.vertex_gemini.vertex_ai_configured",
        lambda: True,
    )
    cache = {}
    svc = SettingsService(cache=cache)
    settings = LLMSettings(
        providers=[
            LLMProvider(
                id="g1",
                name="Gemini",
                type="gemini",
                apiKey="",
                baseUrl=None,
                defaultModel="gemini-3-flash-preview",
                models=["gemini-3-flash-preview", "gemini-3.1-pro-preview"],
                enabled=True,
            ),
        ],
        iteration_limit=10,
        default_model="gemini-3.1-pro-preview",
    )
    cache["user-1"] = settings
    cfg = svc.get_active_llm_config("user-1")
    assert cfg is not None
    assert cfg["type"] == "gemini"
    assert not (cfg.get("api_key") or "").strip()


def test_gemini_empty_api_key_not_active_when_vertex_unconfigured(monkeypatch):
    monkeypatch.setattr(
        "backend.utils.vertex_gemini.vertex_ai_configured",
        lambda: False,
    )
    cache = {}
    svc = SettingsService(cache=cache)
    settings = LLMSettings(
        providers=[
            LLMProvider(
                id="g1",
                name="Gemini",
                type="gemini",
                apiKey="",
                baseUrl=None,
                defaultModel="gemini-3-flash-preview",
                models=["gemini-3-flash-preview"],
                enabled=True,
            ),
        ],
        iteration_limit=10,
        default_model="gemini-3-flash-preview",
    )
    cache["user-1"] = settings
    assert svc.get_active_llm_config("user-1") is None
