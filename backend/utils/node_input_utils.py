"""
Node input preparation - DRY shared logic for executors.
Extracts _prepare_node_inputs from executor_v3, executor_v2, executor.
"""
from typing import Any, Dict, Optional

from ..models.schemas import Node


def prepare_node_inputs(
    node: Node,
    node_states: Dict[str, Any],
    variables: Dict[str, Any],
    *,
    strict_variables: bool = True,
) -> Dict[str, Any]:
    """
    Prepare inputs for a node from previous nodes or workflow variables.

    Args:
        node: Node with inputs (InputMapping list)
        node_states: Map of node_id -> NodeState (with output)
        variables: Workflow variables
        strict_variables: If True, raise when variable not found. If False, skip (for fallback logic).

    Returns:
        Dict of input name -> value

    Raises:
        ValueError: When required input is not available (and strict_variables=True)
    """
    inputs: Dict[str, Any] = {}

    for input_mapping in node.inputs or []:
        if input_mapping.source_node:
            source_state = node_states.get(input_mapping.source_node)
            if source_state and source_state.output is not None:
                if isinstance(source_state.output, dict):
                    inputs[input_mapping.name] = source_state.output.get(
                        input_mapping.source_field,
                        source_state.output,
                    )
                else:
                    inputs[input_mapping.name] = source_state.output
            else:
                raise ValueError(
                    f"Node {node.id} requires input '{input_mapping.name}' "
                    f"from node '{input_mapping.source_node}' but it's not available"
                )
        else:
            if input_mapping.source_field in variables:
                inputs[input_mapping.name] = variables[input_mapping.source_field]
            elif strict_variables:
                raise ValueError(
                    f"Node {node.id} requires input '{input_mapping.name}' "
                    f"from workflow variable '{input_mapping.source_field}' but it's not available"
                )
            # else: pass (allow fallback to previous node output)

    return inputs


def wrap_previous_output_to_inputs(previous_node_output: Any) -> Dict[str, Any]:
    """
    Wrap previous node output into node_inputs dict format (DRY).
    Handles dict, base64 image strings, and single values.
    """
    if previous_node_output is None:
        return {}
    if isinstance(previous_node_output, dict):
        return previous_node_output
    if isinstance(previous_node_output, str) and previous_node_output.startswith("data:image/"):
        return {
            "data": previous_node_output,
            "output": previous_node_output,
            "image": previous_node_output,
        }
    return {"data": previous_node_output, "output": previous_node_output}


def _has_content(value: Any) -> bool:
    """Check if value has actual content (non-empty, or base64 image)."""
    if value is None or value == "" or value == {}:
        return False
    if isinstance(value, str) and value.startswith("data:image/"):
        return True
    return True


def extract_data_to_write(node_inputs: Any) -> Optional[Any]:
    """
    Extract data to write from node_inputs for storage write nodes (DRY).
    Handles wrapped read output, single values, multiple values, images.
    """
    if not node_inputs:
        return None

    if isinstance(node_inputs, dict):
        if not any(_has_content(v) for v in node_inputs.values()):
            return None
    elif not _has_content(node_inputs):
        return None

    if isinstance(node_inputs, dict) and "data" in node_inputs:
        if len(node_inputs) == 2 and "source" in node_inputs:
            return node_inputs["data"]
        if len(node_inputs) == 1:
            return node_inputs["data"]
        if node_inputs["data"] not in (None, "", {}):
            return node_inputs["data"]
        filtered = {k: v for k, v in node_inputs.items() if _has_content(v)}
        return filtered if filtered else None

    if isinstance(node_inputs, dict):
        input_values = [v for v in node_inputs.values() if _has_content(v)]
        if len(input_values) == 1:
            return input_values[0]
        if len(input_values) > 1:
            image_val = next(
                (v for v in input_values if isinstance(v, str) and v.startswith("data:image/")),
                None,
            )
            if image_val:
                return image_val
            return {k: v for k, v in node_inputs.items() if _has_content(v)}
        return None

    return node_inputs


def get_previous_node_output(
    node: Node,
    edges: list,
    node_states: Dict[str, Any],
) -> Optional[Any]:
    """
    Get output from the previous node in the execution graph.

    Args:
        node: Current node
        edges: List of Edge objects (source, target)
        node_states: Map of node_id -> NodeState

    Returns:
        Previous node output or None
    """
    incoming = [e for e in edges if e.target == node.id]
    if not incoming:
        return None
    source_id = incoming[0].source
    source_state = node_states.get(source_id)
    if source_state and source_state.output is not None:
        return source_state.output
    return None
