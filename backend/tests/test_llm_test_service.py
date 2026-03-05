"""Unit tests for backend.services.llm_test_service."""
import pytest
from unittest.mock import AsyncMock, Mock, patch

import backend.services.llm_test_service as llm_test_svc


@pytest.mark.asyncio
async def test_test_openai_success():
    mock_response = Mock()
    mock_response.status_code = 200
    with patch("backend.services.llm_test_service.httpx.AsyncClient") as m:
        mc = AsyncMock()
        mc.post = AsyncMock(return_value=mock_response)
        mc.__aenter__ = AsyncMock(return_value=mc)
        mc.__aexit__ = AsyncMock(return_value=None)
        m.return_value = mc
        result = await llm_test_svc.test_openai("https://api.openai.com/v1", "sk-test", "gpt-4")
        assert result["status"] == "success"


@pytest.mark.asyncio
async def test_test_openai_401():
    mock_response = Mock()
    mock_response.status_code = 401
    with patch("backend.services.llm_test_service.httpx.AsyncClient") as m:
        mc = AsyncMock()
        mc.post = AsyncMock(return_value=mock_response)
        mc.__aenter__ = AsyncMock(return_value=mc)
        mc.__aexit__ = AsyncMock(return_value=None)
        m.return_value = mc
        result = await llm_test_svc.test_openai("https://api.openai.com/v1", "sk-test", "gpt-4")
        assert result["status"] == "error"
        assert "401" in result["message"]


@pytest.mark.asyncio
async def test_test_custom_raises_without_base_url():
    from fastapi import HTTPException
    with pytest.raises(HTTPException, match="base_url"):
        await llm_test_svc.test_custom(None, "sk-test", "model")
