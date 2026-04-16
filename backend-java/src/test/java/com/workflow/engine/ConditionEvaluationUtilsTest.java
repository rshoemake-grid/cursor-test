package com.workflow.engine;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ConditionEvaluationUtilsTest {

    @Test
    void equalsAndNotEquals() {
        assertTrue(ConditionEvaluationUtils.evaluate("equals", "a", "a", null));
        assertFalse(ConditionEvaluationUtils.evaluate("not_equals", "a", "a", null));
    }

    @Test
    void containsCaseInsensitive() {
        assertTrue(ConditionEvaluationUtils.evaluate("contains", "Hello World", "world", null));
        assertTrue(ConditionEvaluationUtils.evaluate("not_contains", "Hello", "world", null));
    }

    @Test
    void numericComparisons() {
        assertTrue(ConditionEvaluationUtils.evaluate("greater_than", "5", "3", null));
        assertFalse(ConditionEvaluationUtils.evaluate("less_than", "5", "3", null));
    }

    @Test
    void emptyChecks() {
        assertTrue(ConditionEvaluationUtils.evaluate("empty", null, "", null));
        assertTrue(ConditionEvaluationUtils.evaluate("is_empty", "", "", null));
        assertFalse(ConditionEvaluationUtils.evaluate("not_empty", "", "", null));
    }

    @Test
    void customThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> ConditionEvaluationUtils.evaluate("custom", "a", "b", "value > compare"));
    }

    @Test
    void unknownTypeThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> ConditionEvaluationUtils.evaluate("no_such_type", "a", "b", null));
    }
}
