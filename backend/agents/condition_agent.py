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
        
        # Get the field value to evaluate - support dot notation for nested access
        field_value = self._get_nested_field_value(inputs, self.config.field)
        
        # If field_value is a list and we're looking for a nested field, try to get it from list items
        if isinstance(field_value, list) and '.' in self.config.field:
            # Try to get the nested field from the first item in the list
            if len(field_value) > 0:
                first_item = field_value[0]
                # Parse JSON string if needed
                if isinstance(first_item, str):
                    try:
                        import json
                        first_item = json.loads(first_item)
                    except:
                        pass
                
                # Extract the nested path
                # If field is 'description.value' and we have items list, check description.value in each item
                parts = self.config.field.split('.')
                
                # If the field path doesn't start with 'items', try to access it directly on list items
                if parts[0] != 'items':
                    # The field path is relative to each item in the list
                    field_value = self._get_nested_field_value(first_item, self.config.field)
                elif len(parts) > 1:
                    # Field path starts with 'items', extract the nested path
                    nested_path = '.'.join(parts[1:])
                    field_value = self._get_nested_field_value(first_item, nested_path)
                else:
                    # Just 'items', use the list itself
                    pass
        
        if field_value is None:
            # Try to auto-detect the field if not found
            if self.config.field:
                # Try common variations and mappings
                # If looking for 'data' but loop outputs 'items', use 'items'
                field_mappings = {
                    'data': ['data', 'items', 'output', 'value', 'result'],
                    'items': ['items', 'data', 'output'],
                    'value': ['value', 'data', 'output', 'result'],
                }
                
                # Get the search order for this field (without dot notation)
                base_field = self.config.field.split('.')[0]
                search_keys = field_mappings.get(base_field, [base_field, 'data', 'output', 'value', 'result', 'items'])
                
                # Try each key in order
                for key in search_keys:
                    if key in inputs:
                        value = inputs[key]
                        # If field has dot notation, try to get nested value
                        if '.' in self.config.field:
                            # If value is a list, parse first item and access nested field
                            if isinstance(value, list) and len(value) > 0:
                                first_item = value[0]
                                # Parse JSON string if needed
                                if isinstance(first_item, str):
                                    try:
                                        import json
                                        first_item = json.loads(first_item)
                                    except:
                                        pass
                                # If field path starts with the key (e.g., 'items.description.value'), remove the key prefix
                                # Otherwise, use the field path as-is (e.g., 'description.value' is relative to each item)
                                if self.config.field.startswith(key + '.'):
                                    nested_path = self.config.field[len(key) + 1:]  # Remove 'items.' prefix
                                else:
                                    nested_path = self.config.field  # Use field path as-is
                                field_value = self._get_nested_field_value(first_item, nested_path)
                            elif isinstance(value, dict):
                                # If value is a dict, try to get nested value directly
                                nested_path = self.config.field.replace(key + '.', '') if self.config.field.startswith(key + '.') else self.config.field
                                field_value = self._get_nested_field_value(value, nested_path)
                            else:
                                # Try to get nested value directly
                                nested_path = self.config.field.replace(key + '.', '') if self.config.field.startswith(key + '.') else self.config.field
                                field_value = self._get_nested_field_value(value, nested_path)
                        else:
                            field_value = value
                        if field_value is not None:
                            break
                
                if field_value is None:
                    # If still not found and inputs has only one value, use it
                    if len(inputs) == 1:
                        base_value = list(inputs.values())[0]
                        # If field has dot notation, try to get nested value from the single input
                        if '.' in self.config.field:
                            field_value = self._get_nested_field_value({'value': base_value}, self.config.field)
                        else:
                            field_value = base_value
                    else:
                        # Try to find any list/array-like value (common for loop outputs)
                        for key, value in inputs.items():
                            if isinstance(value, (list, tuple)) and len(value) > 0:
                                # If we have a list and field has dot notation, try to access on list items
                                if '.' in self.config.field:
                                    # Parse first item if it's a JSON string
                                    first_item = value[0]
                                    if isinstance(first_item, str):
                                        try:
                                            import json
                                            first_item = json.loads(first_item)
                                        except:
                                            pass
                                    # Access the nested field on the first item
                                    field_value = self._get_nested_field_value(first_item, self.config.field)
                                    if field_value is not None:
                                        break
                                else:
                                    field_value = value
                                    if field_value is not None:
                                        break
                            elif isinstance(value, dict) and len(value) > 0:
                                # If field has dot notation, try to get nested value from dict
                                if '.' in self.config.field:
                                    field_value = self._get_nested_field_value(value, self.config.field)
                                else:
                                    field_value = value
                                if field_value is not None:
                                    break
                        
                        if field_value is None:
                            raise ValueError(
                                f"Field '{self.config.field}' not found in inputs. "
                                f"Available keys: {list(inputs.keys())}"
                            )
            else:
                raise ValueError("Condition config requires 'field' to be set")
        
        # Evaluate condition
        result = self._evaluate_condition(field_value, self.config.value)
        
        return {
            "condition_result": result,
            "branch": "true" if result else "false",
            "field_value": field_value,
            "evaluated_value": self.config.value
        }
    
    def _get_nested_field_value(self, data: Any, field_path: str) -> Any:
        """Get nested field value using dot notation (e.g., 'description.value')
        
        Supports:
        - Top-level keys: 'field'
        - Nested object access: 'field.nested'
        - Array index access: 'items.0.value'
        - Deep nesting: 'data.items.0.description.value'
        """
        if not field_path or not data:
            return None
        
        # Split the field path by dots
        parts = field_path.split('.')
        current = data
        
        for i, part in enumerate(parts):
            if current is None:
                return None
                
            if isinstance(current, dict):
                current = current.get(part)
            elif isinstance(current, list):
                # Try to access by index if part is numeric
                try:
                    index = int(part)
                    if 0 <= index < len(current):
                        current = current[index]
                    else:
                        return None
                except ValueError:
                    # Not a numeric index, try to access each item in the list
                    # Return first matching value if found
                    found = False
                    for item in current:
                        if isinstance(item, dict) and part in item:
                            current = item[part]
                            found = True
                            break
                    if not found:
                        return None
            else:
                # Can't traverse further
                return None
        
        return current
    
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
        
        elif condition_type == "is_empty":
            # Check if field is empty
            if field_value is None:
                return True
            if isinstance(field_value, (list, tuple, dict, str)):
                return len(field_value) == 0
            return False
        
        elif condition_type == "is_not_empty":
            # Check if field is not empty
            if field_value is None:
                return False
            if isinstance(field_value, (list, tuple, dict, str)):
                return len(field_value) > 0
            return True
        
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

