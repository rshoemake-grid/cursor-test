package com.workflow.engine;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

/**
 * Resolves condition field values from node inputs — subset of Python {@code resolve_condition_field_value}.
 */
public final class ConditionFieldResolver {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ConditionFieldResolver() {
    }

    public static Object resolve(Map<String, Object> inputs, String fieldPath) {
        if (fieldPath == null || fieldPath.isBlank()) {
            throw new IllegalArgumentException("Condition config requires 'field' to be set");
        }
        Object direct = getNested(inputs, fieldPath);
        if (direct != null) {
            return direct;
        }
        for (String key : List.of("data", "output", "value", "result", "items")) {
            if (!inputs.containsKey(key)) {
                continue;
            }
            Object v = inputs.get(key);
            if (fieldPath.contains(".")) {
                if (v instanceof List && !((List<?>) v).isEmpty()) {
                    Object first = tryParseJson(((List<?>) v).get(0));
                    Object nested = getNested(asMap(first), stripPrefix(fieldPath, key));
                    if (nested != null) {
                        return nested;
                    }
                } else {
                    Object nested = getNested(asMap(v), stripPrefix(fieldPath, key));
                    if (nested != null) {
                        return nested;
                    }
                }
            } else if (key.equals(fieldPath)) {
                return v;
            }
        }
        if (inputs.size() == 1) {
            return inputs.values().iterator().next();
        }
        return null;
    }

    private static String stripPrefix(String fieldPath, String key) {
        String p = key + ".";
        if (fieldPath.startsWith(p)) {
            return fieldPath.substring(p.length());
        }
        return fieldPath;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object v) {
        if (v instanceof Map) {
            return (Map<String, Object>) v;
        }
        return Map.of();
    }

    private static Object tryParseJson(Object v) {
        if (!(v instanceof String)) {
            return v;
        }
        String s = ((String) v).trim();
        if (!s.startsWith("{") && !s.startsWith("[")) {
            return v;
        }
        try {
            return MAPPER.readValue(s, Object.class);
        } catch (JsonProcessingException e) {
            return v;
        }
    }

    private static Object getNested(Map<String, Object> root, String path) {
        if (root == null || path == null || path.isBlank()) {
            return null;
        }
        String[] parts = path.split("\\.");
        Object cur = root;
        for (String part : parts) {
            if (cur instanceof Map) {
                cur = ((Map<?, ?>) cur).get(part);
            } else {
                return null;
            }
        }
        return cur;
    }
}
