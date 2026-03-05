from typing import Any, Dict
from .base import BaseAgent
from ..models.schemas import Node
from ..utils.agent_config_utils import get_node_config
from ..utils.condition_evaluators import evaluate_condition
from ..utils.field_utils import resolve_condition_field_value


class ConditionAgent(BaseAgent):
    """Agent that evaluates conditions and returns branch information"""

    def __init__(self, node: Node, log_callback=None):
        super().__init__(node, log_callback=log_callback)

        from ..models.schemas import ConditionConfig
        condition_config = get_node_config(node, "condition_config", ConditionConfig)
        if not condition_config:
            raise ValueError(f"Node {node.id} requires condition_config. Please configure the condition settings in the node properties.")

        self.config = condition_config
        
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate the condition and return branch information"""
        
        # Validate that condition config has required fields
        if not self.config.field:
            raise ValueError(
                f"Condition node {self.node.id} requires 'field' to be set in condition_config. "
                f"Please configure the condition field in the node properties."
            )
        self.validate_inputs(inputs)

        field_value = resolve_condition_field_value(inputs, self.config.field)

        # Evaluate condition (OCP: uses registry)
        result = evaluate_condition(
            self.config.condition_type,
            field_value,
            self.config.value or "",
            getattr(self.config, "custom_expression", None),
        )
        
        return {
            "condition_result": result,
            "branch": "true" if result else "false",
            "field_value": field_value,
            "evaluated_value": self.config.value
        }

