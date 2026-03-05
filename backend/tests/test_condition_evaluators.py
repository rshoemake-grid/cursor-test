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
