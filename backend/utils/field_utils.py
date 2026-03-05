"""Utilities for nested field access (dot notation)."""
import json
from typing import Any, Dict

FIELD_MAPPINGS = {
    "data": ["data", "items", "output", "value", "result"],
    "items": ["items", "data", "output"],
    "value": ["value", "data", "output", "result"],
}


def _try_parse_json(value: Any) -> Any:
    """Try to parse string as JSON. Returns original value on failure."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            pass
    return value


def resolve_condition_field_value(inputs: Dict[str, Any], field_path: str) -> Any:
    """Resolve field value for condition evaluation, with auto-detection and fallbacks.

    Handles: direct access, list-first-item, field_mappings, single-input fallback,
    and search through list/dict values.
    """
    if not field_path:
        raise ValueError("Condition config requires 'field' to be set")

    field_value = get_nested_field_value(inputs, field_path)

    # If field_value is a list and we're looking for a nested field, try first item
    if isinstance(field_value, list) and "." in field_path and len(field_value) > 0:
        first_item = _try_parse_json(field_value[0])
        parts = field_path.split(".")
        if parts[0] != "items":
            field_value = get_nested_field_value(first_item, field_path)
        elif len(parts) > 1:
            field_value = get_nested_field_value(first_item, ".".join(parts[1:]))
        # else: just 'items', use list itself

    if field_value is not None:
        return field_value

    # Auto-detect: try field_mappings
    base_field = field_path.split(".")[0]
    search_keys = FIELD_MAPPINGS.get(
        base_field, [base_field, "data", "output", "value", "result", "items"]
    )

    for key in search_keys:
        if key not in inputs:
            continue
        value = inputs[key]
        if "." in field_path:
            if isinstance(value, list) and len(value) > 0:
                first_item = _try_parse_json(value[0])
                nested_path = (
                    field_path[len(key) + 1:] if field_path.startswith(key + ".") else field_path
                )
                field_value = get_nested_field_value(first_item, nested_path)
            elif isinstance(value, dict):
                nested_path = (
                    field_path.replace(key + ".", "") if field_path.startswith(key + ".") else field_path
                )
                field_value = get_nested_field_value(value, nested_path)
            else:
                nested_path = (
                    field_path.replace(key + ".", "") if field_path.startswith(key + ".") else field_path
                )
                field_value = get_nested_field_value(value, nested_path)
        else:
            field_value = value
        if field_value is not None:
            return field_value

    # Single input fallback
    if len(inputs) == 1:
        base_value = list(inputs.values())[0]
        if "." in field_path:
            return get_nested_field_value({"value": base_value}, field_path)
        return base_value

    # Search through inputs for list/dict values
    for key, value in inputs.items():
        if isinstance(value, (list, tuple)) and len(value) > 0:
            if "." in field_path:
                first_item = _try_parse_json(value[0])
                field_value = get_nested_field_value(first_item, field_path)
            else:
                field_value = value
            if field_value is not None:
                return field_value
        elif isinstance(value, dict) and len(value) > 0:
            field_value = (
                get_nested_field_value(value, field_path) if "." in field_path else value
            )
            if field_value is not None:
                return field_value

    raise ValueError(
        f"Field '{field_path}' not found in inputs. Available keys: {list(inputs.keys())}"
    )


def get_nested_field_value(data: Any, field_path: str) -> Any:
    """Get nested field value using dot notation (e.g., 'description.value').

    Supports:
    - Top-level keys: 'field'
    - Nested object access: 'field.nested'
    - Array index access: 'items.0.value'
    - Deep nesting: 'data.items.0.description.value'
    """
    if not field_path or not data:
        return None

    parts = field_path.split(".")
    current = data

    for part in parts:
        if current is None:
            return None

        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list):
            try:
                index = int(part)
                if 0 <= index < len(current):
                    current = current[index]
                else:
                    return None
            except ValueError:
                found = False
                for item in current:
                    if isinstance(item, dict) and part in item:
                        current = item[part]
                        found = True
                        break
                if not found:
                    return None
        else:
            return None

    return current
