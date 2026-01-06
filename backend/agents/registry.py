from typing import Dict, Type, Optional, Any
from .base import BaseAgent
from .unified_llm_agent import UnifiedLLMAgent
from .condition_agent import ConditionAgent
from .loop_agent import LoopAgent
from ..models.schemas import Node, NodeType


class AgentRegistry:
    """Registry for agent types"""
    
    _agents: Dict[NodeType, Type[BaseAgent]] = {
        NodeType.AGENT: UnifiedLLMAgent,
        NodeType.CONDITION: ConditionAgent,
        NodeType.LOOP: LoopAgent,
    }
    
    @classmethod
    def get_agent(cls, node: Node, llm_config: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None) -> BaseAgent:
        """Get an agent instance for a node"""
        agent_class = cls._agents.get(node.type)
        
        if not agent_class:
            raise ValueError(f"No agent registered for node type: {node.type}")
        
        # Pass llm_config and user_id to UnifiedLLMAgent, others don't need it
        if node.type == NodeType.AGENT and llm_config:
            return agent_class(node, llm_config=llm_config, user_id=user_id)
        else:
            return agent_class(node)
    
    @classmethod
    def register_agent(cls, node_type: NodeType, agent_class: Type[BaseAgent]):
        """Register a custom agent type"""
        cls._agents[node_type] = agent_class

