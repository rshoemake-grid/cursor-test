"""
LLM Test Service - DRY shared logic for testing LLM provider connections.
Uses shared HTTP helper for all providers (DRY).
"""
from typing import Dict, Any, Optional
import httpx

from ..utils.logger import get_logger

logger = get_logger(__name__)

_DEFAULT_STATUS_MESSAGES: Dict[int, str] = {
    400: "API error",
    401: "Invalid API key (401 Unauthorized)",
    404: "Not found (404)",
    429: "Rate limit exceeded (429)",
}


async def _do_http_post(
    url: str,
    headers: Dict[str, str],
    body: Dict[str, Any],
    url_display: Optional[str] = None,
    status_overrides: Optional[Dict[int, str]] = None,
) -> Dict[str, str]:
    """
    Shared HTTP POST helper for provider tests (DRY).
    Handles connect, timeout, and response status. status_overrides can customize error messages.
    """
    display = url_display or url
    overrides = status_overrides or {}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=body)
            if response.status_code == 200:
                return {"status": "success", "message": "Connected successfully"}
            msg = overrides.get(response.status_code)
            if msg is None:
                if response.status_code == 400:
                    try:
                        error_data = response.json() if response.text else {}
                        error_msg = error_data.get("error", {}).get("message", response.text[:200])
                        msg = f"API error: {error_msg}"
                    except Exception:
                        msg = "API error"
                else:
                    msg = _DEFAULT_STATUS_MESSAGES.get(
                        response.status_code,
                        f"API returned status {response.status_code}: {response.text[:200]}",
                    )
            return {"status": "error", "message": msg}
    except httpx.ConnectError as e:
        return {"status": "error", "message": f"Cannot connect to {display}: {str(e)}"}
    except httpx.TimeoutException:
        return {"status": "error", "message": "Connection timed out after 30 seconds"}
    except Exception as e:
        return {"status": "error", "message": f"Error: {str(e)}"}


async def test_openai(base_url: str, api_key: str, model: str) -> Dict[str, str]:
    """Test OpenAI API connection."""
    url = (base_url or "https://api.openai.com/v1") + "/chat/completions"
    return await _test_openai_compatible(url, api_key, model)


async def test_anthropic(base_url: str, api_key: str, model: str) -> Dict[str, str]:
    """Test Anthropic API connection."""
    url = (base_url or "https://api.anthropic.com/v1") + "/messages"
    return await _do_http_post(
        url,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        body={
            "model": model,
            "messages": [{"role": "user", "content": "Hello"}],
            "max_tokens": 5,
        },
    )


async def test_gemini(base_url: str, api_key: str, model: str) -> Dict[str, str]:
    """Test Google Gemini API connection (AI Studio key) or Vertex :generateContent with ADC when key is empty."""
    body = {
        "contents": [{"parts": [{"text": "Hello"}]}],
        "generationConfig": {"maxOutputTokens": 5},
    }
    if (api_key or "").strip():
        url = (base_url or "https://generativelanguage.googleapis.com/v1beta") + f"/models/{model}:generateContent?key={api_key}"
        return await _do_http_post(
            url,
            headers={"Content-Type": "application/json"},
            body=body,
            url_display=base_url or "Gemini API",
        )
    try:
        from ..utils.vertex_gemini import post_vertex_generate_content, vertex_ai_configured
    except Exception as e:
        return {"status": "error", "message": f"Vertex AI not available: {e}"}
    if not vertex_ai_configured():
        return {
            "status": "error",
            "message": "No Gemini API key and Vertex AI is not configured (set GOOGLE_CLOUD_PROJECT or GCP_PROJECT).",
        }
    try:
        resp = await post_vertex_generate_content(model, body, timeout=30.0)
    except Exception as e:
        return {"status": "error", "message": f"Vertex AI (ADC) error: {e}"}
    if resp.status_code == 200:
        return {"status": "success", "message": "Connected successfully (Vertex AI with ADC)"}
    return {
        "status": "error",
        "message": f"Vertex AI returned status {resp.status_code}: {(resp.text or '')[:200]}",
    }


async def test_custom(base_url: str, api_key: str, model: str) -> Dict[str, str]:
    """Test custom OpenAI-compatible API connection."""
    if not base_url:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="base_url is required for custom providers")
    url = base_url.rstrip("/") + "/chat/completions"
    return await _test_openai_compatible(url, api_key, model)


async def _test_openai_compatible(url: str, api_key: str, model: str) -> Dict[str, str]:
    """Shared logic for OpenAI and custom (OpenAI-compatible) providers."""
    result = await _do_http_post(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        body={
            "model": model,
            "messages": [{"role": "user", "content": "Hello"}],
            "max_tokens": 5,
        },
        status_overrides={404: f"Model '{model}' not found (404)"},
    )
    if result["status"] == "success":
        result["message"] = "Connected successfully! ✓"
    return result
