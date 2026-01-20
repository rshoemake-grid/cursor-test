"""Tests for UnifiedLLMAgent"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
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
        "api_key": "test-api-key",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }


@pytest.mark.asyncio
async def test_unified_llm_agent_init(mock_node, mock_llm_config):
    """Test UnifiedLLMAgent initialization"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    assert agent.node_id == "test-agent-1"
    assert agent.config.model == "gpt-4"
    assert agent.llm_config == mock_llm_config


@pytest.mark.asyncio
async def test_unified_llm_agent_init_missing_config(mock_node):
    """Test UnifiedLLMAgent initialization without agent_config"""
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent"
    )
    
    with pytest.raises(ValueError, match="requires agent_config"):
        UnifiedLLMAgent(node, llm_config=mock_llm_config)


@pytest.mark.asyncio
async def test_unified_llm_agent_init_no_llm_config(mock_node):
    """Test UnifiedLLMAgent initialization without LLM config"""
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(ValueError, match="No LLM configuration found"):
            UnifiedLLMAgent(mock_node, llm_config=None)


@pytest.mark.asyncio
async def test_unified_llm_agent_fallback_to_env(mock_node):
    """Test UnifiedLLMAgent falls back to environment variables"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "env-key"}):
        agent = UnifiedLLMAgent(mock_node, llm_config=None)
        assert agent.llm_config is not None
        assert agent.llm_config["api_key"] == "env-key"


@pytest.mark.asyncio
async def test_unified_llm_agent_validate_api_key():
    """Test API key validation"""
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
    
    llm_config = {
        "type": "openai",
        "api_key": "test-api-key",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Test empty key
    with pytest.raises(ValueError):
        agent._validate_api_key("")
    
    # Test placeholder key
    with pytest.raises(ValueError):
        agent._validate_api_key("your-api-key-here")
    
    # Test short key
    with pytest.raises(ValueError):
        agent._validate_api_key("short")
    
    # Valid key should pass
    agent._validate_api_key("sk-123456789012345678901234567890")


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_openai(mock_node, mock_llm_config):
    """Test UnifiedLLMAgent execution with OpenAI"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    # Mock httpx response
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
        
        result = await agent.execute({"input": "Hello"})
        assert result == "Test response"


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_anthropic(mock_node):
    """Test UnifiedLLMAgent execution with Anthropic"""
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
        "api_key": "sk-test-key-123456789012345678901234567890",  # Valid length
        "base_url": "https://api.anthropic.com/v1",
        "model": "claude-3-5-sonnet-20241022"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response for Anthropic
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "content": [{"text": "Test response"}]
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
async def test_unified_llm_agent_find_provider_for_model(mock_node, mock_llm_config):
    """Test finding provider for a model"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = mock_llm_config
        result = agent._find_provider_for_model("gpt-4", None)
        assert result == mock_llm_config


@pytest.mark.asyncio
async def test_unified_llm_agent_node_with_data_dict(mock_llm_config):
    """Test UnifiedLLMAgent with node that has agent_config in data dict"""
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        data={"agent_config": {"model": "gpt-4", "temperature": 0.7}}
    )
    
    agent = UnifiedLLMAgent(node, llm_config=mock_llm_config)
    assert agent.config.model == "gpt-4"

