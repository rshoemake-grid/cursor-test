"""Unit tests for backend.utils.agent_config_utils."""
import pytest
from unittest.mock import Mock

from backend.utils.agent_config_utils import get_node_config
from backend.models.schemas import AgentConfig, ConditionConfig, LoopConfig


class TestGetNodeConfig:
    def test_returns_top_level_agent_config(self):
        config = AgentConfig(model="gpt-4")
        node = Mock(agent_config=config, data=None)
        assert get_node_config(node, "agent_config") is config

    def test_returns_from_data_when_top_level_missing(self):
        config_dict = {"model": "gpt-4", "temperature": 0.7}
        node = Mock(spec=["agent_config", "data"])
        node.agent_config = None
        node.data = {"agent_config": config_dict}
        result = get_node_config(node, "agent_config", AgentConfig)
        assert result is not None
        assert result.model == "gpt-4"

    def test_converts_dict_to_config_class(self):
        config_dict = {"field": "status", "condition_type": "equals"}
        node = Mock(condition_config=config_dict, data=None)
        result = get_node_config(node, "condition_config", ConditionConfig)
        assert isinstance(result, ConditionConfig)
        assert result.field == "status"

    def test_returns_none_when_not_found(self):
        node = Mock(agent_config=None, data={})
        assert get_node_config(node, "agent_config") is None
