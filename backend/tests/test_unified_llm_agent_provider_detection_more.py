"""More tests for UnifiedLLMAgent provider detection"""
import pytest
from unittest.mock import Mock, patch

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
async def test_unified_llm_agent_model_suggests_gemini_provider(mock_node):
    """Test UnifiedLLMAgent detects Gemini model and suggests provider"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    config = AgentConfig(
        model="gemini-2.5-flash",  # Gemini model
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = None  # Model not found
        
        inputs = {"input": "Hello"}
        
        # Should raise error suggesting Gemini provider
        with pytest.raises(ValueError, match="gemini"):
            await agent.execute(inputs)


@pytest.mark.asyncio
async def test_unified_llm_agent_model_suggests_anthropic_provider(mock_node):
    """Test UnifiedLLMAgent detects Anthropic model and suggests provider"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    config = AgentConfig(
        model="claude-3-5-sonnet-20241022",  # Anthropic model
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = None  # Model not found
        
        inputs = {"input": "Hello"}
        
        # Should raise error suggesting Anthropic provider
        with pytest.raises(ValueError, match="anthropic"):
            await agent.execute(inputs)


@pytest.mark.asyncio
async def test_unified_llm_agent_model_suggests_openai_provider(mock_node):
    """Test UnifiedLLMAgent detects OpenAI model and suggests provider"""
    llm_config = {
        "type": "anthropic",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.anthropic.com/v1",
        "model": "claude-3-5-sonnet-20241022"
    }
    
    config = AgentConfig(
        model="gpt-4-turbo",  # OpenAI model
        temperature=0.7
    )
    mock_node.agent_config = config
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = None  # Model not found
        
        inputs = {"input": "Hello"}
        
        # Should raise error suggesting OpenAI provider
        with pytest.raises(ValueError, match="openai"):
            await agent.execute(inputs)


@pytest.mark.asyncio
async def test_unified_llm_agent_no_default_provider_error(mock_node):
    """Test UnifiedLLMAgent error when no default provider configured"""
    config = AgentConfig(
        model="unknown-model",
        temperature=0.7
    )
    mock_node.agent_config = config
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = None  # Model not found
        
        # No llm_config provided and no env vars
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError, match="No LLM configuration"):
                UnifiedLLMAgent(mock_node, llm_config=None)

