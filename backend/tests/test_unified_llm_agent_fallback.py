"""Tests for UnifiedLLMAgent fallback configuration"""
import pytest
from unittest.mock import Mock, patch
import os

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


def test_unified_llm_agent_fallback_config_from_env(mock_node):
    """Test UnifiedLLMAgent fallback to environment variables"""
    with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-test-key-from-env-123456789012345678901234567890"}):
        agent = UnifiedLLMAgent(mock_node, llm_config=None)
        
        # Should have fallback config from env
        assert agent.llm_config is not None
        assert agent.llm_config.get("api_key") == "sk-test-key-from-env-123456789012345678901234567890"


def test_unified_llm_agent_fallback_config_no_env(mock_node):
    """Test UnifiedLLMAgent fallback when no env vars"""
    with patch.dict(os.environ, {}, clear=True):
        # Should raise error when no config and no env vars
        with pytest.raises(ValueError, match="No LLM configuration"):
            UnifiedLLMAgent(mock_node, llm_config=None)


def test_unified_llm_agent_no_agent_config_error(mock_node):
    """Test UnifiedLLMAgent error when agent_config is missing"""
    mock_node.agent_config = None
    mock_node.data = {}
    
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    with pytest.raises(ValueError, match="requires agent_config"):
        UnifiedLLMAgent(mock_node, llm_config=llm_config)


def test_unified_llm_agent_agent_config_from_data(mock_node):
    """Test UnifiedLLMAgent gets agent_config from node.data"""
    mock_node.agent_config = None
    mock_node.data = {
        "agent_config": {
            "model": "gpt-4",
            "temperature": 0.7
        }
    }
    
    llm_config = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(mock_node, llm_config=llm_config)
    assert agent.config is not None
    assert agent.config.model == "gpt-4"

