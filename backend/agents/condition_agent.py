from typing import Any, Dict
from .base import BaseAgent
from ..models.schemas import Node


class ConditionAgent(BaseAgent):
    """Agent that evaluates conditions and returns branch information"""
    
    def __init__(self, node: Node):
        super().__init__(node)
        
        if not node.condition_config:
            raise ValueError(f"Node {node.id} requires condition_config")
        
        self.config = node.condition_config
        
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate the condition and return branch information"""
        self.validate_inputs(inputs)
        
        # Get the field value to evaluate
        field_value = inputs.get(self.config.field)
        
        if field_value is None:
            raise ValueError(f"Field '{self.config.field}' not found in inputs")
        
        # Evaluate condition
        result = self._evaluate_condition(field_value, self.config.value)
        
        return {
            "condition_result": result,
            "branch": "true" if result else "false",
            "field_value": field_value,
            "evaluated_value": self.config.value
        }
    
    def _evaluate_condition(self, field_value: Any, compare_value: str) -> bool:
        """Evaluate the condition based on type"""
        condition_type = self.config.condition_type
        
        # Convert values to string for comparison
        field_str = str(field_value)
        
        if condition_type == "equals":
            return field_str == compare_value
        
        elif condition_type == "contains":
            return compare_value.lower() in field_str.lower()
        
        elif condition_type == "greater_than":
            try:
                return float(field_value) > float(compare_value)
            except (ValueError, TypeError):
                return False
        
        elif condition_type == "less_than":
            try:
                return float(field_value) < float(compare_value)
            except (ValueError, TypeError):
                return False
        
        elif condition_type == "custom" and self.config.custom_expression:
            # For custom expressions, use eval (in production, use safer alternatives)
            try:
                # Create safe namespace with limited functions
                safe_dict = {
                    "value": field_value,
                    "compare": compare_value,
                    "str": str,
                    "int": int,
                    "float": float,
                    "len": len,
                }
                return bool(eval(self.config.custom_expression, {"__builtins__": {}}, safe_dict))
            except Exception as e:
                raise RuntimeError(f"Error evaluating custom expression: {str(e)}")
        
        else:
            raise ValueError(f"Unknown condition type: {condition_type}")

