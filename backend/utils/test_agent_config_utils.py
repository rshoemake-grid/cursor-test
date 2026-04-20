"""Tests for get_node_config (empty dict → defaults for AgentConfig / LoopConfig)."""

from backend.models.schemas import AgentConfig, ConditionConfig, LoopConfig, Node, NodeType
from backend.utils.agent_config_utils import get_node_config


def test_empty_agent_config_dict_returns_defaults():
    node = Node(
        id="a1",
        type=NodeType.AGENT,
        data={"label": "Agent", "agent_config": {}},
    )
    cfg = get_node_config(node, "agent_config", AgentConfig)
    assert isinstance(cfg, AgentConfig)
    assert cfg.model == "gpt-4o-mini"
    assert cfg.agent_type == "workflow"


def test_empty_loop_config_dict_returns_defaults():
    node = Node(
        id="l1",
        type=NodeType.LOOP,
        data={"loop_config": {}},
    )
    cfg = get_node_config(node, "loop_config", LoopConfig)
    assert isinstance(cfg, LoopConfig)
    assert cfg.loop_type == "for_each"


def test_empty_condition_config_returns_none():
    node = Node(
        id="c1",
        type=NodeType.CONDITION,
        data={"condition_config": {}},
    )
    cfg = get_node_config(node, "condition_config", ConditionConfig)
    assert cfg is None


def test_missing_agent_config_returns_none():
    node = Node(id="a2", type=NodeType.AGENT, data={"label": "x"})
    assert get_node_config(node, "agent_config", AgentConfig) is None
