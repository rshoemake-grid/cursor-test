"""Tests for UnifiedLLMAgent error handling paths"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import httpx

from backend.agents.unified_llm_agent import UnifiedLLMAgent
from backend.models.schemas import Node, NodeType, AgentConfig


@pytest.fixture
def mock_node():
    """Create a mock agent node"""
    config = AgentConfig(
        model="gpt-4",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    return node


@pytest.mark.asyncio
async def test_unified_llm_agent_openai_rate_limit_error(mock_node):
    """Test UnifiedLLMAgent handles OpenAI rate limit errors"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with rate limit error
    mock_http_response = Mock()
    mock_http_response.status_code = 429
    mock_http_response.text = "Rate limit exceeded"
    
    mock_http_error = httpx.HTTPStatusError(
        "Rate limit exceeded",
        request=Mock(),
        response=mock_http_response
    )
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(side_effect=mock_http_error)
        mock_client_class.return_value = mock_client
        
        inputs = {"input": "Hello"}
        
        with pytest.raises(Exception):  # Should raise an error
            await agent.execute(inputs)


@pytest.mark.asyncio
async def test_unified_llm_agent_openai_server_error(mock_node):
    """Test UnifiedLLMAgent handles OpenAI server errors"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with server error
    mock_http_response = Mock()
    mock_http_response.status_code = 500
    mock_http_response.text = "Internal server error"
    
    mock_http_error = httpx.HTTPStatusError(
        "Internal server error",
        request=Mock(),
        response=mock_http_response
    )
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(side_effect=mock_http_error)
        mock_client_class.return_value = mock_client
        
        inputs = {"input": "Hello"}
        
        with pytest.raises(Exception):  # Should raise an error
            await agent.execute(inputs)


@pytest.mark.asyncio
async def test_unified_llm_agent_anthropic_rate_limit_error(mock_node):
    """Test UnifiedLLMAgent handles Anthropic rate limit errors"""
    llm_config = {
        "type": "anthropic",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.anthropic.com/v1",
        "model": "claude-3-5-sonnet-20241022"
    }
    
    config = AgentConfig(
        model="claude-3-5-sonnet-20241022",
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with rate limit error
    mock_http_response = Mock()
    mock_http_response.status_code = 429
    mock_http_response.text = "Rate limit exceeded"
    
    mock_http_error = httpx.HTTPStatusError(
        "Rate limit exceeded",
        request=Mock(),
        response=mock_http_response
    )
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(side_effect=mock_http_error)
        mock_client_class.return_value = mock_client
        
        inputs = {"input": "Hello"}
        
        with pytest.raises(Exception):  # Should raise an error
            await agent.execute(inputs)


@pytest.mark.asyncio
async def test_unified_llm_agent_custom_provider_missing_base_url(mock_node):
    """Test UnifiedLLMAgent custom provider error when base_url is missing"""
    llm_config = {
        "type": "custom",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "model": "custom-model"
        # Missing base_url
    }
    
    config = AgentConfig(
        model="custom-model",
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    inputs = {"input": "Hello"}
    
    with pytest.raises(ValueError, match="base_url is required"):
        await agent.execute(inputs)


@pytest.mark.asyncio
async def test_unified_llm_agent_build_message_with_url_image(mock_node):
    """Test UnifiedLLMAgent build_user_message with URL image"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4-vision-preview"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    inputs = {
        "input": "What's in this image?",
        "image": "https://example.com/image.png"
    }
    
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    assert any(item.get("type") == "image_url" for item in message)

