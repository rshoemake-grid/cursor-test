"""Tests for GCP ADC / optional browser auth via gcloud."""
import os
from unittest import mock

import pytest

from backend.config import clear_settings_cache
from backend.inputs import gcp_auth


def test_prepare_adc_raises_when_missing_file_and_browser_auth_disabled(
    monkeypatch, tmp_path
):
    monkeypatch.delenv("GCP_BROWSER_AUTH_ON_MISSING_ADC", raising=False)
    monkeypatch.setenv("ENVIRONMENT", "production")
    clear_settings_cache()
    bad = str(tmp_path / "nope.json")
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", bad)

    with pytest.raises(ValueError, match="GOOGLE_APPLICATION_CREDENTIALS file not found"):
        gcp_auth.prepare_gcp_adc_environment(None)


def test_prepare_adc_clears_bad_env_after_gcloud_when_enabled(monkeypatch, tmp_path):
    monkeypatch.setenv("GCP_BROWSER_AUTH_ON_MISSING_ADC", "true")
    bad = str(tmp_path / "missing.json")
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", bad)

    with mock.patch.object(gcp_auth, "_run_gcloud_application_default_login"):
        gcp_auth.prepare_gcp_adc_environment(None)

    assert "GOOGLE_APPLICATION_CREDENTIALS" not in os.environ


def test_gcp_client_retry_triggers_gcloud_on_default_credentials_error(monkeypatch):
    monkeypatch.setenv("GCP_BROWSER_AUTH_ON_MISSING_ADC", "true")
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)

    calls = {"n": 0}

    def factory():
        calls["n"] += 1
        if calls["n"] == 1:
            raise gcp_auth.DefaultCredentialsError("no adc")
        return "ok-client"

    with mock.patch.object(gcp_auth, "_run_gcloud_application_default_login"):
        out = gcp_auth.gcp_client_with_adc_retry(None, factory)

    assert out == "ok-client"
    assert calls["n"] == 2


def test_gcp_client_retry_does_not_swallow_second_default_error(monkeypatch):
    monkeypatch.setenv("GCP_BROWSER_AUTH_ON_MISSING_ADC", "true")

    def factory():
        raise gcp_auth.DefaultCredentialsError("still no adc")

    with mock.patch.object(gcp_auth, "_run_gcloud_application_default_login"):
        with pytest.raises(ValueError, match="Application Default Credentials"):
            gcp_auth.gcp_client_with_adc_retry(None, factory)
