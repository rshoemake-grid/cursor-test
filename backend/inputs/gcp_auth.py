"""
Application Default Credentials (ADC) helpers for GCP client libraries.

When no inline service-account JSON is provided, google-cloud-* uses ADC. If
``GOOGLE_APPLICATION_CREDENTIALS`` points to a file that does not exist, or ADC
is otherwise missing, we can run ``gcloud auth application-default login`` so a
browser opens on the machine running the workflow engine (typical local dev).

Production should use a valid credentials path, workload identity, or inline JSON;
browser auth is gated by environment (see ``_should_attempt_gcp_browser_auth``).
"""
from __future__ import annotations

import os
import shutil
import subprocess
import threading
from typing import Callable, Optional, TypeVar

from ..utils.logger import get_logger

logger = get_logger(__name__)

_gcp_adc_prep_lock = threading.Lock()

try:
    from google.auth.exceptions import DefaultCredentialsError
except ImportError:  # pragma: no cover

    class DefaultCredentialsError(Exception):
        """Fallback if google-auth is not installed."""

        pass


T = TypeVar("T")


def _should_attempt_gcp_browser_auth() -> bool:
    """
    Opt-in / dev default for running gcloud browser login.

    - GCP_BROWSER_AUTH_ON_MISSING_ADC=true|1|yes|on: always allow (use carefully in CI).
    - GCP_BROWSER_AUTH_ON_MISSING_ADC=false|0|no|off: never auto-run gcloud from the API.
    - Unset: allow only when ENVIRONMENT=development (from backend settings).
    """
    raw = os.environ.get("GCP_BROWSER_AUTH_ON_MISSING_ADC", "")
    if raw is None:
        raw = ""
    v = str(raw).strip().lower()
    if v in ("1", "true", "yes", "on"):
        return True
    if v in ("0", "false", "no", "off"):
        return False
    try:
        from backend.config import get_settings

        return get_settings().environment.strip().lower() == "development"
    except Exception:
        return False


def _run_gcloud_application_default_login() -> None:
    gcloud = shutil.which("gcloud")
    if not gcloud:
        raise ValueError(
            "`gcloud` CLI not found on PATH. Install Google Cloud SDK, or provide "
            "service account JSON in the node config / fix GOOGLE_APPLICATION_CREDENTIALS."
        )
    logger.info(
        "Running `gcloud auth application-default login` — complete sign-in in the browser."
    )
    subprocess.run(
        [gcloud, "auth", "application-default", "login"],
        check=True,
    )


def prepare_gcp_adc_environment(inline_credentials_json: Optional[str]) -> None:
    """
    If using ADC (no non-empty inline JSON) and GOOGLE_APPLICATION_CREDENTIALS is set
    to a path that is not an existing file, optionally run gcloud browser login and
    remove the invalid env var so libraries fall back to gcloud's user ADC file.
    """
    if inline_credentials_json and str(inline_credentials_json).strip():
        return
    adc = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not adc or os.path.isfile(adc):
        return
    with _gcp_adc_prep_lock:
        adc2 = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if not adc2 or os.path.isfile(adc2):
            return
        if not _should_attempt_gcp_browser_auth():
            raise ValueError(
                f"GOOGLE_APPLICATION_CREDENTIALS file not found: {adc2!r}. "
                "Unset the variable, point it to a valid service account JSON file, "
                "paste credentials on the GCP node, or set GCP_BROWSER_AUTH_ON_MISSING_ADC=true "
                "(or run with ENVIRONMENT=development) and install `gcloud` to open a browser login."
            )
        _run_gcloud_application_default_login()
        os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
        logger.info(
            "Removed invalid GOOGLE_APPLICATION_CREDENTIALS; using gcloud user ADC."
        )


def _maybe_browser_login_after_default_credentials_error(
    inline_credentials_json: Optional[str],
) -> None:
    """Run gcloud login once when Client() raised DefaultCredentialsError and no inline SA."""
    if inline_credentials_json and str(inline_credentials_json).strip():
        return
    if not _should_attempt_gcp_browser_auth():
        return
    with _gcp_adc_prep_lock:
        _run_gcloud_application_default_login()


def gcp_client_with_adc_retry(
    inline_credentials_json: Optional[str],
    factory: Callable[[], T],
) -> T:
    """
    Build a google-cloud client with optional gcloud browser login if ADC fails.

    ``factory`` must be a zero-arg callable, e.g. ``lambda: storage.Client()``.
    """
    prepare_gcp_adc_environment(inline_credentials_json)
    try:
        return factory()
    except DefaultCredentialsError:
        _maybe_browser_login_after_default_credentials_error(inline_credentials_json)
        try:
            return factory()
        except DefaultCredentialsError as e:
            raise ValueError(
                "GCP Application Default Credentials are not configured. "
                "Run `gcloud auth application-default login`, set "
                "GOOGLE_APPLICATION_CREDENTIALS to a service account JSON path, "
                "or paste service account JSON on the node."
            ) from e
