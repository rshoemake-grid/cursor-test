from typing import Dict, Type, Optional, Any, Callable, Awaitable
from .base import BaseAgent
from .unified_llm_agent import UnifiedLLMAgent
from .condition_agent import ConditionAgent
from .loop_agent import LoopAgent
from ..models.schemas import AgentConfig, Node, NodeType
from ..utils.agent_config_utils import get_node_config
from ..utils.logger import get_logger

logger = get_logger(__name__)


def should_use_adk_agent(agent_config: AgentConfig) -> bool:
    """
    True when execution should go through ADK (InMemoryRunner), not UnifiedLLMAgent.

    Uses explicit agent_type == \"adk\", or any non-empty ADK bundle (name or yaml_config)
    so the Python backend actually runs the ADK path when the builder populated ADK fields
    but left agent_type at default \"workflow\".
    """
    if agent_config.agent_type == "adk":
        return True
    adk = agent_config.adk_config
    if adk is None:
        return False
    name = (adk.name or "").strip()
    yaml_c = (adk.yaml_config or "").strip()
    return bool(name) or bool(yaml_c)


class AgentRegistry:
    """Registry for agent types"""
    
    _agents: Dict[NodeType, Type[BaseAgent]] = {
        NodeType.AGENT: UnifiedLLMAgent,
        NodeType.CONDITION: ConditionAgent,
        NodeType.LOOP: LoopAgent,
    }
    
    @classmethod
    def get_agent(
        cls,
        node: Node,
        llm_config: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        log_callback: Optional[Callable[[str, str, str], Awaitable[None]]] = None,
        provider_resolver: Optional[Callable[[str, Optional[str]], Optional[Dict[str, Any]]]] = None,
        settings_service: Optional[Any] = None,
    ) -> BaseAgent:
        """Get an agent instance for a node"""
        # For AGENT nodes, check if it should be ADK or workflow agent
        if node.type == NodeType.AGENT:
            agent_config = get_node_config(node, "agent_config", AgentConfig)
            if agent_config and should_use_adk_agent(agent_config):
                try:
                    from .adk_agent import ADKAgent

                    logger.info("Using ADK agent for node %s", node.id)
                    return ADKAgent(
                        node,
                        llm_config=llm_config,
                        user_id=user_id,
                        log_callback=log_callback,
                        settings_service=settings_service,
                    )
                except ImportError:
                    logger.warning(
                        "ADK agent requested but google-adk not installed. Falling back to UnifiedLLMAgent."
                    )

        # Get agent class from registry
        agent_class = cls._agents.get(node.type)
        
        if not agent_class:
            raise ValueError(f"No agent registered for node type: {node.type}")
        
        if node.type == NodeType.AGENT:
            return agent_class(
                node,
                llm_config=llm_config,
                user_id=user_id,
                log_callback=log_callback,
                provider_resolver=provider_resolver,
                settings_service=settings_service,
            )
        return agent_class(node, log_callback=log_callback)
    
    @classmethod
    def register_agent(cls, node_type: NodeType, agent_class: Type[BaseAgent]):
        """Register a custom agent type"""
        cls._agents[node_type] = agent_class

