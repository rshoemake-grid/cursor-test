from typing import Dict, Type
from .base import BaseAgent
from .llm_agent import LLMAgent
from .condition_agent import ConditionAgent
from .loop_agent import LoopAgent
from ..models.schemas import Node, NodeType


class AgentRegistry:
    """Registry for agent types"""
    
    _agents: Dict[NodeType, Type[BaseAgent]] = {
        NodeType.AGENT: LLMAgent,
        NodeType.CONDITION: ConditionAgent,
        NodeType.LOOP: LoopAgent,
    }
    
    @classmethod
    def get_agent(cls, node: Node) -> BaseAgent:
        """Get an agent instance for a node"""
        agent_class = cls._agents.get(node.type)
        
        if not agent_class:
            raise ValueError(f"No agent registered for node type: {node.type}")
        
        return agent_class(node)
    
    @classmethod
    def register_agent(cls, node_type: NodeType, agent_class: Type[BaseAgent]):
        """Register a custom agent type"""
        cls._agents[node_type] = agent_class

