from typing import Any, Dict, List
from .base import BaseAgent
from ..models.schemas import Node


class LoopAgent(BaseAgent):
    """Agent that manages loop iterations"""
    
    def __init__(self, node: Node):
        super().__init__(node)
        
        if not node.loop_config:
            raise ValueError(f"Node {node.id} requires loop_config")
        
        self.config = node.loop_config
        
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize loop state and return iteration information"""
        self.validate_inputs(inputs)
        
        loop_type = self.config.loop_type
        
        if loop_type == "for_each":
            return await self._execute_for_each(inputs)
        elif loop_type == "while":
            return await self._execute_while(inputs)
        elif loop_type == "until":
            return await self._execute_until(inputs)
        else:
            raise ValueError(f"Unknown loop type: {loop_type}")
    
    async def _execute_for_each(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute for-each loop"""
        # If items_source is not set, try to auto-detect from inputs
        if not self.config.items_source:
            # Try common keys first
            for key in ['data', 'output', 'items', 'results']:
                if key in inputs:
                    items = inputs[key]
                    break
            else:
                # Use the first input value if available
                if inputs:
                    items = list(inputs.values())[0]
                else:
                    raise ValueError("for_each loop requires items_source or inputs from previous node")
        else:
            items = inputs.get(self.config.items_source)
        
        if items is None:
            raise ValueError(f"Items source '{self.config.items_source if self.config.items_source else 'auto-detected'}' not found in inputs. Available keys: {list(inputs.keys())}")
        
        if not isinstance(items, (list, tuple)):
            # Try to convert to list
            if isinstance(items, str):
                items = items.split(',')
            else:
                items = [items]
        
        # Limit iterations
        max_items = min(len(items), self.config.max_iterations)
        items = items[:max_items]
        
        return {
            "loop_type": "for_each",
            "items": items,
            "total_iterations": len(items),
            "current_iteration": 0,
            "status": "initialized"
        }
    
    async def _execute_while(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute while loop - returns initial state"""
        condition = self.config.condition or "true"
        
        return {
            "loop_type": "while",
            "condition": condition,
            "max_iterations": self.config.max_iterations,
            "current_iteration": 0,
            "status": "initialized"
        }
    
    async def _execute_until(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute until loop - returns initial state"""
        condition = self.config.condition or "false"
        
        return {
            "loop_type": "until",
            "condition": condition,
            "max_iterations": self.config.max_iterations,
            "current_iteration": 0,
            "status": "initialized"
        }

