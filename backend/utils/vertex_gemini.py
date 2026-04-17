"""
Vertex AI Gemini helpers: OpenAI-compatible base URL, :generateContent URL, model IDs, ADC.

Uses Application Default Credentials (e.g. `gcloud auth application-default login` or
GCE/GKE service account). Requires GOOGLE_CLOUD_PROJECT or GCP_PROJECT.
"""
from __future__ import annotations

import asyncio
import os
from typing import Any, Dict, Optional, Tuple

import httpx

CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform"


def vertex_ai_configured() -> bool:
    return bool(resolve_gcp_project())


def resolve_gcp_project() -> Optional[str]:
    return (
        (os.getenv("GOOGLE_CLOUD_PROJECT") or "").strip()
        or (os.getenv("GCP_PROJECT") or "").strip()
        or None
    )


def resolve_vertex_location() -> str:
    loc = (
        (os.getenv("VERTEX_LOCATION") or "").strip()
        or (os.getenv("GOOGLE_CLOUD_REGION") or "").strip()
        or "us-central1"
    )
    return loc


def resolve_project_and_location() -> Tuple[str, str]:
    project = resolve_gcp_project()
    if not project:
        raise RuntimeError(
            "Vertex AI requires GOOGLE_CLOUD_PROJECT or GCP_PROJECT when no Gemini API key is used."
        )
    return project, resolve_vertex_location()


def vertex_openai_compat_base_url(project_id: str, location: str) -> str:
    location = location.strip()
    project_id = project_id.strip()
    return (
        f"https://{location}-aiplatform.googleapis.com/v1/"
        f"projects/{project_id}/locations/{location}/endpoints/openapi"
    )


def vertex_generate_content_url(project_id: str, location: str, model: str) -> str:
    mid = vertex_generate_content_model_id(model)
    project_id = project_id.strip()
    location = location.strip()
    return (
        f"https://{location}-aiplatform.googleapis.com/v1/"
        f"projects/{project_id}/locations/{location}/publishers/google/models/"
        f"{mid}:generateContent"
    )


def vertex_openai_model_id(model: str) -> str:
    """OpenAI-compat Vertex expects ids like google/gemini-2.5-flash-001."""
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
    project_id, location = resolve_project_and_location()
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


def is_gemini_auth_failure_status(status_code: int) -> bool:
    return status_code in (401, 403)

