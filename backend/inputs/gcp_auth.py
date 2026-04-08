"""
Application Default Credentials (ADC) helpers for GCP client libraries.

When the workflow field is empty, we resolve a service-account JSON string from
(in order): ``GOOGLE_APPLICATION_CREDENTIALS``, ``GCP_SERVICE_ACCOUNT_JSON_PATH``,
then default filenames under the process working directory and ``~/.config/gcp/``.
Only JSON with ``"type": "service_account"`` is loaded from files; user ADC
files are skipped so ``google.auth.default`` can use them later.

When no service-account JSON is available after that, google-cloud-* uses ADC. If
``GOOGLE_APPLICATION_CREDENTIALS`` points to a file that does not exist, or ADC
is otherwise missing, we can run ``gcloud auth application-default login`` so a
browser opens on the machine running the workflow engine (typical local dev).

Production should use a valid credentials path, workload identity, or inline JSON;
browser auth is gated by environment (see ``_should_attempt_gcp_browser_auth``).
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import threading
from typing import Callable, Iterable, Optional, Tuple, TypeVar

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

# Checked after env vars when the credentials field is empty (relative → cwd).
DEFAULT_GCP_SERVICE_ACCOUNT_RELATIVE_PATHS: Tuple[str, ...] = (
    "credentials.json",
    "gcp-credentials.json",
)

# Optional conventional path (expanduser).
DEFAULT_GCP_SERVICE_ACCOUNT_HOME_PATHS: Tuple[str, ...] = (
    "~/.config/gcp/service-account.json",
)


def _path_key(path: str) -> str:
    return os.path.normpath(os.path.abspath(os.path.expanduser(path)))


def _iter_gcp_service_account_candidate_paths() -> Iterable[str]:
    """Paths to try for a service-account JSON file (after inline was empty)."""
    gac = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if gac:
        yield gac
    app_path = os.environ.get("GCP_SERVICE_ACCOUNT_JSON_PATH", "").strip()
    if app_path:
        yield app_path
    cwd = os.getcwd()
    for rel in DEFAULT_GCP_SERVICE_ACCOUNT_RELATIVE_PATHS:
        yield os.path.join(cwd, rel)
    for rel in DEFAULT_GCP_SERVICE_ACCOUNT_HOME_PATHS:
        yield os.path.expanduser(rel)


def _try_load_service_account_json_from_path(path: str) -> Optional[str]:
    """
    Read a file and return its text if it parses as a service-account key.
    Ignores authorized_user / other JSON so ADC files are not misused here.
    """
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read().strip()
    except OSError as e:
        logger.debug("GCP credentials path not readable: %s (%s)", path, e)
        return None
    if not text:
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict) or data.get("type") != "service_account":
        return None
    return text


def resolve_gcp_service_account_json(raw_inline: Optional[str]) -> Optional[str]:
    """
    Return service-account JSON text for workflow/API use, or None to fall back to ADC.

    Order: non-empty inline → ``GOOGLE_APPLICATION_CREDENTIALS`` →
    ``GCP_SERVICE_ACCOUNT_JSON_PATH`` → default relative/home paths (first match wins).
    """
    if raw_inline is not None and str(raw_inline).strip():
        return str(raw_inline).strip()
    seen: set[str] = set()
    for path in _iter_gcp_service_account_candidate_paths():
        key = _path_key(path)
        if key in seen:
            continue
        seen.add(key)
        if not os.path.isfile(key):
            continue
        loaded = _try_load_service_account_json_from_path(key)
        if loaded:
            return loaded
    return None


def parse_gcp_service_account_credentials(credentials_json: Optional[str]):
    """Parse GCP service-account JSON. Returns credentials or None when absent / empty."""
    if not credentials_json or not str(credentials_json).strip():
        return None
    try:
        from google.oauth2 import service_account

        credentials_info = json.loads(credentials_json)
        return service_account.Credentials.from_service_account_info(credentials_info)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON credentials for GCP")
    except Exception as e:
        raise ValueError("Invalid JSON credentials for GCP") from e


def get_google_credentials_with_scopes_for_http(
    resolved_service_account_json: Optional[str],
    scopes: Tuple[str, ...],
):
    """
    Credentials for ``google.auth.transport.requests.AuthorizedSession`` (e.g. REST).

    Uses parsed service-account JSON when present; otherwise ADC with the same
    browser-login retry behavior as ``gcp_client_with_adc_retry``.
    """
    creds = parse_gcp_service_account_credentials(resolved_service_account_json)
    if creds is not None:
        return creds.with_scopes(scopes)
    prepare_gcp_adc_environment(resolved_service_account_json)
    import google.auth

    try:
        c, _ = google.auth.default(scopes=scopes)
        return c
    except DefaultCredentialsError:
        _maybe_browser_login_after_default_credentials_error(resolved_service_account_json)
        c, _ = google.auth.default(scopes=scopes)
        return c


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
    If using ADC (no non-empty service-account JSON from the node or resolved files)
    and GOOGLE_APPLICATION_CREDENTIALS is set to a path that is not an existing file,
    optionally run gcloud browser login and remove the invalid env var so libraries
    fall back to gcloud's user ADC file.
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
                "GOOGLE_APPLICATION_CREDENTIALS or GCP_SERVICE_ACCOUNT_JSON_PATH to a "
                "service account JSON file, add a key at ./credentials.json or "
                "./gcp-credentials.json, or paste service account JSON on the node."
            ) from e
