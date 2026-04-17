"""
Vertex AI Gemini helpers: OpenAI-compatible base URL, :generateContent URL, model IDs, ADC.

Uses Application Default Credentials (e.g. `gcloud auth application-default login` or
GCE/GKE service account). Project: ``GOOGLE_CLOUD_PROJECT`` / ``GCP_PROJECT``, or the
project returned by ``google.auth.default()`` when env is unset.
"""
from __future__ import annotations

import asyncio
import os
import re
from typing import Any, Dict, Optional, Tuple

import httpx

CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform"


def vertex_ai_configured() -> bool:
    return bool(resolve_gcp_project())


def resolve_gcp_project() -> Optional[str]:
    """
    Project for Vertex: process env, then Pydantic Settings from .env, then ADC.
    """
    env_project = (
        (os.getenv("GOOGLE_CLOUD_PROJECT") or "").strip()
        or (os.getenv("GCP_PROJECT") or "").strip()
        or None
    )
    if env_project:
        return env_project
    try:
        from ..config import get_settings

        s = get_settings()
        from_settings = (
            (s.google_cloud_project or "").strip()
            or (s.gcp_project or "").strip()
            or None
        )
        if from_settings:
            return from_settings
    except Exception:
        pass
    try:
        from ..inputs.gcp_auth import resolve_gcp_default_project_id

        adc_project = resolve_gcp_default_project_id(credentials_inline=None)
        if adc_project and str(adc_project).strip():
            return str(adc_project).strip()
    except Exception:
        pass
    return None


def resolve_vertex_location() -> str:
    loc = (
        (os.getenv("VERTEX_LOCATION") or "").strip()
        or (os.getenv("GOOGLE_CLOUD_REGION") or "").strip()
    )
    if loc:
        return loc
    try:
        from ..config import get_settings

        s = get_settings()
        from_settings = (s.vertex_location or "").strip()
        if from_settings:
            return from_settings
    except Exception:
        pass
    return "us-central1"


def _vertex_model_requires_global_location(model: str) -> bool:
    """
    Gemini 3.x preview models are only served on the Vertex *global* endpoint, not regional
    (e.g. us-central1). See: Generative AI docs — Get started with Gemini 3.

    Includes ids like ``gemini-3-pro-preview`` (no minor version) and ``gemini-3.1-pro-preview``.
    """
    m = (model or "").strip().lower()
    if m.startswith("google/"):
        m = m[len("google/") :]
    if m.startswith("gemini-3") and "preview" in m:
        return True
    return False


def resolve_vertex_location_for_model(model: Optional[str]) -> str:
    """Regional location from env/settings, or ``global`` when the model requires it."""
    if model and _vertex_model_requires_global_location(model):
        return "global"
    return resolve_vertex_location()


def resolve_project_and_location(model: Optional[str] = None) -> Tuple[str, str]:
    project = resolve_gcp_project()
    if not project:
        raise RuntimeError(
            "Vertex AI needs a GCP project: set GOOGLE_CLOUD_PROJECT or GCP_PROJECT, "
            "or use credentials where google.auth.default() returns a project "
            "(e.g. gcloud auth application-default login)."
        )
    return project, resolve_vertex_location_for_model(model)


def build_vertex_http_403_remediation_hint() -> str:
    """
    User-facing suffix when Vertex returns HTTP 403 (IAM, API not enabled, or wrong project).
    """
    try:
        project = resolve_gcp_project() or "unknown"
        location = resolve_vertex_location()
    except Exception:
        project, location = "unknown", "unknown"
    return (
        f" [Vertex: project={project!r}, location={location!r}. "
        "403 on the project resource usually means the Vertex AI API is not enabled, "
        "GOOGLE_CLOUD_PROJECT/GCP_PROJECT does not match a project your ADC identity can use, "
        "or the principal needs IAM role roles/aiplatform.user on that project. "
        "Update .env if needed, then restart the backend.]"
    )


def _extract_gcp_project_id_from_error_blob(message: str) -> Optional[str]:
    """Best-effort project id from Google error JSON / text (consumer, resource, etc.)."""
    if not message:
        return None
    patterns = (
        r"'consumer':\s*'projects/([^']+)'",
        r'"consumer":\s*"projects/([^"]+)"',
        r"resource project ([a-z][a-z0-9\-]*)",
        r"projects/([a-z][a-z0-9\-]{4,})",
    )
    for pat in patterns:
        m = re.search(pat, message, re.I)
        if m:
            return m.group(1)
    return None


