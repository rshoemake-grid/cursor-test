"""Tests for condition_evaluators module (OCP registry)."""
import pytest

from backend.utils.condition_evaluators import evaluate_condition, CONDITION_EVALUATORS


class TestEvaluateCondition:
    def test_equals_true(self):
        assert evaluate_condition("equals", "a", "a") is True

    def test_equals_false(self):
        assert evaluate_condition("equals", "a", "b") is False

    def test_greater_than_true(self):
        assert evaluate_condition("greater_than", 5, 3) is True

    def test_empty_none(self):
        assert evaluate_condition("empty", None, "") is True

    def test_unknown_type_raises(self):
        with pytest.raises(ValueError, match="Unknown condition type"):
            evaluate_condition("unknown", "a", "b")
class TestCustomExpressionSafeEvaluator:
    """T-3: Verify safe evaluator rejects malicious/unsafe expressions."""

    def test_custom_valid_expression(self):
        """Valid safe expression works."""
        assert evaluate_condition("custom", "hello", "hello", custom_expression="value == compare") is True
        assert evaluate_condition("custom", 10, 5, custom_expression="value > int(compare)") is True
        assert evaluate_condition("custom", "abc", "", custom_expression="len(value) > 2") is True

    def test_custom_rejects_import(self):
        """Malicious __import__ is rejected."""
        with pytest.raises((ValueError, RuntimeError), match="Unsupported|Error evaluating"):
            evaluate_condition("custom", "x", "y", custom_expression="__import__('os').system('id')")

    def test_custom_rejects_open(self):
        """open() is not in allowed calls."""
        with pytest.raises((ValueError, RuntimeError), match="Unsupported|not allowed|Error evaluating"):
            evaluate_condition("custom", "x", "y", custom_expression="open('/etc/passwd')")

    def test_custom_rejects_exec(self):
        """exec/eval builtins are rejected."""
        with pytest.raises((ValueError, RuntimeError), match="Unsupported|not allowed|Error evaluating"):
            evaluate_condition("custom", "x", "y", custom_expression="exec('1')")

    def test_custom_rejects_forbidden_names(self):
        """Only value, compare, str, int, float, len allowed."""
        with pytest.raises((ValueError, RuntimeError), match="not allowed|Unsupported|Error evaluating"):
            evaluate_condition("custom", "x", "y", custom_expression="os.path.exists('/')")

