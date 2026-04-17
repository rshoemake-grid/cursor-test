"""Gemini agent path uses Vertex OpenAI-compatible chat for ADC (parity with workflow chat)."""

import pytest

from backend.agents.llm_providers.gemini_provider import GeminiProviderStrategy


@pytest.mark.asyncio
async def test_vertex_adc_text_request_uses_openai_compat_client(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-openai-parity")
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    monkeypatch.setenv("VERTEX_LOCATION", "us-central1")

    calls: dict = {}

    class FakeMsg:
        content = "ok-from-chat-api"

    class FakeChoice:
        message = FakeMsg()

    class FakeResp:
        choices = [FakeChoice()]

    class FakeCompletions:
        async def create(self, **kwargs):
            calls["create_kwargs"] = kwargs
            return FakeResp()

    class FakeChat:
        completions = FakeCompletions()

    class FakeClient:
        chat = FakeChat()

        async def close(self):
            calls["closed"] = True

    def fake_create_vertex_client(project_id, location):
        calls["project_id"] = project_id
        calls["location"] = location
        return FakeClient()

    monkeypatch.setattr(
        "backend.utils.vertex_gemini.create_vertex_async_openai_client",
        fake_create_vertex_client,
    )

    strategy = GeminiProviderStrategy()
    agent_config = type(
        "AC",
        (),
        {"system_prompt": "be brief", "temperature": 0.2, "max_tokens": 64},
    )()
    out = await strategy.execute(
        "hello",
        "gemini-2.5-flash",
        {"api_key": "", "base_url": "https://generativelanguage.googleapis.com/v1beta"},
        agent_config,
    )
    assert out == "ok-from-chat-api"
    assert calls["project_id"] == "test-openai-parity"
    assert calls["location"] == "us-central1"
    assert calls["closed"] is True
    kw = calls["create_kwargs"]
    assert kw["model"] == "google/gemini-2.5-flash"
    assert kw["messages"][0]["role"] == "system"
    assert kw["messages"][1]["role"] == "user"
    assert kw["messages"][1]["content"] == "hello"


@pytest.mark.asyncio
async def test_vertex_image_output_model_still_uses_generate_content(monkeypatch):
    """Image-generation models need :generateContent (responseModalities); do not use chat shortcut."""
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-proj")
    monkeypatch.setenv("VERTEX_LOCATION", "us-central1")

    openai_called = {"v": False}

    def fake_create_vertex_client(_p, _l):
        openai_called["v"] = True
        raise AssertionError("OpenAI compat client should not be used for image output models")

    monkeypatch.setattr(
        "backend.utils.vertex_gemini.create_vertex_async_openai_client",
        fake_create_vertex_client,
    )

    posted = {}

    async def fake_post_vertex(model, json_body, timeout=300.0):
        class R:
            status_code = 200
            text = '{"candidates":[{"content":{"parts":[{"text":"img-ok"}]}}]}'

            def json(self):
                import json

                return json.loads(self.text)

        posted["model"] = model
        return R()

    monkeypatch.setattr(
        "backend.utils.vertex_gemini.post_vertex_generate_content",
        fake_post_vertex,
    )

    strategy = GeminiProviderStrategy()
    agent_config = type("AC", (), {"system_prompt": None, "temperature": None, "max_tokens": None})()
    out = await strategy.execute(
        "draw something",
        "gemini-2.5-flash-image",
        {"api_key": "", "base_url": "https://generativelanguage.googleapis.com/v1beta"},
        agent_config,
    )
    assert openai_called["v"] is False
    assert "flash-image" in posted["model"].lower() or "image" in posted["model"].lower()
    assert out == "img-ok"
