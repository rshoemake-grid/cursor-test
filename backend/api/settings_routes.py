"""
Settings API Routes - LLM Provider Configuration
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from ..database import get_db
from ..database.models import UserDB, SettingsDB
from ..auth.auth import get_optional_user
from ..utils.logger import get_logger
import json
import httpx

logger = get_logger(__name__)

router = APIRouter(prefix="/api/settings", tags=["settings"])


class LLMProvider(BaseModel):
    id: str
    name: str
    type: str  # 'openai', 'anthropic', 'gemini', 'custom'
    apiKey: str
    baseUrl: Optional[str] = None
    defaultModel: str
    models: List[str]
    enabled: bool


class LLMSettings(BaseModel):
    providers: List[LLMProvider]
    iteration_limit: int = 10
    default_model: Optional[str] = None  # Selected model for workflow generation


class LLMTestRequest(BaseModel):
    type: str
    api_key: str
    base_url: Optional[str] = None
    model: str


# Import shared cache (DIP compliance - no direct cache definition)
from ..utils.settings_cache import get_settings_cache

# Get reference to shared cache
_settings_cache = get_settings_cache()


# load_settings_into_cache moved to SettingsService.load_settings_into_cache()
# This function is deprecated - use SettingsService instead


@router.post("/llm")
async def save_llm_settings(
    settings: LLMSettings,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Save LLM provider settings to database
    
    Settings are user-specific and can only be saved by the authenticated user.
    Unauthenticated users save to "anonymous" settings.
    """
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to save settings"
        )
    
    user_id = current_user.id
    
    # Save to database
    result = await db.execute(
        select(SettingsDB).where(SettingsDB.user_id == user_id)
    )
    settings_db = result.scalar_one_or_none()
    
    if settings_db:
        # Update existing settings
        settings_db.settings_data = settings.model_dump(mode='json')
        settings_db.updated_at = datetime.utcnow()
    else:
        # Create new settings record
        settings_db = SettingsDB(
            user_id=user_id,
            settings_data=settings.model_dump(mode='json')
        )
        db.add(settings_db)
    
    await db.commit()
    
    # Update cache
    _settings_cache[user_id] = settings
    
    # Log settings save
    logger.info(f"Saving LLM settings for user: {user_id}, providers count: {len(settings.providers)}, iteration_limit: {settings.iteration_limit}, default_model: {settings.default_model}")
    for p in settings.providers:
        logger.debug(f"Provider {p.name}: enabled={p.enabled}, has_key={len(p.apiKey) > 0}")
    
    return {"status": "success", "message": "Settings saved successfully"}


