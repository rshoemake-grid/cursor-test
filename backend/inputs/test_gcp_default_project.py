"""Tests for resolve_gcp_default_project_id."""
import json
from unittest.mock import patch

import pytest

from backend.inputs import gcp_auth


def test_default_project_from_service_account_json_inline():
    text = json.dumps(
        {"type": "service_account", "project_id": "inline-proj-123"},
    )
    assert gcp_auth.resolve_gcp_default_project_id(credentials_inline=text) == "inline-proj-123"


def test_default_project_prefers_env_when_no_sa_project(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "env-proj")
    with patch.object(gcp_auth, "resolve_gcp_service_account_json", return_value=None):
        assert gcp_auth.resolve_gcp_default_project_id(credentials_inline=None) == "env-proj"


def test_default_project_from_google_auth_default(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCLOUD_PROJECT", raising=False)
    monkeypatch.delenv("GCP_PROJECT", raising=False)
    with patch.object(gcp_auth, "resolve_gcp_service_account_json", return_value=None):
        with patch("google.auth.default", return_value=(None, "adc-proj")):
            assert gcp_auth.resolve_gcp_default_project_id(credentials_inline=None) == "adc-proj"


def test_default_project_returns_none_when_unresolvable(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    with patch.object(gcp_auth, "resolve_gcp_service_account_json", return_value=None):
        with patch("google.auth.default", side_effect=RuntimeError("no creds")):
            assert gcp_auth.resolve_gcp_default_project_id(credentials_inline=None) is None
