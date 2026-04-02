"""
Settings API Routes - LLM Provider Configuration
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..database.models import UserDB
from ..auth.auth import get_optional_user
from ..utils.logger import get_logger
from ..dependencies import SettingsServiceDep
import httpx

logger = get_logger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])


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
    default_model: Optional[str] = None  # Selected model for workflow generation / agents when no per-node model
    chat_assistant_model: Optional[str] = None  # Workflow builder chat; empty uses default_model / first enabled provider


class LLMTestRequest(BaseModel):
    type: str
    api_key: str
    base_url: Optional[str] = None
    model: str


# load_settings_into_cache moved to SettingsService.load_settings_into_cache()


@router.post("/llm")
async def save_llm_settings(
    settings: LLMSettings,
    settings_service: SettingsServiceDep,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user),
):
    """Save LLM provider settings - delegates to SettingsService (SRP)."""
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to save settings"
        )
    await settings_service.save_settings(db, current_user.id, settings)
    return {"status": "success", "message": "Settings saved successfully"}


@router.get("/llm", response_model=LLMSettings)
async def get_llm_settings(
    settings_service: SettingsServiceDep,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user),
):
    """Get LLM provider settings - delegates to SettingsService (SRP)."""
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to view settings"
        )
    return await settings_service.get_settings(db, current_user.id)


# OCP: Provider registry - add new providers without editing this file
_LLM_TEST_REGISTRY: Dict[str, Any] = {}


def _get_llm_test_registry() -> Dict[str, Any]:
    """Lazy-init registry to avoid circular imports."""
    if not _LLM_TEST_REGISTRY:
        from ..services.llm_test_service import (
            test_openai,
            test_anthropic,
            test_gemini,
            test_custom,
        )
        _LLM_TEST_REGISTRY.update({
            "openai": test_openai,
            "anthropic": test_anthropic,
            "gemini": test_gemini,
            "custom": test_custom,
        })
    return _LLM_TEST_REGISTRY


@router.post("/llm/test")
async def test_llm_connection(test_request: LLMTestRequest):
    """Test LLM provider connection - uses provider registry (OCP). Apigee-compatible error format."""
    try:
        registry = _get_llm_test_registry()
        tester = registry.get(test_request.type)
        if tester is None:
            raise HTTPException(status_code=400, detail=f"Unknown provider type: {test_request.type}")
        result = await tester(test_request.base_url, test_request.api_key, test_request.model)
        if result.get("status") == "error":
            raise HTTPException(status_code=422, detail=result.get("message", "Connection failed"))
        return result
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=422, detail=f"HTTP {e.response.status_code}: {e.response.text}")
    except httpx.ConnectError as e:
        raise HTTPException(status_code=422, detail=f"Connection failed: {str(e)}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=422, detail="Request timed out")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Unexpected error: {str(e)}")

