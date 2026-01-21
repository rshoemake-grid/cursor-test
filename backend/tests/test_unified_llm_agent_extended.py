"""Extended tests for UnifiedLLMAgent - more provider types and edge cases"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any

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
async def test_unified_llm_agent_execute_gemini(mock_node):
    """Test UnifiedLLMAgent execution with Gemini"""
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "gemini",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.5-flash"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response for Gemini
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{"text": "Test response"}]
            }
        }]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        # Mock get_provider_for_model to return None (use default)
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            result = await agent.execute({"input": "Hello"})
            assert result == "Test response"


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_custom(mock_node):
    """Test UnifiedLLMAgent execution with custom provider"""
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
    
    # Mock httpx response for custom provider
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{"message": {"content": "Test response"}}]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        # Mock get_provider_for_model to return None (use default)
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            result = await agent.execute({"input": "Hello"})
            assert result == "Test response"


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_openai_error(mock_node, mock_llm_config):
    """Test UnifiedLLMAgent error handling with OpenAI"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 401
    mock_http_response.text = "Unauthorized"
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with pytest.raises(RuntimeError, match="OpenAI API request failed"):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_anthropic_error(mock_node):
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
    mock_http_response.status_code = 401
    mock_http_response.text = "Unauthorized"
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        # Mock get_provider_for_model to return None (use default)
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            with pytest.raises(RuntimeError, match="Anthropic API request failed"):
                await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_openai_vision(mock_node, mock_llm_config):
    """Test UnifiedLLMAgent with vision model (OpenAI)"""
    config = AgentConfig(
        model="gpt-4-vision",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    agent = UnifiedLLMAgent(node, llm_config=mock_llm_config)
    
    # Mock httpx response
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{"message": {"content": "I see an image"}}]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        # Test with vision input (list format)
        vision_input = [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
        ]
        result = await agent.execute({"input": vision_input})
        assert result == "I see an image"


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_openai_empty_response(mock_node, mock_llm_config):
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
        # Should return empty string, not None
        assert result == ""


@pytest.mark.asyncio
async def test_unified_llm_agent_build_user_message(mock_node, mock_llm_config):
    """Test building user message from inputs"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    # Test with simple input
    inputs = {"input": "Hello"}
    message = agent._build_user_message(inputs)
    # Message includes system prompt + input
    assert "Hello" in message
    assert isinstance(message, str)
    
    # Test with multiple inputs
    inputs = {"input1": "Hello", "input2": "World"}
    message = agent._build_user_message(inputs)
    assert "Hello" in message
    assert "World" in message


@pytest.mark.asyncio
async def test_unified_llm_agent_model_not_found_in_provider(mock_node):
    """Test UnifiedLLMAgent when model not found in any provider"""
    config = AgentConfig(
        model="unknown-model",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock get_provider_for_model to return None and mock httpx to avoid actual API call
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider, \
         patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_get_provider.return_value = None
        
        # Mock httpx to avoid actual API call during error path
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=Mock(status_code=200, json=lambda: {"choices": [{"message": {"content": "test"}}]}))
        mock_client_class.return_value = mock_client
        
        # Model not found - should use default provider and continue (not raise error)
        # The code logs a warning but continues with default provider
        result = await agent.execute({"input": "Hello"})
        # Should complete successfully using default provider
        assert result is not None

