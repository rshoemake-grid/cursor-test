from typing import Any, Dict, List
from .base import BaseAgent
from ..models.schemas import Node
from ..utils.agent_config_utils import get_node_config

# OCP: Registry - add new loop types without editing execute()
_LOOP_EXECUTORS: Dict[str, Any] = {}


def _register_loop_executor(loop_type: str):
    """Decorator to register a loop executor."""

    def decorator(fn):
        _LOOP_EXECUTORS[loop_type] = fn
        return fn

    return decorator


class LoopAgent(BaseAgent):
    """Agent that manages loop iterations"""

    def __init__(self, node: Node, log_callback=None):
        super().__init__(node, log_callback=log_callback)

        from ..models.schemas import LoopConfig
        loop_config = get_node_config(node, "loop_config", LoopConfig)
        if not loop_config:
            print(f"⚠️  WARNING: Loop node {node.id} has no loop_config, using defaults")
            loop_config = LoopConfig(loop_type="for_each", max_iterations=0)
        self.config = loop_config
        
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize loop state and return iteration information (OCP: uses registry)."""
        self.validate_inputs(inputs)
        loop_type = self.config.loop_type
        executor = _LOOP_EXECUTORS.get(loop_type)
        if executor is None:
            raise ValueError(f"Unknown loop type: {loop_type}")
        return await executor(self, inputs)
    
@_register_loop_executor("for_each")
async def _execute_for_each(agent: "LoopAgent", inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute for-each loop"""
        # If items_source is not set, try to auto-detect from inputs
        if not agent.config.items_source:
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
            items = inputs.get(agent.config.items_source)
        
        if items is None:
            raise ValueError(f"Items source '{agent.config.items_source if agent.config.items_source else 'auto-detected'}' not found in inputs. Available keys: {list(inputs.keys())}")
        
        if not isinstance(items, (list, tuple)):
            # Try to convert to list
            if isinstance(items, str):
                # Try to parse as JSON first (could be JSON array or JSONL)
                import json
                try:
                    # Try parsing as JSON
                    parsed = json.loads(items)
                    if isinstance(parsed, list):
                        items = parsed
                    else:
                        # Single JSON object, wrap in list
                        items = [parsed]
                except (json.JSONDecodeError, ValueError):
                    # Not valid JSON, try JSONL (newline-separated JSON)
                    try:
                        lines = [line.strip() for line in items.split('\n') if line.strip()]
                        parsed_lines = []
                        for line in lines:
                            try:
                                parsed_lines.append(json.loads(line))
                            except json.JSONDecodeError:
                                pass
                        if parsed_lines:
                            items = parsed_lines
                        else:
                            # Fallback: split by comma (for simple CSV-like data)
                            items = [item.strip() for item in items.split(',') if item.strip()]
                    except:
                        # Last resort: split by comma
                        items = [item.strip() for item in items.split(',') if item.strip()]
            else:
                items = [items]
        
        # Limit iterations (if max_iterations is None or 0, process all items)
        if agent.config.max_iterations and agent.config.max_iterations > 0:
            max_items = min(len(items), agent.config.max_iterations)
            items = items[:max_items]
        
        return {
            "loop_type": "for_each",
            "items": items,
            "total_iterations": len(items),
            "current_iteration": 0,
            "status": "initialized"
        }
    


@_register_loop_executor("while")
async def _execute_while(agent: LoopAgent, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """Execute while loop - returns initial state"""
    condition = agent.config.condition or "true"
    return {
        "loop_type": "while",
        "condition": condition,
        "max_iterations": agent.config.max_iterations,
        "current_iteration": 0,
        "status": "initialized",
    }


@_register_loop_executor("until")
async def _execute_until(agent: LoopAgent, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """Execute until loop - returns initial state"""
    condition = agent.config.condition or "false"
    return {
        "loop_type": "until",
        "condition": condition,
        "max_iterations": agent.config.max_iterations,
        "current_iteration": 0,
        "status": "initialized",
    }

