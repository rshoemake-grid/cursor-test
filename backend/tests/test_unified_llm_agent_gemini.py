"""Tests for UnifiedLLMAgent Gemini-specific functionality"""
import pytest
from unittest.mock import Mock, AsyncMock, patch

from backend.agents.unified_llm_agent import UnifiedLLMAgent
from backend.models.schemas import Node, NodeType, AgentConfig


@pytest.fixture
def gemini_node():
    """Create a Gemini node"""
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Gemini Agent",
        agent_config=config
    )
    return node


@pytest.fixture
def mock_gemini_config():
    """Create mock Gemini config"""
    return {
        "type": "gemini",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.5-flash"
    }


@pytest.mark.asyncio
async def test_unified_llm_agent_gemini_retry_on_rate_limit(gemini_node, mock_gemini_config):
    """Test Gemini retry logic on rate limit"""
    agent = UnifiedLLMAgent(gemini_node, llm_config=mock_gemini_config)
    
    # Mock httpx responses - first 429, then success
    mock_response_429 = Mock()
    mock_response_429.status_code = 429
    mock_response_429.json.return_value = {
        "error": {
            "message": "Rate limit exceeded",
            "details": [{
                "@type": "type.googleapis.com/google.rpc.RetryInfo",
                "retryDelay": "2s"
            }]
        }
    }
    
    mock_response_200 = Mock()
    mock_response_200.status_code = 200
    mock_response_200.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{"text": "Success after retry"}]
            }
        }]
    }
    
    call_count = 0
    async def mock_post(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return mock_response_429
        return mock_response_200
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(side_effect=mock_post)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            result = await agent.execute({"input": "Hello"})
            assert result == "Success after retry"
            assert call_count == 2  # Should retry once


@pytest.mark.asyncio
async def test_unified_llm_agent_gemini_image_generation_multiple(gemini_node, mock_gemini_config):
    """Test Gemini image generation with multiple images"""
    config = AgentConfig(
        model="gemini-2.0-flash-image-exp",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Image Agent",
        agent_config=config
    )
    
    agent = UnifiedLLMAgent(node, llm_config=mock_gemini_config)
    
    # Mock httpx response with multiple images
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [
                    {"inlineData": {"mimeType": "image/png", "data": "img1"}},
                    {"inlineData": {"mimeType": "image/png", "data": "img2"}},
                    {"text": "Generated images"}
                ]
            }
        }]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            result = await agent.execute({"input": "Generate images"})
            assert isinstance(result, dict)
            assert "images" in result
            assert len(result["images"]) == 2


@pytest.mark.asyncio
async def test_unified_llm_agent_gemini_snake_case_inline_data(gemini_node, mock_gemini_config):
    """Test Gemini response with snake_case inline_data"""
    agent = UnifiedLLMAgent(gemini_node, llm_config=mock_gemini_config)
    
    # Mock httpx response with snake_case inline_data
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": "base64data"
                    }
                }]
            }
        }]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            result = await agent.execute({"input": "Generate image"})
            assert isinstance(result, str)
            assert result.startswith("data:image/")


@pytest.mark.asyncio
async def test_unified_llm_agent_gemini_system_instruction(gemini_node, mock_gemini_config):
    """Test Gemini with system instruction"""
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.7,
        system_prompt="You are a helpful assistant"
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Gemini Agent",
        agent_config=config
    )
    
    agent = UnifiedLLMAgent(node, llm_config=mock_gemini_config)
    
    # Mock httpx response
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{"text": "Response"}]
            }
        }]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            result = await agent.execute({"input": "Hello"})
            assert result == "Response"
            
            # Verify system instruction was included in request
            call_args = mock_client.post.call_args
            request_data = call_args[1]["json"]
            assert "systemInstruction" in request_data


@pytest.mark.asyncio
async def test_unified_llm_agent_gemini_generation_config(gemini_node, mock_gemini_config):
    """Test Gemini with generation config"""
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.8,
        max_tokens=500
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Gemini Agent",
        agent_config=config
    )
    
    agent = UnifiedLLMAgent(node, llm_config=mock_gemini_config)
    
    # Mock httpx response
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{"text": "Response"}]
            }
        }]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            result = await agent.execute({"input": "Hello"})
            assert result == "Response"
            
            # Verify generation config was included
            call_args = mock_client.post.call_args
            request_data = call_args[1]["json"]
            assert "generationConfig" in request_data
            assert request_data["generationConfig"]["temperature"] == 0.8
            assert request_data["generationConfig"]["maxOutputTokens"] == 500

