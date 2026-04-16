package com.workflow.engine;

import com.workflow.util.ObjectUtils;

import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.BiPredicate;

/**
 * Condition type evaluation — mirrors Python {@code condition_evaluators.evaluate_condition} (standard types).
 * Custom expressions are not supported in Java yet; use conditionType "custom" only after future safe-eval port.
 */
public final class ConditionEvaluationUtils {

    private ConditionEvaluationUtils() {
    }

    public static boolean evaluate(String conditionType, Object fieldValue, String compareValue, String customExpression) {
        String type = conditionType == null || conditionType.isBlank() ? "equals" : conditionType.trim().toLowerCase(Locale.ROOT);
        BiPredicate<Object, String> fn = REGISTRY.get(type);
        if (fn != null) {
            return fn.test(fieldValue, ObjectUtils.orDefault(compareValue, ""));
        }
        if ("custom".equals(type) && customExpression != null && !customExpression.isBlank()) {
            throw new IllegalArgumentException(
                    "Custom condition expressions are not supported in the Java backend yet. Use standard condition types.");
        }
        throw new IllegalArgumentException("Unknown condition type: " + type);
    }

    private static boolean eq(Object fieldValue, String compareValue) {
        return Objects.equals(String.valueOf(fieldValue), compareValue);
    }

    private static boolean numericCompare(Object fieldValue, String compareValue, java.util.function.BiPredicate<Double, Double> op) {
        try {
            return op.test(Double.parseDouble(String.valueOf(fieldValue)), Double.parseDouble(compareValue));
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static final Map<String, BiPredicate<Object, String>> REGISTRY = Map.ofEntries(
            Map.entry("equals", ConditionEvaluationUtils::eq),
            Map.entry("not_equals", (f, c) -> !eq(f, c)),
            Map.entry("contains", (f, c) -> String.valueOf(f).toLowerCase(Locale.ROOT).contains(c.toLowerCase(Locale.ROOT))),
            Map.entry("not_contains", (f, c) -> !String.valueOf(f).toLowerCase(Locale.ROOT).contains(c.toLowerCase(Locale.ROOT))),
            Map.entry("greater_than", (f, c) -> numericCompare(f, c, (a, b) -> a > b)),
            Map.entry("not_greater_than", (f, c) -> numericCompare(f, c, (a, b) -> a <= b)),
            Map.entry("less_than", (f, c) -> numericCompare(f, c, (a, b) -> a < b)),
            Map.entry("not_less_than", (f, c) -> numericCompare(f, c, (a, b) -> a >= b)),
            Map.entry("empty", ConditionEvaluationUtils::isEmpty),
            Map.entry("is_empty", ConditionEvaluationUtils::isEmpty),
            Map.entry("not_empty", (f, c) -> !isEmpty(f, c)),
            Map.entry("is_not_empty", (f, c) -> !isEmpty(f, c))
    );

    private static boolean isEmpty(Object fieldValue, String ignored) {
        if (fieldValue == null) {
            return true;
        }
        if (fieldValue instanceof CharSequence) {
            return ((CharSequence) fieldValue).length() == 0;
        }
        if (fieldValue instanceof java.util.Collection) {
            return ((java.util.Collection<?>) fieldValue).isEmpty();
        }
        if (fieldValue instanceof Map) {
            return ((Map<?, ?>) fieldValue).isEmpty();
        }
        return false;
    }
}
