"""Tests for UnifiedLLMAgent API key validation"""
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


def test_unified_llm_agent_validate_api_key_placeholder(mock_node):
    """Test UnifiedLLMAgent API key validation rejects placeholders"""
    llm_config = {
        "type": "openai",
        "api_key": "your-api-key-here",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with pytest.raises(ValueError, match="placeholder"):
        agent._validate_api_key("your-api-key-here")


def test_unified_llm_agent_validate_api_key_too_short(mock_node):
    """Test UnifiedLLMAgent API key validation rejects short keys"""
    llm_config = {
        "type": "openai",
        "api_key": "short",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with pytest.raises(ValueError, match="too short"):
        agent._validate_api_key("short")


def test_unified_llm_agent_validate_api_key_masked_placeholder(mock_node):
    """Test UnifiedLLMAgent API key validation rejects masked placeholders"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-your-api*****here",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with pytest.raises(ValueError, match="placeholder"):
        agent._validate_api_key("sk-your-api*****here")


def test_unified_llm_agent_validate_api_key_empty(mock_node):
    """Test UnifiedLLMAgent API key validation rejects empty keys"""
    llm_config = {
        "type": "openai",
        "api_key": "",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    with pytest.raises(ValueError, match="empty"):
        agent._validate_api_key("")


def test_unified_llm_agent_validate_api_key_valid(mock_node):
    """Test UnifiedLLMAgent API key validation accepts valid keys"""
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    
    # Should not raise
    agent._validate_api_key("sk-test-key-123456789012345678901234567890")

