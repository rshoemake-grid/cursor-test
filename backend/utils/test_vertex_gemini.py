"""Tests for Vertex AI Gemini helpers (ADC / env resolution)."""

from unittest.mock import MagicMock

from backend.utils import vertex_gemini


def test_vertex_ai_configured_false_without_env_or_adc_project(monkeypatch):
    from backend.config import clear_settings_cache

    clear_settings_cache()
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    fake_s = type("S", (), {"google_cloud_project": None, "gcp_project": None})()
    monkeypatch.setattr("backend.config.get_settings", lambda: fake_s)
    monkeypatch.setattr(
        "backend.inputs.gcp_auth.resolve_gcp_default_project_id",
        lambda credentials_inline=None: None,
    )
    assert vertex_gemini.vertex_ai_configured() is False


def test_vertex_ai_configured_true_from_env(monkeypatch):
    from backend.config import clear_settings_cache

    clear_settings_cache()
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "my-proj")
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    assert vertex_gemini.vertex_ai_configured() is True


def test_vertex_ai_configured_true_from_adc_when_env_missing(monkeypatch):
    from backend.config import clear_settings_cache

    clear_settings_cache()
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    fake_s = type("S", (), {"google_cloud_project": None, "gcp_project": None})()
    monkeypatch.setattr("backend.config.get_settings", lambda: fake_s)
    monkeypatch.setattr(
        "backend.inputs.gcp_auth.resolve_gcp_default_project_id",
        lambda credentials_inline=None: "from-adc",
    )
    assert vertex_gemini.vertex_ai_configured() is True


def test_vertex_ai_configured_reads_project_from_pydantic_settings(monkeypatch):
    from backend.config import clear_settings_cache

    clear_settings_cache()
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    fake_s = type(
        "S",
        (),
        {"google_cloud_project": "from-settings", "gcp_project": None},
    )()
    monkeypatch.setattr("backend.config.get_settings", lambda: fake_s)
    monkeypatch.setattr(
        "backend.inputs.gcp_auth.resolve_gcp_default_project_id",
        lambda credentials_inline=None: None,
    )
    assert vertex_gemini.vertex_ai_configured() is True
    assert vertex_gemini.resolve_gcp_project() == "from-settings"


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


def test_resolve_project_and_location_gemini_3_preview_uses_global(monkeypatch):
    monkeypatch.setenv("GCP_PROJECT", "p-g3")
    monkeypatch.setenv("VERTEX_LOCATION", "us-central1")
    _, loc = vertex_gemini.resolve_project_and_location("gemini-3.1-pro-preview")
    assert loc == "global"
    _, loc2 = vertex_gemini.resolve_project_and_location("gemini-3-pro-preview")
    assert loc2 == "global"
    _, loc_flash_lite = vertex_gemini.resolve_project_and_location(
        "gemini-3.1-flash-lite-preview"
    )
    assert loc_flash_lite == "global"


def test_vertex_openai_compat_base_url_global():
    u = vertex_gemini.vertex_openai_compat_base_url("my-proj", "global")
    assert u == (
        "https://aiplatform.googleapis.com/v1/"
        "projects/my-proj/locations/global/endpoints/openapi"
    )


def test_vertex_generate_content_url_global():
    u = vertex_gemini.vertex_generate_content_url("p2", "global", "gemini-3.1-pro-preview")
    assert u.startswith("https://aiplatform.googleapis.com/v1/projects/p2/locations/global/")
    assert ":generateContent" in u
    assert "gemini-3.1-pro-preview" in u


def test_vertex_openai_model_id_uses_publisher_slash_model_for_openapi():
    assert vertex_gemini.vertex_openai_model_id("gemini-3.1-pro-preview") == "google/gemini-3.1-pro-preview"
    assert vertex_gemini.vertex_openai_model_id("gemini-3-pro-preview") == "google/gemini-3-pro-preview"
    assert (
        vertex_gemini.vertex_openai_model_id("google/gemini-3.1-pro-preview")
        == "google/gemini-3.1-pro-preview"
    )
    assert vertex_gemini.vertex_openai_model_id("gemini-2.5-flash") == "google/gemini-2.5-flash"


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


def test_should_fallback_studio_to_vertex_401(monkeypatch):
    monkeypatch.setattr(vertex_gemini, "vertex_ai_configured", lambda: True)
    r = MagicMock()
    r.status_code = 401
    r.text = ""
    assert vertex_gemini.should_fallback_studio_to_vertex(r) is True


def test_should_fallback_studio_to_vertex_400_api_key_message(monkeypatch):
    monkeypatch.setattr(vertex_gemini, "vertex_ai_configured", lambda: True)
    r = MagicMock()
    r.status_code = 400
    r.text = '{"error": {"message": "API key not valid"}}'
    assert vertex_gemini.should_fallback_studio_to_vertex(r) is True


def test_should_fallback_studio_to_vertex_false_when_vertex_unconfigured(monkeypatch):
    monkeypatch.setattr(vertex_gemini, "vertex_ai_configured", lambda: False)
    r = MagicMock()
    r.status_code = 401
    r.text = ""
    assert vertex_gemini.should_fallback_studio_to_vertex(r) is False


def test_build_vertex_http_403_remediation_hint_includes_project_and_location(monkeypatch):
    from backend.config import clear_settings_cache

    clear_settings_cache()
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "hint-proj")
    monkeypatch.setenv("VERTEX_LOCATION", "us-west1")
    hint = vertex_gemini.build_vertex_http_403_remediation_hint()
    assert "hint-proj" in hint
    assert "us-west1" in hint
    assert "aiplatform.user" in hint


def test_augment_message_for_vertex_consumer_invalid(monkeypatch):
    from backend.config import clear_settings_cache

    clear_settings_cache()
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "syy-cx-shop-np")
    raw = (
        "Error code: 403 - [{'error': {'reason': 'CONSUMER_INVALID', "
        "'metadata': {'consumer': 'projects/syy-cx-shop-np', "
        "'service': 'aiplatform.googleapis.com'}}}]"
    )
    out = vertex_gemini.augment_message_for_vertex_gcp_errors(raw)
    assert "CONSUMER_INVALID" in out
    assert "billing" in out.lower()
    assert "Project ID" in out or "project id" in out.lower()
    assert "syy-cx-shop-np" in out
    assert "Gemini API key" in out


def test_augment_message_for_vertex_403_aiplatform_appends_hint(monkeypatch):
    from backend.config import clear_settings_cache

    clear_settings_cache()
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "p1")
    raw = (
        "failed: 403 PERMISSION_DENIED aiplatform.googleapis.com "
        "Permission denied on resource project p1"
    )
    out = vertex_gemini.augment_message_for_vertex_gcp_errors(raw)
    assert "p1" in out
    assert "aiplatform.user" in out or "Vertex" in out


def test_build_vertex_http_403_remediation_hint_unknown_when_resolution_fails(monkeypatch):
    from backend.config import clear_settings_cache

    clear_settings_cache()
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    fake_s = type("S", (), {"google_cloud_project": None, "gcp_project": None})()
    monkeypatch.setattr("backend.config.get_settings", lambda: fake_s)
    monkeypatch.setattr(
        "backend.inputs.gcp_auth.resolve_gcp_default_project_id",
        lambda credentials_inline=None: None,
    )
    hint = vertex_gemini.build_vertex_http_403_remediation_hint()
    assert "unknown" in hint
