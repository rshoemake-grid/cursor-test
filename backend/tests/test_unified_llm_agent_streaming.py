"""Tests for UnifiedLLMAgent streaming functionality"""
import pytest
from unittest.mock import Mock, AsyncMock, patch

from backend.agents.unified_llm_agent import UnifiedLLMAgent
from backend.models.schemas import Node, NodeType, AgentConfig


@pytest.fixture
def mock_node():
    """Create a mock agent node"""
    config = AgentConfig(
        model="gpt-4",
        temperature=0.7,
        system_prompt="You are a helpful assistant"
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    return node


@pytest.fixture
def mock_llm_config():
    """Create mock LLM config"""
    return {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }


@pytest.mark.asyncio
async def test_unified_llm_agent_openai_error_handling(mock_node, mock_llm_config):
    """Test UnifiedLLMAgent error handling with OpenAI"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 500
    mock_http_response.text = "Internal Server Error"
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with pytest.raises(RuntimeError, match="OpenAI API request failed"):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_openai_empty_response(mock_node, mock_llm_config):
    """Test UnifiedLLMAgent with empty OpenAI response"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    # Mock httpx response with None content
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{"message": {"content": None}}]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        result = await agent.execute({"input": "Hello"})
        assert result == ""


@pytest.mark.asyncio
async def test_unified_llm_agent_anthropic_error_handling(mock_node):
    """Test UnifiedLLMAgent error handling with Anthropic"""
    config = AgentConfig(
        model="claude-3-5-sonnet-20241022",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "anthropic",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.anthropic.com/v1",
        "model": "claude-3-5-sonnet-20241022"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 400
    mock_http_response.text = "Bad Request"
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            with pytest.raises(RuntimeError):
                await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_custom_error_handling(mock_node):
    """Test UnifiedLLMAgent error handling with custom provider"""
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
    
    llm_config = {
        "type": "custom",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://custom-api.example.com/v1",
        "model": "custom-model"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 500
    mock_http_response.text = "Server Error"
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            with pytest.raises(RuntimeError, match="Custom API request failed"):
                await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_custom_empty_response(mock_node):
    """Test UnifiedLLMAgent with custom provider empty response"""
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
    
    llm_config = {
        "type": "custom",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://custom-api.example.com/v1",
        "model": "custom-model"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response with None content
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{"message": {"content": None}}]
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
            assert result == ""


@pytest.mark.asyncio
async def test_unified_llm_agent_unknown_provider(mock_node):
    """Test UnifiedLLMAgent with unknown provider type"""
    config = AgentConfig(
        model="test-model",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "unknown_provider",
        "api_key": "test-key",
        "model": "test-model"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Unknown provider should raise ValueError during execution
    with pytest.raises((ValueError, RuntimeError)):
        await agent.execute({"input": "Hello"})

