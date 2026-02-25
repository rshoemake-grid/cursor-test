from typing import Dict, Type, Optional, Any, Callable, Awaitable
from .base import BaseAgent
from .unified_llm_agent import UnifiedLLMAgent
from .condition_agent import ConditionAgent
from .loop_agent import LoopAgent
from ..models.schemas import Node, NodeType
from ..utils.logger import get_logger

logger = get_logger(__name__)


class AgentRegistry:
    """Registry for agent types"""
    
    _agents: Dict[NodeType, Type[BaseAgent]] = {
        NodeType.AGENT: UnifiedLLMAgent,
        NodeType.CONDITION: ConditionAgent,
        NodeType.LOOP: LoopAgent,
    }
    
    @classmethod
    def get_agent(cls, node: Node, llm_config: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None, log_callback: Optional[Callable[[str, str, str], Awaitable[None]]] = None) -> BaseAgent:
        """Get an agent instance for a node"""
        # For AGENT nodes, check if it should be ADK or workflow agent
        if node.type == NodeType.AGENT:
            agent_config = node.agent_config
            if agent_config:
                # Convert dict to AgentConfig if needed
                if isinstance(agent_config, dict):
                    from ..models.schemas import AgentConfig
                    agent_config = AgentConfig(**agent_config)
                
                # Check agent type
                agent_type = getattr(agent_config, 'agent_type', 'workflow')
                if agent_type == 'adk':
                    # Use ADK agent
                    try:
                        from .adk_agent import ADKAgent
                        logger.info(f"Using ADK agent for node {node.id}")
                        return ADKAgent(node, llm_config=llm_config, user_id=user_id, log_callback=log_callback)
                    except ImportError:
                        logger.warning("ADK agent requested but google-adk not installed. Falling back to UnifiedLLMAgent.")
                        # Fall through to UnifiedLLMAgent
        
        # Get agent class from registry
        agent_class = cls._agents.get(node.type)
        
        if not agent_class:
            raise ValueError(f"No agent registered for node type: {node.type}")
        
        # Pass llm_config, user_id, and log_callback to UnifiedLLMAgent, others don't need it
        if node.type == NodeType.AGENT and llm_config:
            return agent_class(node, llm_config=llm_config, user_id=user_id, log_callback=log_callback)
        else:
            return agent_class(node, log_callback=log_callback)
    
    @classmethod
    def register_agent(cls, node_type: NodeType, agent_class: Type[BaseAgent]):
        """Register a custom agent type"""
        cls._agents[node_type] = agent_class

