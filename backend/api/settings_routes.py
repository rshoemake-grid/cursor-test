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


# In-memory cache (for quick access, backed by database)
_settings_cache: Dict[str, LLMSettings] = {}


async def load_settings_into_cache(db: AsyncSession):
    """Load all settings from database into cache (called on server startup)"""
    try:
        result = await db.execute(select(SettingsDB))
        all_settings = result.scalars().all()
        
        for settings_db in all_settings:
            if settings_db.settings_data:
                settings = LLMSettings(**settings_db.settings_data)
                _settings_cache[settings_db.user_id] = settings
                logger.info(f"Loaded settings for user: {settings_db.user_id} ({len(settings.providers)} providers)")
        
        logger.info(f"Loaded {len(_settings_cache)} user settings into cache")
    except Exception as e:
        logger.error(f"Failed to load settings into cache: {e}", exc_info=True)


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
    """Get the first enabled LLM provider for a user
    
    For authenticated users, only returns their own settings (no anonymous fallback).
    For unauthenticated users (user_id=None), returns anonymous settings.
    Also tries to load from database if cache is empty.
    """
    uid = user_id if user_id else "anonymous"
    
    logger.debug(f"Getting LLM config for user: {uid}, cache keys: {list(_settings_cache.keys())}")
    
    # Try user-specific settings
    settings = None
    if uid in _settings_cache:
        settings = _settings_cache[uid]
        logger.debug(f"Found user-specific settings with {len(settings.providers)} providers")
    elif not _settings_cache:
        # Cache is empty - try to load from database synchronously (fallback)
        logger.warning(f"Settings cache is empty, attempting to load from database")
        try:
            import asyncio
            from ..database.db import AsyncSessionLocal
            from sqlalchemy import select
            
            # Try to load settings from database
            loop = None
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            async def load_from_db():
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(SettingsDB))
                    all_settings = result.scalars().all()
                    for settings_db in all_settings:
                        if settings_db.settings_data:
                            settings_obj = LLMSettings(**settings_db.settings_data)
                            _settings_cache[settings_db.user_id] = settings_obj
                            logger.info(f"Loaded settings for user: {settings_db.user_id} from database")
            
            if loop.is_running():
                # Can't run async code in sync context if loop is running
                logger.warning("Cannot load settings from database synchronously - event loop is running")
            else:
                loop.run_until_complete(load_from_db())
                
                # Try again after loading
                if uid in _settings_cache:
                    settings = _settings_cache[uid]
                elif user_id and "anonymous" in _settings_cache:
                    settings = _settings_cache["anonymous"]
        except Exception as e:
            logger.error(f"Failed to load settings from database: {e}", exc_info=True)
    
    # Delegate to SettingsService for the core logic
    from ..services.settings_service import SettingsService
    service = SettingsService()
    return service.get_active_llm_config(user_id)


def get_provider_for_model(model_name: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Find the provider that owns the given model name
    
    Note: This function delegates to SettingsService for the core logic.
    """
    uid = user_id if user_id else "anonymous"
    
    if uid not in _settings_cache:
        logger.warning(f"No settings found in cache for user '{uid}' - settings need to be loaded from database via API")
        return None
    
    # Delegate to SettingsService for the core logic
    from ..services.settings_service import SettingsService
    service = SettingsService()
    return service.get_provider_for_model(model_name, user_id)


def get_user_settings(user_id: Optional[str] = None) -> Optional[LLMSettings]:
    """Get full LLM settings (including iteration_limit) for a user
    
    Args:
        user_id: User ID, or None for anonymous user
        
    Returns:
        LLMSettings object if found, None otherwise
        
    Note: This function delegates to SettingsService for the core logic, but includes
    additional logic to load from database if cache is empty (for backward compatibility).
    """
    uid = user_id if user_id else "anonymous"
    
    # If cache is empty, try to load from database (fallback for backward compatibility)
    if not _settings_cache:
        logger.warning(f"Settings cache is empty, attempting to load from database for user: {uid}")
        try:
            import asyncio
            from ..database.db import AsyncSessionLocal
            from sqlalchemy import select
            
            # Try to load settings from database
            loop = None
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            async def load_from_db():
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(SettingsDB))
                    all_settings = result.scalars().all()
                    for settings_db in all_settings:
                        if settings_db.settings_data:
                            settings_obj = LLMSettings(**settings_db.settings_data)
                            _settings_cache[settings_db.user_id] = settings_obj
                            logger.info(f"Loaded settings for user: {settings_db.user_id} from database (iteration_limit: {settings_obj.iteration_limit})")
            
            if loop.is_running():
                # Can't run async code in sync context if loop is running
                logger.warning("Cannot load settings from database synchronously - event loop is running")
            else:
                loop.run_until_complete(load_from_db())
        except Exception as e:
            logger.error(f"Failed to load settings from database: {e}", exc_info=True)
    
    # Delegate to SettingsService for the core logic
    from ..services.settings_service import SettingsService
    service = SettingsService()
    return service.get_user_settings(user_id)

