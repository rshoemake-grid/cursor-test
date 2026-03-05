"""Utilities for config resolution (variable substitution)."""
import re
from typing import Any, Dict


def resolve_config_variables(config: Dict[str, Any], variables: Dict[str, Any]) -> Dict[str, Any]:
    """Resolve variable references in config (e.g., ${variable_name})."""
    resolved_config = {}

    for key, value in config.items():
        if value is None or (isinstance(value, str) and (not value or value.strip() == "")):
            if key in variables:
                resolved_value = variables[key]
                if resolved_value == {}:
                    resolved_config[key] = value if value is not None else ""
                else:
                    resolved_config[key] = str(resolved_value) if resolved_value is not None else ""
            else:
                resolved_config[key] = value if value is not None else ""
        elif isinstance(value, str):
            pattern = r"\$\{([^}]+)\}"
            matches = re.findall(pattern, value)

            if matches:
                resolved_value = value
                for var_name in matches:
                    if var_name in variables:
                        var_value = str(variables[var_name])
                        resolved_value = resolved_value.replace(f"${{{var_name}}}", var_value)
                resolved_config[key] = resolved_value
            else:
                resolved_config[key] = value
        else:
            resolved_config[key] = value

    return resolved_config
