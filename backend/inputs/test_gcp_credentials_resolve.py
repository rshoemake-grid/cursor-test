"""Tests for resolve_gcp_service_account_json and related helpers."""
from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from backend.inputs import gcp_auth


def _minimal_sa_dict() -> dict:
    return {
        "type": "service_account",
        "project_id": "p",
        "private_key_id": "kid",
        "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIB\n-----END RSA PRIVATE KEY-----\n",
        "client_email": "x@p.iam.gserviceaccount.com",
        "client_id": "1",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }


def test_resolve_returns_inline_when_non_empty(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    sa_path = tmp_path / "sa.json"
    sa_path.write_text(json.dumps(_minimal_sa_dict()), encoding="utf-8")
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.delenv("GCP_SERVICE_ACCOUNT_JSON_PATH", raising=False)

    inline = json.dumps(_minimal_sa_dict())
    assert gcp_auth.resolve_gcp_service_account_json(inline) == inline
    assert gcp_auth.resolve_gcp_service_account_json("  " + inline + "\n") == inline.strip()


def test_resolve_reads_goog_application_credentials(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    sa_path = tmp_path / "from_env.json"
    body = json.dumps(_minimal_sa_dict())
    sa_path.write_text(body, encoding="utf-8")
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", str(sa_path))
    monkeypatch.delenv("GCP_SERVICE_ACCOUNT_JSON_PATH", raising=False)

    assert gcp_auth.resolve_gcp_service_account_json(None) == body
    assert gcp_auth.resolve_gcp_service_account_json("") == body


def test_resolve_prefers_inline_over_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    sa_path = tmp_path / "from_env.json"
    sa_path.write_text(json.dumps(_minimal_sa_dict()), encoding="utf-8")
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", str(sa_path))

    real_inline = json.dumps(_minimal_sa_dict() | {"project_id": "inline_only"})
    assert gcp_auth.resolve_gcp_service_account_json(real_inline) == real_inline


def test_resolve_gcp_service_account_json_path(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    sa_path = tmp_path / "app_sa.json"
    body = json.dumps(_minimal_sa_dict())
    sa_path.write_text(body, encoding="utf-8")
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.setenv("GCP_SERVICE_ACCOUNT_JSON_PATH", str(sa_path))

    assert gcp_auth.resolve_gcp_service_account_json("") == body


def test_resolve_default_credentials_json_in_cwd(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.delenv("GCP_SERVICE_ACCOUNT_JSON_PATH", raising=False)
    body = json.dumps(_minimal_sa_dict())
    (tmp_path / "credentials.json").write_text(body, encoding="utf-8")
    monkeypatch.chdir(tmp_path)

    assert gcp_auth.resolve_gcp_service_account_json(None) == body


def test_resolve_ignores_non_service_account_json(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.delenv("GCP_SERVICE_ACCOUNT_JSON_PATH", raising=False)
    adc_like = {"type": "authorized_user", "client_id": "x", "refresh_token": "y"}
    (tmp_path / "credentials.json").write_text(json.dumps(adc_like), encoding="utf-8")
    monkeypatch.chdir(tmp_path)

    assert gcp_auth.resolve_gcp_service_account_json(None) is None


def test_parse_service_account_rejects_invalid_json() -> None:
    with pytest.raises(ValueError, match="Invalid JSON"):
        gcp_auth.parse_gcp_service_account_credentials("not json")


@pytest.mark.parametrize("empty", [None, "", "   ", "\n"])
def test_parse_service_account_returns_none_when_empty(empty: str | None) -> None:
    assert gcp_auth.parse_gcp_service_account_credentials(empty) is None


def test_resolve_uses_gcp_credentials_json_when_credentials_json_absent(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.delenv("GCP_SERVICE_ACCOUNT_JSON_PATH", raising=False)
    body = json.dumps(_minimal_sa_dict())
    (tmp_path / "gcp-credentials.json").write_text(body, encoding="utf-8")
    monkeypatch.chdir(tmp_path)

    assert gcp_auth.resolve_gcp_service_account_json(None) == body


def test_resolve_prefers_credentials_json_over_gcp_credentials_json(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.delenv("GCP_SERVICE_ACCOUNT_JSON_PATH", raising=False)
    first = json.dumps(_minimal_sa_dict() | {"project_id": "first"})
    second = json.dumps(_minimal_sa_dict() | {"project_id": "second"})
    (tmp_path / "credentials.json").write_text(first, encoding="utf-8")
    (tmp_path / "gcp-credentials.json").write_text(second, encoding="utf-8")
    monkeypatch.chdir(tmp_path)

    assert gcp_auth.resolve_gcp_service_account_json(None) == first


def test_get_google_credentials_with_scopes_uses_default_when_no_sa(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from unittest.mock import MagicMock

    import google.auth

    mock_creds = MagicMock()
    calls: list[tuple] = []

    def fake_default(scopes=None, **kwargs):
        calls.append(tuple(scopes or ()))
        return (mock_creds, "my-project")

    monkeypatch.setattr(google.auth, "default", fake_default)
    monkeypatch.setattr(gcp_auth, "parse_gcp_service_account_credentials", lambda _j: None)
    monkeypatch.setattr(gcp_auth, "prepare_gcp_adc_environment", lambda _j: None)

    scopes = ("https://www.googleapis.com/auth/cloudplatformprojects.readonly",)
    out = gcp_auth.get_google_credentials_with_scopes_for_http(None, scopes)
    assert out is mock_creds
    assert calls and calls[0] == scopes


@pytest.mark.parametrize("env_name", ["GOOGLE_APPLICATION_CREDENTIALS", "GCP_SERVICE_ACCOUNT_JSON_PATH"])
def test_resolve_missing_file_skips_that_path(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    env_name: str,
) -> None:
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.delenv("GCP_SERVICE_ACCOUNT_JSON_PATH", raising=False)
    missing = tmp_path / "nope.json"
    monkeypatch.setenv(env_name, str(missing))
    monkeypatch.chdir(tmp_path)

    assert gcp_auth.resolve_gcp_service_account_json("") is None
