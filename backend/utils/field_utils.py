"""Utilities for nested field access (dot notation)."""
from typing import Any


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
