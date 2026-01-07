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
    """Save LLM provider settings to database"""
    user_id = current_user.id if current_user else "anonymous"
    
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
    logger.info(f"Saving LLM settings for user: {user_id}, providers count: {len(settings.providers)}")
    for p in settings.providers:
        logger.debug(f"Provider {p.name}: enabled={p.enabled}, has_key={len(p.apiKey) > 0}")
    
    return {"status": "success", "message": "Settings saved successfully"}


@router.get("/llm", response_model=LLMSettings)
async def get_llm_settings(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Get LLM provider settings from database"""
    user_id = current_user.id if current_user else "anonymous"
    
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


def _is_valid_api_key(api_key: str) -> bool:
    """Check if API key is not a placeholder - only flag obvious placeholders"""
    if not api_key:
        return False
    
    # Trim whitespace
    api_key = api_key.strip()
    if not api_key:
        return False
    
    # If it's very short, it's likely a placeholder
    if len(api_key) < 10:
        return False
    
    api_key_lower = api_key.lower()
    
    # Only flag exact placeholder matches - be very conservative
    exact_placeholders = [
        "your-api-key-here",
        "your-api*****here",
        "sk-your-api-key-here",
        "sk-your-api*****here",
        "your-api-key",
        "api-key-here"
    ]
    
    # Check exact matches (case-insensitive)
    if api_key_lower in [p.lower() for p in exact_placeholders]:
        return False
    
    # Check if it's exactly a placeholder pattern (very short and contains placeholder text)
    # Only flag if it's clearly a placeholder, not if it's a real key that happens to contain these words
    if len(api_key) < 25 and ("your-api-key-here" in api_key_lower or "your-api*****here" in api_key_lower):
        return False
    
    # Check for masked placeholder pattern (short key with asterisks and "here")
    if len(api_key) < 30 and "*****here" in api_key:
        return False
    
    # If we get here, assume it's valid (connection test will catch real issues)
    return True


def get_active_llm_config(user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get the first enabled LLM provider for a user
    
    Falls back to "anonymous" settings if user-specific settings not found.
    This allows users who saved settings while not logged in to still use them.
    Also tries to load from database if cache is empty.
    """
    uid = user_id if user_id else "anonymous"
    
    logger.debug(f"Getting LLM config for user: {uid}, cache keys: {list(_settings_cache.keys())}")
    
    # Try user-specific settings first
    settings = None
    if uid in _settings_cache:
        settings = _settings_cache[uid]
        logger.debug(f"Found user-specific settings with {len(settings.providers)} providers")
    elif user_id and "anonymous" in _settings_cache:
        # Fallback to anonymous settings if user is logged in but has no user-specific settings
        logger.info(f"User {uid} not found in cache, falling back to anonymous settings")
        settings = _settings_cache["anonymous"]
        logger.debug(f"Using anonymous settings with {len(settings.providers)} providers")
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
    
    if not settings:
        logger.warning(f"User {uid} not found in cache and no anonymous fallback - settings need to be loaded from database via API")
        return None
    
    for provider in settings.providers:
        logger.debug(f"Checking provider {provider.name}: enabled={provider.enabled}, has_key={len(provider.apiKey) > 0}")
        # Check that provider is enabled, has an API key, and the API key is not a placeholder
        if provider.enabled and provider.apiKey and _is_valid_api_key(provider.apiKey):
            config = {
                "type": provider.type,
                "api_key": provider.apiKey.strip(),  # Trim whitespace
                "base_url": provider.baseUrl,
                "model": provider.defaultModel
            }
            logger.info(f"Using provider {provider.name} for user {uid}")
            return config
    
    logger.warning(f"No enabled provider with valid API key found for user {uid}")
    return None


def get_provider_for_model(model_name: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Find the provider that owns the given model name"""
    uid = user_id if user_id else "anonymous"
    
    if uid not in _settings_cache:
        logger.warning(f"No settings found in cache for user '{uid}' - settings need to be loaded from database via API")
        return None
    
    settings = _settings_cache[uid]
    
    logger.debug(f"Searching for provider for model '{model_name}' (user: {uid}), available providers: {[p.name for p in settings.providers]}")
    
    # Search through all enabled providers to find one that has this model
    for provider in settings.providers:
        logger.debug(f"Checking provider '{provider.name}': enabled={provider.enabled}, has_key={bool(provider.apiKey)}, models={len(provider.models) if provider.models else 0}")
        
        # Check that provider is enabled, has a valid (non-placeholder) API key, and has models
        if provider.enabled and provider.apiKey and _is_valid_api_key(provider.apiKey) and provider.models:
            # Check if this provider has the model
            if model_name in provider.models:
                logger.info(f"Found provider '{provider.name}' for model '{model_name}'")
                return {
                    "type": provider.type,
                    "api_key": provider.apiKey.strip(),  # Trim whitespace
                    "base_url": provider.baseUrl,
                    "model": model_name
                }
    
    logger.warning(f"No provider found for model '{model_name}'")
    return None

