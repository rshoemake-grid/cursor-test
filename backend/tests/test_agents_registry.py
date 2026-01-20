"""
Tests for AgentRegistry class.
"""
import pytest
from backend.agents.registry import AgentRegistry
from backend.agents.base import BaseAgent
from backend.models.schemas import Node, NodeType, AgentConfig


@pytest.fixture
def agent_node():
    """Create an agent node"""
    return Node(
        id="agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        position={"x": 0, "y": 0},
        agent_config=AgentConfig(
            model="gpt-4",
            temperature=0.7,
            system_prompt="You are a helpful assistant"
        )
    )


@pytest.fixture
def condition_node():
    """Create a condition node"""
    from backend.models.schemas import ConditionConfig
    return Node(
        id="condition-1",
        type=NodeType.CONDITION,
        name="Test Condition",
        position={"x": 0, "y": 0},
        condition_config=ConditionConfig(
            field="status",
            condition_type="equals",
            value="active"
        )
    )


@pytest.fixture
def loop_node():
    """Create a loop node"""
    from backend.models.schemas import LoopConfig
    return Node(
        id="loop-1",
        type=NodeType.LOOP,
        name="Test Loop",
        position={"x": 0, "y": 0},
        loop_config=LoopConfig(
            loop_type="for_each",
            max_iterations=10
        )
    )


@pytest.mark.asyncio
async def test_agent_registry_get_agent(agent_node):
    """Test getting an agent for a node"""
    llm_config = {
        "type": "openai",
        "api_key": "test-key",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = AgentRegistry.get_agent(
        agent_node,
        llm_config=llm_config,
        user_id="test-user"
    )
    
    assert agent is not None
    assert agent.node_id == "agent-1"
    assert hasattr(agent, 'llm_config')


@pytest.mark.asyncio
async def test_agent_registry_get_condition_agent(condition_node):
    """Test getting a condition agent"""
    agent = AgentRegistry.get_agent(condition_node)
    
    assert agent is not None
    assert agent.node_id == "condition-1"
    assert hasattr(agent, 'config')


@pytest.mark.asyncio
async def test_agent_registry_get_loop_agent(loop_node):
    """Test getting a loop agent"""
    agent = AgentRegistry.get_agent(loop_node)
    
    assert agent is not None
    assert agent.node_id == "loop-1"
    assert hasattr(agent, 'config')


@pytest.mark.asyncio
async def test_agent_registry_unknown_node_type():
    """Test that unknown node type raises error"""
    unknown_node = Node(
        id="unknown-1",
        type=NodeType.START,  # START nodes don't have agents
        name="Start",
        position={"x": 0, "y": 0}
    )
    
    with pytest.raises(ValueError) as exc_info:
        AgentRegistry.get_agent(unknown_node)
    
    assert "No agent registered for node type" in str(exc_info.value)


@pytest.mark.asyncio
async def test_agent_registry_register_custom_agent():
    """Test registering a custom agent type"""
    from backend.agents.base import BaseAgent
    
    class CustomAgent(BaseAgent):
        async def execute(self, inputs):
            return {"custom": True}
    
    # Register custom agent
    AgentRegistry.register_agent(NodeType.START, CustomAgent)
    
    # Get the custom agent
    node = Node(
        id="custom-1",
        type=NodeType.START,
        name="Custom",
        position={"x": 0, "y": 0}
    )
    
    agent = AgentRegistry.get_agent(node)
    assert isinstance(agent, CustomAgent)
    
    # Cleanup: restore original registry
    # Note: In production, you'd want to save/restore the original state


@pytest.mark.asyncio
async def test_agent_registry_llm_config_passed_to_unified_agent(agent_node):
    """Test that LLM config is passed to UnifiedLLMAgent"""
    llm_config = {
        "type": "openai",
        "api_key": "test-key",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = AgentRegistry.get_agent(
        agent_node,
        llm_config=llm_config,
        user_id="test-user"
    )
    
    # UnifiedLLMAgent should have llm_config attribute
    assert hasattr(agent, 'llm_config')
    assert agent.llm_config == llm_config


@pytest.mark.asyncio
async def test_agent_registry_log_callback_passed(condition_node):
    """Test that log callback is passed to agents"""
    callback_called = []
    
    async def log_callback(level, node_id, message):
        callback_called.append((level, node_id, message))
    
    agent = AgentRegistry.get_agent(condition_node, log_callback=log_callback)
    
    assert agent.log_callback is not None
    await agent.log_callback("INFO", "test", "message")
    assert len(callback_called) == 1

