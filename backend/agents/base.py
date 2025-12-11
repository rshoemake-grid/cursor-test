from abc import ABC, abstractmethod
from typing import Any, Dict
from ..models.schemas import Node


class BaseAgent(ABC):
    """Base class for all agents"""
    
    def __init__(self, node: Node):
        self.node = node
        self.node_id = node.id
        self.name = node.name
        
    @abstractmethod
    async def execute(self, inputs: Dict[str, Any]) -> Any:
        """
        Execute the agent with given inputs
        
        Args:
            inputs: Dictionary of input values
            
        Returns:
            The agent's output
        """
        pass
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> bool:
        """Validate that required inputs are present"""
        for input_mapping in self.node.inputs:
            if input_mapping.name not in inputs:
                raise ValueError(f"Missing required input: {input_mapping.name}")
        return True

