"""Tests for UnifiedLLMAgent error handling and edge cases"""
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
async def test_unified_llm_agent_model_not_found_error(mock_node):
    """Test UnifiedLLMAgent when model is not found in any provider"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    # Set a model that doesn't exist and suggests wrong provider
    config = AgentConfig(
        model="claude-3-5-sonnet-20241022",  # Suggests anthropic but we have openai config
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = None  # Model not found
        
        # Should raise ValueError because model suggests anthropic but we have openai
        with pytest.raises(ValueError, match="appears to be a anthropic model"):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_provider_mismatch_error(mock_node):
    """Test UnifiedLLMAgent when model suggests different provider"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    # Set a model that suggests anthropic provider
    config = AgentConfig(
        model="claude-3-5-sonnet-20241022",
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = None  # Model not found, will use default provider
        
        with pytest.raises(ValueError, match="appears to be a anthropic model"):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_openai_api_error(mock_node):
    """Test UnifiedLLMAgent handling OpenAI API errors"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 401
    mock_http_response.json.return_value = {
        "error": {
            "message": "Invalid API key",
            "type": "invalid_request_error"
        }
    }
    mock_http_response.text = '{"error": {"message": "Invalid API key"}}'
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with pytest.raises(RuntimeError):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_anthropic_api_error(mock_node):
    """Test UnifiedLLMAgent handling Anthropic API errors"""
    llm_config = {
        "type": "anthropic",
        "api_key": "sk-ant-test-key-123456789012345678901234567890",
        "base_url": "https://api.anthropic.com/v1",
        "model": "claude-3-5-sonnet-20241022"
    }
    
    config = AgentConfig(
        model="claude-3-5-sonnet-20241022",
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 401
    mock_http_response.json.return_value = {
        "error": {
            "message": "Invalid API key",
            "type": "authentication_error"
        }
    }
    mock_http_response.text = '{"error": {"message": "Invalid API key"}}'
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with pytest.raises(RuntimeError):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_gemini_api_error(mock_node):
    """Test UnifiedLLMAgent handling Gemini API errors"""
    llm_config = {
        "type": "gemini",
        "api_key": "test-gemini-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.5-flash"
    }
    
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 400
    mock_http_response.json.return_value = {
        "error": {
            "message": "Invalid API key",
            "code": 400
        }
    }
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with pytest.raises(RuntimeError):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_network_error(mock_node):
    """Test UnifiedLLMAgent handling network errors"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        # NetworkError should be caught and wrapped
        network_error = httpx.NetworkError("Connection failed")
        mock_client.post = AsyncMock(side_effect=network_error)
        mock_client_class.return_value = mock_client
        
        # NetworkError should propagate (not wrapped)
        with pytest.raises(httpx.NetworkError):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_timeout_error(mock_node):
    """Test UnifiedLLMAgent handling timeout errors"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = llm_config
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        # TimeoutException should propagate (not wrapped)
        timeout_error = httpx.TimeoutException("Request timeout")
        mock_client.post = AsyncMock(side_effect=timeout_error)
        mock_client_class.return_value = mock_client
        
        # TimeoutException should propagate
        with pytest.raises(httpx.TimeoutException):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_empty_api_key_error(mock_node):
    """Test UnifiedLLMAgent with empty API key"""
    llm_config = {
        "type": "openai",
        "api_key": "",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with pytest.raises(ValueError, match="has no API key configured"):
        await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_short_api_key_error(mock_node):
    """Test UnifiedLLMAgent with too short API key"""
    llm_config = {
        "type": "openai",
        "api_key": "short",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = llm_config
        
        with pytest.raises(ValueError):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_gemini_no_candidates(mock_node):
    """Test UnifiedLLMAgent handling Gemini response with no candidates"""
    llm_config = {
        "type": "gemini",
        "api_key": "test-gemini-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.5-flash"
    }
    
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with no candidates
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": []
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
async def test_unified_llm_agent_gemini_no_content(mock_node):
    """Test UnifiedLLMAgent handling Gemini response with no content"""
    llm_config = {
        "type": "gemini",
        "api_key": "test-gemini-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.5-flash"
    }
    
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Mock httpx response with candidate but no content
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "finishReason": "STOP"
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

