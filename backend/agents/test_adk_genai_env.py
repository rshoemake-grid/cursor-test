"""Tests for ADK / google-genai environment (Vertex + ADC vs API key)."""

import os
from unittest.mock import patch

from backend.agents.adk_agent import configure_google_genai_env_for_adk


@patch("backend.utils.vertex_gemini.resolve_project_and_location")
def test_configure_uses_vertex_when_gemini_provider_has_no_api_key(mock_resolve, monkeypatch):
    mock_resolve.return_value = ("my-gcp-project", "us-central1")
    for key in (
        "GOOGLE_GENAI_USE_VERTEXAI",
        "GOOGLE_CLOUD_PROJECT",
        "GOOGLE_CLOUD_LOCATION",
        "GOOGLE_API_KEY",
        "GEMINI_API_KEY",
    ):
        monkeypatch.delenv(key, raising=False)

    configure_google_genai_env_for_adk(
        auth_configs=[
            {
                "type": "gemini",
                "api_key": "",
                "model": "gemini-2.5-flash",
            }
        ],
        agent_model="gemini-2.5-flash",
    )
    mock_resolve.assert_called_once()
    assert os.environ.get("GOOGLE_GENAI_USE_VERTEXAI") == "true"
    assert os.environ.get("GOOGLE_CLOUD_PROJECT") == "my-gcp-project"
    assert os.environ.get("GOOGLE_CLOUD_LOCATION") == "us-central1"


def test_configure_uses_developer_api_when_api_key_set(monkeypatch):
    for key in (
        "GOOGLE_GENAI_USE_VERTEXAI",
        "GOOGLE_CLOUD_PROJECT",
        "GOOGLE_CLOUD_LOCATION",
        "GOOGLE_API_KEY",
        "GEMINI_API_KEY",
    ):
        monkeypatch.delenv(key, raising=False)

    configure_google_genai_env_for_adk(
        auth_configs=[{"type": "gemini", "apiKey": "secret-key"}],
        agent_model="gemini-2.5-flash",
    )
    assert os.environ.get("GOOGLE_API_KEY") == "secret-key"
    assert "GOOGLE_GENAI_USE_VERTEXAI" not in os.environ
