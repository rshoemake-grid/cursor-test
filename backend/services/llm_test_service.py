"""
LLM Test Service - DRY shared logic for testing LLM provider connections.
Uses shared HTTP helper for Anthropic/Gemini (DRY).
"""
from typing import Dict, Any, Optional
import httpx

from ..utils.logger import get_logger

logger = get_logger(__name__)


async def _test_http_post(
    url: str,
    headers: Dict[str, str],
    body: Dict[str, Any],
    url_display: Optional[str] = None,
) -> Dict[str, str]:
    """
    Shared HTTP POST helper for provider tests (DRY).
    Handles connect, timeout, and response status.
    """
    display = url_display or url
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=body)
            if response.status_code == 200:
                return {"status": "success", "message": "Connected successfully"}
            if response.status_code == 400:
                error_data = response.json() if response.text else {}
                error_msg = error_data.get("error", {}).get("message", response.text[:200])
                return {"status": "error", "message": f"API error: {error_msg}"}
            if response.status_code == 401:
                return {"status": "error", "message": "Invalid API key (401 Unauthorized)"}
            if response.status_code == 429:
                return {"status": "error", "message": "Rate limit exceeded (429)"}
            return {
                "status": "error",
                "message": f"API returned status {response.status_code}: {response.text[:200]}",
            }
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
    return await _test_http_post(
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
    """Test Google Gemini API connection."""
    url = (base_url or "https://generativelanguage.googleapis.com/v1beta") + f"/models/{model}:generateContent?key={api_key}"
    return await _test_http_post(
        url,
        headers={"Content-Type": "application/json"},
        body={
            "contents": [{"parts": [{"text": "Hello"}]}],
            "generationConfig": {"maxOutputTokens": 5},
        },
        url_display=base_url or "Gemini API",
    )


async def test_custom(base_url: str, api_key: str, model: str) -> Dict[str, str]:
    """Test custom OpenAI-compatible API connection."""
    if not base_url:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="base_url is required for custom providers")
    url = base_url.rstrip("/") + "/chat/completions"
    return await _test_openai_compatible(url, api_key, model)


async def _test_openai_compatible(url: str, api_key: str, model: str) -> Dict[str, str]:
    """Shared logic for OpenAI and custom (OpenAI-compatible) providers."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 5,
                },
            )
            if response.status_code == 200:
                return {"status": "success", "message": "Connected successfully! ✓"}
            if response.status_code == 401:
                return {"status": "error", "message": "Invalid API key (401 Unauthorized)"}
            if response.status_code == 429:
                return {"status": "error", "message": "Rate limit exceeded (429)"}
            if response.status_code == 404:
                return {"status": "error", "message": f"Model '{model}' not found (404)"}
            error_text = response.text[:200]
            return {"status": "error", "message": f"API error {response.status_code}: {error_text}"}
    except httpx.ConnectError as e:
        return {"status": "error", "message": f"Cannot connect to {url}: {str(e)}"}
    except httpx.TimeoutException:
        return {"status": "error", "message": "Connection timed out after 30 seconds"}
    except Exception as e:
        return {"status": "error", "message": f"Error: {str(e)}"}