def augment_message_for_vertex_gcp_errors(message: str) -> str:
    """
    Append actionable hints when exceptions contain Google RPC errors for Vertex (aiplatform).

    CONSUMER_INVALID: Google rejects the project as API/billing consumer for aiplatform.googleapis.com.
    The Vertex AI *toggle* can look fine while this still fails (billing, wrong id, wrong account).
    """
    if not message:
        return message
    if "CONSUMER_INVALID" in message:
        proj = _extract_gcp_project_id_from_error_blob(message)
        try:
            app_proj = resolve_gcp_project()
        except Exception:
            app_proj = None
        app_bit = (
            f" This app is using Vertex project {app_proj!r} (from env/settings/ADC)."
            if app_proj
            else ""
        )
        proj_human = f"`{proj}`" if proj else "the project named in the error"
        return (
            f"{message} "
            f"[Vertex CONSUMER_INVALID: {proj_human} is not accepted as the consumer for aiplatform.googleapis.com. "
            "This often happens **even with Vertex AI enabled**: (1) **No billing account** linked to that project "
            "(link under Billing; Vertex bills through GCP). (2) **Project ID typo**: env must be the **Project ID** "
            "(IAM & Admin → Settings), not the display *name*. (3) **ADC / gcloud login** is a different Google account "
            "than the one that owns the project. Check: `gcloud projects describe PROJECT_ID` and "
            "`gcloud billing projects describe PROJECT_ID`."
            f"{app_bit} "
            "Or add a **Gemini API key** (Google AI Studio) in Settings to use the Developer API instead of Vertex.]"
        )
    if (
        "403" in message
        and "PERMISSION_DENIED" in message
        and "aiplatform.googleapis.com" in message
    ):
        return message + build_vertex_http_403_remediation_hint()
    return message


def vertex_openai_compat_base_url(project_id: str, location: str) -> str:
    location = location.strip()
    project_id = project_id.strip()
    if location == "global":
        return (
            "https://aiplatform.googleapis.com/v1/"
            f"projects/{project_id}/locations/global/endpoints/openapi"
        )
    return (
        f"https://{location}-aiplatform.googleapis.com/v1/"
        f"projects/{project_id}/locations/{location}/endpoints/openapi"
    )


def vertex_generate_content_url(project_id: str, location: str, model: str) -> str:
    mid = vertex_generate_content_model_id(model)
    project_id = project_id.strip()
    location = location.strip()
    if location == "global":
        host = "https://aiplatform.googleapis.com"
    else:
        host = f"https://{location}-aiplatform.googleapis.com"
    return (
        f"{host}/v1/"
        f"projects/{project_id}/locations/{location}/publishers/google/models/"
        f"{mid}:generateContent"
    )


def vertex_openai_model_id(model: str) -> str:
    """
    Vertex OpenAI-compatible ``chat.completions`` expects ``publisher/model``, e.g.
    ``google/gemini-2.5-flash`` or ``google/gemini-3-pro-preview`` (not a bare model id).
    """
    m = (model or "").strip()
    if not m:
        return "google/gemini-2.5-flash"
    if m.startswith("google/"):
        return m
    return f"google/{m}"


def vertex_generate_content_model_id(model: str) -> str:
    """Raw :generateContent resource id (no google/ prefix in path)."""
    m = (model or "").strip()
    if m.startswith("google/"):
        return m[len("google/") :]
    return m


def _refresh_access_token() -> str:
    import google.auth.transport.requests
    import google.auth

    credentials, _ = google.auth.default(scopes=[CLOUD_PLATFORM_SCOPE])
    credentials.refresh(google.auth.transport.requests.Request())
    token = credentials.token
    if not token:
        raise RuntimeError("Application Default Credentials returned no access token.")
    return token


class _GoogleCloudPlatformAuth(httpx.Auth):
    requires_request_body = False
    requires_response_body = False

    async def async_auth_flow(self, request: httpx.Request):
        token = await asyncio.to_thread(_refresh_access_token)
        request.headers["Authorization"] = f"Bearer {token}"
        yield request


def create_vertex_async_openai_client(project_id: str, location: str) -> Any:
    """AsyncOpenAI client targeting Vertex OpenAI-compatible chat/completions."""
    from openai import AsyncOpenAI

    base = vertex_openai_compat_base_url(project_id, location)
    http_client = httpx.AsyncClient(auth=_GoogleCloudPlatformAuth(), timeout=600.0)
    return AsyncOpenAI(
        api_key="vertex-adc",
        base_url=base,
        http_client=http_client,
    )


async def post_vertex_generate_content(
    model: str,
    json_body: Dict[str, Any],
    timeout: float = 300.0,
) -> httpx.Response:
    """POST :generateContent on Vertex using ADC (for agent / httpx flows)."""
    project_id, location = resolve_project_and_location(model)
    url = vertex_generate_content_url(project_id, location, model)
    token = await asyncio.to_thread(_refresh_access_token)
    async with httpx.AsyncClient(timeout=timeout) as client:
        return await client.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=json_body,
        )


def should_fallback_studio_to_vertex(response: httpx.Response) -> bool:
    """
    After a Gemini Developer API (AI Studio / ``generativelanguage.googleapis.com``) call fails,
    retry on Vertex with ADC when appropriate.

    Invalid or revoked keys often return HTTP 400 (not only 401/403). Chat's LLMClientFactory
    drops placeholder keys up front; this handles syntactically valid keys that still fail at runtime.
    """
    if not vertex_ai_configured():
        return False
    code = response.status_code
    if code in (401, 403):
        return True
    if code == 400:
        text = (response.text or "").lower()
        if "api key" in text or "api_key" in text or "apikey" in text:
            return True
        if "invalid" in text and ("key" in text or "credential" in text or "argument" in text):
            return True
    return False

