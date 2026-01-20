"""Tests for LLMAgentV2"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any

# Mock memory and tools before importing LLMAgentV2
import sys
mock_memory = MagicMock()
mock_tools = MagicMock()
sys.modules['backend.memory'] = MagicMock(MemoryManager=mock_memory)
sys.modules['backend.tools'] = MagicMock(ToolRegistry=mock_tools)

from backend.agents.llm_agent_v2 import LLMAgentV2
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
async def test_llm_agent_v2_init(mock_node):
    """Test LLMAgentV2 initialization"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        agent = LLMAgentV2(mock_node, use_memory=False, use_tools=False)
        assert agent.node_id == "test-agent-1"
        assert agent.config.model == "gpt-4"


@pytest.mark.asyncio
async def test_llm_agent_v2_init_missing_api_key(mock_node):
    """Test LLMAgentV2 initialization without API key"""
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            LLMAgentV2(mock_node)


@pytest.mark.asyncio
async def test_llm_agent_v2_init_missing_config(mock_node):
    """Test LLMAgentV2 initialization without agent_config"""
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent"
    )
    
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        with pytest.raises(ValueError, match="requires agent_config"):
            LLMAgentV2(node)


@pytest.mark.asyncio
async def test_llm_agent_v2_execute(mock_node):
    """Test LLMAgentV2 execution"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        agent = LLMAgentV2(mock_node, use_memory=False, use_tools=False)
        
        # Mock OpenAI client
        mock_response = AsyncMock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "Test response"
        mock_response.choices[0].message.tool_calls = None
        
        agent.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await agent.execute({"input": "Hello"})
        assert result == "Test response"


@pytest.mark.asyncio
async def test_llm_agent_v2_execute_with_tools(mock_node):
    """Test LLMAgentV2 execution with tools"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        config = AgentConfig(
            model="gpt-4",
            temperature=0.7,
            tools=["test_tool"]
        )
        node = Node(
            id="test-agent-1",
            type=NodeType.AGENT,
            name="Test Agent",
            agent_config=config
        )
        
        agent = LLMAgentV2(node, use_memory=False, use_tools=True)
        
        # Mock OpenAI client
        mock_response = AsyncMock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "Final response"
        mock_response.choices[0].message.tool_calls = None
        
        agent.client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await agent.execute({"input": "Hello"})
        assert result == "Final response"


@pytest.mark.asyncio
async def test_llm_agent_v2_build_user_message(mock_node):
    """Test building user message"""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        agent = LLMAgentV2(mock_node)
        
        # Single input
        inputs = {"input": "Hello"}
        message = agent._build_user_message(inputs)
        assert message == "Hello"
        
        # Multiple inputs
        inputs = {"input1": "Hello", "input2": "World"}
        message = agent._build_user_message(inputs)
        assert "Hello" in message
        assert "World" in message