@router.get("/llm", response_model=LLMSettings)
async def get_llm_settings(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Get LLM provider settings from database
    
    Users can only view their own settings. Unauthenticated users cannot view settings.
    """
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to view settings"
        )
    
    user_id = current_user.id
    
    # Check cache first
    if user_id in _settings_cache:
        return _settings_cache[user_id]
    
    # Load from database
    result = await db.execute(
        select(SettingsDB).where(SettingsDB.user_id == user_id)
    )
    settings_db = result.scalar_one_or_none()
    
    if settings_db and settings_db.settings_data:
        settings = LLMSettings(**settings_db.settings_data)
        # Update cache
        _settings_cache[user_id] = settings
        return settings
    
    # Return empty settings if not found
    return LLMSettings(providers=[])


@router.post("/llm/test")
async def test_llm_connection(test_request: LLMTestRequest):
    """Test LLM provider connection"""
    try:
        if test_request.type == "openai":
            return await _test_openai(test_request)
        elif test_request.type == "anthropic":
            return await _test_anthropic(test_request)
        elif test_request.type == "gemini":
            return await _test_gemini(test_request)
        elif test_request.type == "custom":
            return await _test_custom(test_request)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown provider type: {test_request.type}")
    except httpx.HTTPStatusError as e:
        return {"status": "error", "message": f"HTTP {e.response.status_code}: {e.response.text}"}
    except httpx.ConnectError as e:
        return {"status": "error", "message": f"Connection failed: {str(e)}"}
    except httpx.TimeoutException as e:
        return {"status": "error", "message": "Request timed out"}
    except Exception as e:
        return {"status": "error", "message": f"Unexpected error: {str(e)}"}


async def _test_openai(test_request: LLMTestRequest):
    """Test OpenAI API connection"""
    base_url = test_request.base_url or "https://api.openai.com/v1"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {test_request.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": test_request.model,
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 5
                }
            )
            
            if response.status_code == 200:
                return {"status": "success", "message": "Connected successfully! ✓"}
            elif response.status_code == 401:
                return {"status": "error", "message": "Invalid API key (401 Unauthorized)"}
            elif response.status_code == 429:
                return {"status": "error", "message": "Rate limit exceeded (429)"}
            elif response.status_code == 404:
                return {"status": "error", "message": f"Model '{test_request.model}' not found (404)"}
            else:
                error_text = response.text[:200]  # Limit error text
                return {"status": "error", "message": f"API error {response.status_code}: {error_text}"}
    except httpx.ConnectError as e:
        return {"status": "error", "message": f"Cannot connect to {base_url}: {str(e)}"} 
    except httpx.TimeoutException:
        return {"status": "error", "message": "Connection timed out after 30 seconds"}
    except Exception as e:
        return {"status": "error", "message": f"Error: {str(e)}"}


async def _test_anthropic(test_request: LLMTestRequest):
    """Test Anthropic API connection"""
    base_url = test_request.base_url or "https://api.anthropic.com/v1"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{base_url}/messages",
            headers={
                "x-api-key": test_request.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            json={
                "model": test_request.model,
                "messages": [{"role": "user", "content": "Hello"}],
                "max_tokens": 5
            }
        )
        
        if response.status_code == 200:
            return {"status": "success", "message": "Connected successfully"}
        else:
            return {"status": "error", "message": f"API returned status {response.status_code}: {response.text}"}


async def _test_gemini(test_request: LLMTestRequest):
    """Test Google Gemini API connection"""
    base_url = test_request.base_url or "https://generativelanguage.googleapis.com/v1beta"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/models/{test_request.model}:generateContent?key={test_request.api_key}",
                headers={
                    "Content-Type": "application/json"
                },
                json={
                    "contents": [{
                        "parts": [{"text": "Hello"}]
                    }],
                    "generationConfig": {
                        "maxOutputTokens": 5
                    }
                }
            )
            
            if response.status_code == 200:
                return {"status": "success", "message": "Connected successfully! ✓"}
            elif response.status_code == 400:
                error_data = response.json() if response.text else {}
                error_msg = error_data.get("error", {}).get("message", response.text[:200])
                return {"status": "error", "message": f"API error: {error_msg}"}
            elif response.status_code == 401:
                return {"status": "error", "message": "Invalid API key (401 Unauthorized)"}
            elif response.status_code == 429:
                return {"status": "error", "message": "Rate limit exceeded (429)"}
            else:
                error_text = response.text[:200]  # Limit error text
                return {"status": "error", "message": f"API error {response.status_code}: {error_text}"}
    except httpx.ConnectError as e:
        return {"status": "error", "message": f"Cannot connect to {base_url}: {str(e)}"} 
    except httpx.TimeoutException:
        return {"status": "error", "message": "Connection timed out after 30 seconds"}
    except Exception as e:
        return {"status": "error", "message": f"Error: {str(e)}"}


async def _test_custom(test_request: LLMTestRequest):
    """Test custom LLM API connection"""
    if not test_request.base_url:
        raise HTTPException(status_code=400, detail="base_url is required for custom providers")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Try OpenAI-compatible format first
        response = await client.post(
            f"{test_request.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {test_request.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": test_request.model,
                "messages": [{"role": "user", "content": "Hello"}],
                "max_tokens": 5
            }
        )
        
        if response.status_code == 200:
            return {"status": "success", "message": "Connected successfully"}
        else:
            return {"status": "error", "message": f"API returned status {response.status_code}: {response.text}"}


# Import shared utility to avoid code duplication
from ..utils.settings_utils import is_valid_api_key as _is_valid_api_key


def get_active_llm_config(user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Get the first enabled LLM provider for a user.
    
    DEPRECATED: This function is kept for backward compatibility.
    New code should use SettingsService directly via dependency injection.
    
    Args:
        user_id: User ID, or None for anonymous user
        
    Returns:
        Dict with 'type', 'api_key', 'base_url', 'model' keys, or None if not found
    """
    # Delegate to SettingsService (thin wrapper for backward compatibility)
    from ..services.settings_service import SettingsService
    service = SettingsService()
    return service.get_active_llm_config(user_id)


def get_provider_for_model(model_name: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Find the provider that owns the given model name.
    
    DEPRECATED: This function is kept for backward compatibility.
    New code should use SettingsService directly via dependency injection.
    
    Args:
        model_name: Name of the model to find
        user_id: User ID, or None for anonymous user
        
    Returns:
        Dict with provider config, or None if not found
    """
    # Delegate to SettingsService (thin wrapper for backward compatibility)
    from ..services.settings_service import SettingsService
    service = SettingsService()
    return service.get_provider_for_model(model_name, user_id)


def get_user_settings(user_id: Optional[str] = None) -> Optional[LLMSettings]:
    """
    Get full LLM settings (including iteration_limit) for a user.
    
    DEPRECATED: This function is kept for backward compatibility.
    New code should use SettingsService directly via dependency injection.
    
    Args:
        user_id: User ID, or None for anonymous user
        
    Returns:
        LLMSettings object if found, None otherwise
    """
    # Delegate to SettingsService (thin wrapper for backward compatibility)
    from ..services.settings_service import SettingsService
    service = SettingsService()
    return service.get_user_settings(user_id)

