"""Tests for UnifiedLLMAgent provider detection and fallback"""
import pytest
from unittest.mock import Mock, AsyncMock, patch

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
async def test_unified_llm_agent_fallback_to_env(mock_node):
    """Test UnifiedLLMAgent fallback to environment variable"""
    # No llm_config provided - should use fallback
    with patch("os.getenv") as mock_getenv:
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENAI_API_KEY": "sk-env-key-123456789012345678901234567890"
        }.get(key, default)
        
        agent = UnifiedLLMAgent(mock_node, llm_config=None)
        
        # Should use environment fallback - check llm_config attribute
        assert agent.llm_config is not None
        assert agent.llm_config["type"] == "openai"


@pytest.mark.asyncio
async def test_unified_llm_agent_no_api_key(mock_node):
    """Test UnifiedLLMAgent with no API key"""
    with patch("os.getenv") as mock_getenv:
        mock_getenv.return_value = None
        
        with pytest.raises(ValueError, match="LLM configuration"):
            agent = UnifiedLLMAgent(mock_node, llm_config={})


@pytest.mark.asyncio
async def test_unified_llm_agent_placeholder_api_key(mock_node):
    """Test UnifiedLLMAgent with placeholder API key"""
    llm_config = {
        "type": "openai",
        "api_key": "your-api-key-here",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with pytest.raises(ValueError):
        await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_find_provider_for_model(mock_node):
    """Test UnifiedLLMAgent finding provider for model"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = {
            "type": "openai",
            "api_key": "sk-provider-key",
            "model": "gpt-4"
        }
        
        # Should use provider from settings
        provider = agent._find_provider_for_model("gpt-4")
        assert provider is not None


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_none_result(mock_node):
    """Test UnifiedLLMAgent handling None result"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
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
        # Should convert None to empty string
        assert result == ""

