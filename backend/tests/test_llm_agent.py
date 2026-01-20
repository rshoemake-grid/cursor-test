"""Tests for LLMAgent"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any

from backend.agents.llm_agent import LLMAgent
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


@pytest.mark.asyncio
async def test_llm_agent_init(mock_node):
    """Test LLMAgent initialization"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        agent = LLMAgent(mock_node)
        assert agent.node_id == "test-agent-1"
        assert agent.config.model == "gpt-4"


@pytest.mark.asyncio
async def test_llm_agent_init_missing_api_key(mock_node):
    """Test LLMAgent initialization without API key"""
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            LLMAgent(mock_node)


@pytest.mark.asyncio
async def test_llm_agent_init_missing_config(mock_node):
    """Test LLMAgent initialization without agent_config"""
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent"
    )
    
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        with pytest.raises(ValueError, match="requires agent_config"):
            LLMAgent(node)


@pytest.mark.asyncio
async def test_llm_agent_execute(mock_node):
    """Test LLMAgent execution"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        agent = LLMAgent(mock_node)
        
        # Mock OpenAI client
        mock_response = AsyncMock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "Test response"
        
        agent.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await agent.execute({"input": "Hello"})
        assert result == "Test response"


@pytest.mark.asyncio
async def test_llm_agent_execute_error(mock_node):
    """Test LLMAgent error handling"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        agent = LLMAgent(mock_node)
        
        # Mock OpenAI client to raise error
        agent.client.chat.completions.create = AsyncMock(side_effect=Exception("API Error"))
        
        with pytest.raises(RuntimeError, match="LLM execution failed"):
            await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_llm_agent_build_user_message(mock_node):
    """Test building user message"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        agent = LLMAgent(mock_node)
        
        # Single input
        inputs = {"input": "Hello"}
        message = agent._build_user_message(inputs)
        assert message == "Hello"
        
        # Multiple inputs
        inputs = {"input1": "Hello", "input2": "World"}
        message = agent._build_user_message(inputs)
        assert "Hello" in message
        assert "World" in message

