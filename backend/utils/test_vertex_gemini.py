"""Tests for Vertex AI Gemini helpers (ADC / env resolution)."""

from backend.utils import vertex_gemini


def test_vertex_ai_configured_requires_project(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    assert vertex_gemini.vertex_ai_configured() is False

    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "my-proj")
    assert vertex_gemini.vertex_ai_configured() is True


def test_resolve_project_and_location(monkeypatch):
    monkeypatch.setenv("GCP_PROJECT", "from-gcp")
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.setenv("VERTEX_LOCATION", "europe-west1")
    p, loc = vertex_gemini.resolve_project_and_location()
    assert p == "from-gcp"
    assert loc == "europe-west1"

    monkeypatch.delenv("VERTEX_LOCATION", raising=False)
    monkeypatch.delenv("GOOGLE_CLOUD_REGION", raising=False)
    _, loc2 = vertex_gemini.resolve_project_and_location()
    assert loc2 == "us-central1"


def test_vertex_openai_model_id_prefix_idempotent():
    assert vertex_gemini.vertex_openai_model_id("gemini-2.5-flash") == "google/gemini-2.5-flash"
    assert vertex_gemini.vertex_openai_model_id("google/gemini-2.5-flash") == "google/gemini-2.5-flash"


def test_vertex_generate_content_model_strips_google_prefix():
    assert (
        vertex_gemini.vertex_generate_content_model_id("google/gemini-2.5-flash")
        == "gemini-2.5-flash"
    )
    assert vertex_gemini.vertex_generate_content_model_id("gemini-2.5-flash") == "gemini-2.5-flash"


def test_vertex_openai_base_url():
    u = vertex_gemini.vertex_openai_compat_base_url("p1", "us-central1")
    assert u.startswith("https://us-central1-aiplatform.googleapis.com/v1/projects/p1/")
    assert u.endswith("/endpoints/openapi")


def test_vertex_generate_content_url():
    u = vertex_gemini.vertex_generate_content_url("p1", "us-central1", "gemini-2.5-flash")
    assert ":generateContent" in u
    assert "publishers/google/models/gemini-2.5-flash" in u
