"""Tests for UnifiedLLMAgent custom provider execution"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import httpx

from backend.agents.unified_llm_agent import UnifiedLLMAgent
from backend.models.schemas import Node, NodeType, AgentConfig


@pytest.fixture
def mock_node():
    """Create a mock agent node"""
    config = AgentConfig(
        model="custom-model",
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
async def test_unified_llm_agent_custom_provider_text(mock_node):
    """Test UnifiedLLMAgent with custom provider (text model)"""
    llm_config = {
        "type": "custom",
        "api_key": "sk-custom-key-123456789012345678901234567890",
        "base_url": "https://api.custom.com/v1",
        "model": "custom-model"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{
            "message": {
                "content": "Custom API response"
            }
        }]
    }
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        result = await agent.execute({"input": "Hello"})
        assert result == "Custom API response"
        
        # Verify API call was made correctly
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert call_args[0][0] == "https://api.custom.com/v1/chat/completions"
        assert "Authorization" in call_args[1]["headers"]
        assert call_args[1]["json"]["model"] == "custom-model"


@pytest.mark.asyncio
async def test_unified_llm_agent_custom_provider_vision(mock_node):
    """Test UnifiedLLMAgent with custom provider (vision model)"""
    llm_config = {
        "type": "custom",
        "api_key": "sk-custom-key-123456789012345678901234567890",
        "base_url": "https://api.custom.com/v1",
        "model": "custom-vision-model"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{
            "message": {
                "content": "Vision response"
            }
        }]
    }
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        # Execute with image input
        result = await agent.execute({
            "input": "What's in this image?",
            "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        })
        assert result == "Vision response"
        
        # Verify vision message format was used
        call_args = mock_client.post.call_args
        messages = call_args[1]["json"]["messages"]
        assert isinstance(messages[-1]["content"], list)  # Vision models use list content


@pytest.mark.asyncio
async def test_unified_llm_agent_custom_provider_no_base_url(mock_node):
    """Test UnifiedLLMAgent with custom provider missing base_url"""
    llm_config = {
        "type": "custom",
        "api_key": "sk-custom-key-123456789012345678901234567890",
        "model": "custom-model"
        # Missing base_url
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = llm_config
        
        with pytest.raises(ValueError, match="base_url is required"):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_custom_provider_api_error(mock_node):
    """Test UnifiedLLMAgent with custom provider API error"""
    llm_config = {
        "type": "custom",
        "api_key": "sk-custom-key-123456789012345678901234567890",
        "base_url": "https://api.custom.com/v1",
        "model": "custom-model"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 500
    mock_http_response.text = "Internal Server Error"
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with pytest.raises(RuntimeError, match="Custom API request failed"):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_custom_provider_none_content(mock_node):
    """Test UnifiedLLMAgent with custom provider returning None content"""
    llm_config = {
        "type": "custom",
        "api_key": "sk-custom-key-123456789012345678901234567890",
        "base_url": "https://api.custom.com/v1",
        "model": "custom-model"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with None content
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{
            "message": {
                "content": None
            }
        }]
    }
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        result = await agent.execute({"input": "Hello"})
        # Should return empty string instead of None
        assert result == ""


@pytest.mark.asyncio
async def test_unified_llm_agent_custom_provider_with_system_prompt(mock_node):
    """Test UnifiedLLMAgent with custom provider and system prompt"""
    llm_config = {
        "type": "custom",
        "api_key": "sk-custom-key-123456789012345678901234567890",
        "base_url": "https://api.custom.com/v1",
        "model": "custom-model"
    }
    
    config = AgentConfig(
        model="custom-model",
        temperature=0.7,
        system_prompt="You are a helpful assistant"
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{
            "message": {
                "content": "Response with system prompt"
            }
        }]
    }
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        result = await agent.execute({"input": "Hello"})
        assert result == "Response with system prompt"
        
        # Verify system prompt was included
        call_args = mock_client.post.call_args
        messages = call_args[1]["json"]["messages"]
        assert messages[0]["role"] == "system"
        assert messages[0]["content"] == "You are a helpful assistant"

