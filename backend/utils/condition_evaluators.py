"""
Condition evaluators - OCP: registry for condition types.
New condition types can be added by registering without editing ConditionAgent.
"""
from typing import Any, Callable, Dict

# Type: (field_value, compare_value) -> bool
ConditionEvaluator = Callable[[Any, str], bool]


def _compare_numeric(
    field_value: Any,
    compare_value: str,
    op: Callable[[float, float], bool],
) -> bool:
    """DRY helper for numeric comparisons."""
    try:
        return op(float(field_value), float(compare_value))
    except (ValueError, TypeError):
        return False


def _eval_equals(field_value: Any, compare_value: str) -> bool:
    return str(field_value) == compare_value


def _eval_not_equals(field_value: Any, compare_value: str) -> bool:
    return str(field_value) != compare_value


def _eval_contains(field_value: Any, compare_value: str) -> bool:
    return compare_value.lower() in str(field_value).lower()


def _eval_not_contains(field_value: Any, compare_value: str) -> bool:
    return compare_value.lower() not in str(field_value).lower()


def _eval_greater_than(field_value: Any, compare_value: str) -> bool:
    return _compare_numeric(field_value, compare_value, lambda a, b: a > b)


def _eval_not_greater_than(field_value: Any, compare_value: str) -> bool:
    return _compare_numeric(field_value, compare_value, lambda a, b: a <= b)


def _eval_less_than(field_value: Any, compare_value: str) -> bool:
    return _compare_numeric(field_value, compare_value, lambda a, b: a < b)


def _eval_not_less_than(field_value: Any, compare_value: str) -> bool:
    return _compare_numeric(field_value, compare_value, lambda a, b: a >= b)


def _eval_empty(field_value: Any, compare_value: str) -> bool:
    if field_value is None:
        return True
    if isinstance(field_value, (list, tuple, dict, str)):
        return len(field_value) == 0
    return False


def _eval_not_empty(field_value: Any, compare_value: str) -> bool:
    if field_value is None:
        return False
    if isinstance(field_value, (list, tuple, dict, str)):
        return len(field_value) > 0
    return True


# OCP: Registry - add new types without editing callers
CONDITION_EVALUATORS: Dict[str, ConditionEvaluator] = {
    "equals": _eval_equals,
    "not_equals": _eval_not_equals,
    "contains": _eval_contains,
    "not_contains": _eval_not_contains,
    "greater_than": _eval_greater_than,
    "not_greater_than": _eval_not_greater_than,
    "less_than": _eval_less_than,
    "not_less_than": _eval_not_less_than,
    "empty": _eval_empty,
    "is_empty": _eval_empty,
    "not_empty": _eval_not_empty,
    "is_not_empty": _eval_not_empty,
}


def evaluate_condition(
    condition_type: str,
    field_value: Any,
    compare_value: str,
    custom_expression: str = None,
) -> bool:
    """
    Evaluate condition using registry (OCP).

    Args:
        condition_type: Type of condition (equals, contains, etc.)
        field_value: Value from the field
        compare_value: Value to compare against
        custom_expression: For "custom" type, the expression to eval

    Returns:
        True if condition passes, False otherwise

    Raises:
        ValueError: Unknown condition type
        RuntimeError: Custom expression eval error
    """
    evaluator = CONDITION_EVALUATORS.get(condition_type)
    if evaluator is not None:
        return evaluator(field_value, compare_value)

    if condition_type == "custom" and custom_expression:
        try:
            safe_dict = {
                "value": field_value,
                "compare": compare_value,
                "str": str,
                "int": int,
                "float": float,
                "len": len,
            }
            return bool(eval(custom_expression, {"__builtins__": {}}, safe_dict))
        except Exception as e:
            raise RuntimeError(f"Error evaluating custom expression: {str(e)}")

    raise ValueError(f"Unknown condition type: {condition_type}")
