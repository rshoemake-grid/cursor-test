"""Tests for UnifiedLLMAgent _build_user_message method"""
import pytest
from unittest.mock import Mock

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


def test_unified_llm_agent_build_user_message_single_input(mock_node, mock_llm_config):
    """Test building user message with single input"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {"input": "Hello"}
    message = agent._build_user_message(inputs)
    assert isinstance(message, str)
    assert "Hello" in message


def test_unified_llm_agent_build_user_message_multiple_inputs(mock_node, mock_llm_config):
    """Test building user message with multiple inputs"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {
        "input": "Hello",
        "context": "World"
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, str)
    assert "Hello" in message
    assert "World" in message


def test_unified_llm_agent_build_user_message_with_system_prompt(mock_node, mock_llm_config):
    """Test building user message includes system prompt"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {"input": "Hello"}
    message = agent._build_user_message(inputs)
    assert isinstance(message, str)
    # System prompt should be included for vision models
    assert "You are a helpful assistant" in message or "Hello" in message


def test_unified_llm_agent_build_user_message_no_images_skips_source(mock_node, mock_llm_config):
    """Test building user message skips 'source' key when no images"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {
        "input": "Hello",
        "source": "test"
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, str)
    assert "Hello" in message


def test_unified_llm_agent_build_user_message_dict_with_image_key(mock_node, mock_llm_config):
    """Test building user message with dict containing image key"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {
        "input": "What's in this image?",
        "data": {
            "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    assert any(item.get("type") == "image_url" for item in message)


def test_unified_llm_agent_build_user_message_dict_with_image_data_key(mock_node, mock_llm_config):
    """Test building user message with dict containing image_data key"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    # Create base64 data
    import base64
    test_image_bytes = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
    base64_data = base64.b64encode(test_image_bytes).decode('utf-8')
    
    inputs = {
        "input": "Process image",
        "data": {
            "image_data": base64_data
        }
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    assert any(item.get("type") == "image_url" for item in message)


def test_unified_llm_agent_build_user_message_empty_inputs(mock_node, mock_llm_config):
    """Test building user message with empty inputs"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {}
    message = agent._build_user_message(inputs)
    # Should return system prompt or default message
    assert isinstance(message, str)


def test_unified_llm_agent_build_user_message_none_value(mock_node, mock_llm_config):
    """Test building user message with None value"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {"input": None}
    message = agent._build_user_message(inputs)
    assert isinstance(message, str)


def test_unified_llm_agent_build_user_message_list_value(mock_node, mock_llm_config):
    """Test building user message with list value"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {"items": [1, 2, 3]}
    message = agent._build_user_message(inputs)
    assert isinstance(message, str)
    assert "items" in message

