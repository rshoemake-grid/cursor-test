"""
Condition evaluators - OCP: registry for condition types.
New condition types can be added by registering without editing ConditionAgent.
Custom expressions use AST-based safe evaluation (no eval on user input).
"""
import ast
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


_ALLOWED_NAMES = frozenset({"value", "compare", "str", "int", "float", "len"})
_ALLOWED_CALLS = frozenset({"str", "int", "float", "len"})


def _validate_ast_safe(node: ast.AST) -> None:
    """Ensure AST only contains safe operations. Raises ValueError if unsafe."""
    if isinstance(node, ast.Expression):
        _validate_ast_safe(node.body)
    elif isinstance(node, ast.Compare):
        _validate_ast_safe(node.left)
        for c in node.comparators:
            _validate_ast_safe(c)
    elif isinstance(node, ast.BoolOp):
        for v in node.values:
            _validate_ast_safe(v)
    elif isinstance(node, ast.BinOp):
        if type(node.op) not in (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod, ast.FloorDiv):
            raise ValueError("Unsupported operator")
        _validate_ast_safe(node.left)
        _validate_ast_safe(node.right)
    elif isinstance(node, ast.UnaryOp):
        if type(node.op) not in (ast.USub, ast.UAdd, ast.Not):
            raise ValueError("Unsupported unary operator")
        _validate_ast_safe(node.operand)
    elif isinstance(node, ast.Call):
        if not isinstance(node.func, ast.Name):
            raise ValueError("Only simple function calls allowed")
        if node.func.id not in _ALLOWED_CALLS:
            raise ValueError(f"Function '{node.func.id}' not allowed")
        for arg in node.args:
            _validate_ast_safe(arg)
    elif isinstance(node, ast.Name):
        if node.id not in _ALLOWED_NAMES:
            raise ValueError(f"Variable '{node.id}' not allowed")
    elif isinstance(node, (ast.Constant, ast.Num, ast.Str)):
        pass
    elif isinstance(node, ast.Subscript):
        _validate_ast_safe(node.value)
        if isinstance(node.slice, ast.AST):
            _validate_ast_safe(node.slice)
    elif isinstance(node, ast.Attribute):
        _validate_ast_safe(node.value)
    elif isinstance(node, ast.Index):
        _validate_ast_safe(node.value)
    else:
        raise ValueError(f"Unsupported expression type: {type(node).__name__}")


def _safe_eval_custom(expr: str, field_value: Any, compare_value: str) -> bool:
    """Safely evaluate custom condition expression using AST validation (no eval on raw string)."""
    safe_dict = {
        "value": field_value,
        "compare": compare_value,
        "str": str,
        "int": int,
        "float": float,
        "len": len,
    }
    tree = ast.parse(expr.strip(), mode="eval")
    _validate_ast_safe(tree)
    return bool(eval(compile(tree, "<custom_condition>", "eval"), {"__builtins__": {}}, safe_dict))


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
            return _safe_eval_custom(custom_expression, field_value, compare_value)
        except Exception as e:
            raise RuntimeError(f"Error evaluating custom expression: {str(e)}")

    raise ValueError(f"Unknown condition type: {condition_type}")
