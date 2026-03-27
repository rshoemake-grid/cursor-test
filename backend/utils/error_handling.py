"""
Error handling utilities and decorators.
Provides reusable error handling patterns following DRY principle.
"""
from functools import wraps
from typing import Any, Callable

from fastapi import HTTPException

from .logger import get_logger

logger = get_logger(__name__)

INVALID_API_KEY_MSG = (
    "Invalid API key. Please go to Settings, add an LLM provider with a valid API key, "
    "enable it, and click 'Sync Now'. Make sure the provider is enabled (checkbox checked) "
    "and has a valid API key."
)


def is_api_key_error(error_msg: str, exc: Exception) -> bool:
    """Check if error indicates invalid/missing API key (DRY).

    Avoid treating every string containing the digits 401 as an auth failure
    (false positives from unrelated errors / IDs).
    """
    lowered = error_msg.lower()
    exc_name = str(type(exc).__name__).lower()
    if "invalid_api_key" in lowered:
        return True
    if "incorrect api key" in lowered:
        return True
    if "authenticationerror" in exc_name or "permissiondenied" in exc_name:
        return True
    if "api_key" in lowered and "invalid" in lowered:
        return True
    # HTTP / SDK patterns
    if "status code 401" in lowered or "error code: 401" in lowered or "http 401" in lowered:
        return True
    if " 401 " in f" {error_msg} " and ("unauthorized" in lowered or "authentication" in lowered):
        return True
    return False


def handle_execution_errors(func: Callable) -> Callable:
    """
    Decorator to handle common execution errors (DRY - reusable error handling).
    
    Catches HTTPException and re-raises, logs other exceptions and converts to HTTPException.
    
    Usage:
        @handle_execution_errors
        async def my_endpoint(...):
            ...
    """
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # Re-raise HTTP exceptions (404, 422, etc.) - they're already properly formatted
            raise
        except Exception as e:
            # Convert workflow ownership errors to HTTP (before generic handler)
            exc_name = type(e).__name__
            if exc_name == "WorkflowNotFoundError":
                raise HTTPException(status_code=404, detail=str(e))
            if exc_name == "WorkflowForbiddenError":
                raise HTTPException(status_code=403, detail=str(e))
            if exc_name == "ExecutionNotFoundError":
                raise HTTPException(status_code=404, detail=str(e))
            if exc_name == "ExecutionForbiddenError":
                raise HTTPException(status_code=403, detail=str(e))
            # Log unexpected errors and convert to HTTPException
            logger.error(f"Unexpected error in {func.__name__}: {e}", exc_info=True)
            # P2-7: In production, use generic message to avoid leaking internals
            from ..config import get_settings
            detail = "Internal server error" if get_settings().environment == "production" else f"Internal server error: {str(e)}"
            raise HTTPException(status_code=500, detail=detail)
    
    return wrapper
