"""ADK vs UnifiedLLM routing on the Python backend."""

from unittest.mock import MagicMock, patch

from backend.agents.registry import AgentRegistry, should_use_adk_agent
from backend.models.schemas import ADKAgentConfig, AgentConfig, Node, NodeType


def test_should_use_adk_when_agent_type_is_adk():
    cfg = AgentConfig(agent_type="adk", adk_config=ADKAgentConfig(name="n"))
    assert should_use_adk_agent(cfg) is True


def test_should_use_adk_when_adk_config_has_name_even_if_type_workflow():
    cfg = AgentConfig(
        agent_type="workflow",
        model="gemini-2.0-flash",
        adk_config=ADKAgentConfig(name="file_helper"),
    )
    assert should_use_adk_agent(cfg) is True


def test_should_not_use_adk_without_adk_bundle():
    cfg = AgentConfig(agent_type="workflow", adk_config=None)
    assert should_use_adk_agent(cfg) is False


def test_agent_config_accepts_camel_case_aliases():
    cfg = AgentConfig(
        **{
            "agentType": "adk",
            "model": "gemini-2.0-flash",
            "adkConfig": {"name": "x", "description": "d"},
        }
    )
    assert cfg.agent_type == "adk"
    assert cfg.adk_config is not None
    assert cfg.adk_config.name == "x"
    assert should_use_adk_agent(cfg) is True


@patch("backend.agents.adk_agent.ADKAgent")
def test_get_agent_instantiates_adk_when_adk_config_present(mock_adk_class):
    mock_adk_class.return_value = MagicMock(name="adk_instance")
    node = Node(
        id="agent-1",
        type=NodeType.AGENT,
        agent_config=AgentConfig(
            agent_type="workflow",
            model="gemini-2.0-flash",
            adk_config=ADKAgentConfig(name="my_adk"),
        ),
    )
    agent = AgentRegistry.get_agent(node, llm_config={"type": "gemini"}, user_id="user-1")
    mock_adk_class.assert_called_once()
    assert agent is mock_adk_class.return_value


@patch("backend.agents.adk_agent.ADKAgent")
def test_get_agent_resolves_agent_config_from_node_data(mock_adk_class):
    mock_adk_class.return_value = MagicMock(name="adk_instance")
    node = Node(
        id="agent-2",
        type=NodeType.AGENT,
        data={
            "agent_config": {
                "agent_type": "workflow",
                "model": "gemini-2.0-flash",
                "adk_config": {"name": "from_data"},
            }
        },
    )
    AgentRegistry.get_agent(node, llm_config={}, user_id="u")
    mock_adk_class.assert_called_once()

