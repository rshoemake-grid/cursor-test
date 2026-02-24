"""
Error handling utilities and decorators.
Provides reusable error handling patterns following DRY principle.
"""
from functools import wraps
from typing import Callable, Any
from fastapi import HTTPException
from ..utils.logger import get_logger

logger = get_logger(__name__)


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
            # Log unexpected errors and convert to HTTPException
            logger.error(f"Unexpected error in {func.__name__}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    return wrapper
