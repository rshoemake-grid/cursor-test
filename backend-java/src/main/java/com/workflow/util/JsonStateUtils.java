package com.workflow.util;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Code Review 2026: Safe extraction from JSON state maps to avoid unchecked casts.
 * Use when state comes from execution.getState() or similar dynamic JSON.
 */
public final class JsonStateUtils {

    private JsonStateUtils() {
    }

    /**
     * Return state map or empty map if null. DRY: Used by ExecutionService and ExecutionStatsService.
     */
    public static Map<String, Object> getStateOrEmpty(Map<String, Object> state) {
        return state != null ? state : Collections.emptyMap();
    }

    /**
     * Safely extract logs list from execution state. Returns empty list if missing or wrong type.
     */
    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> getLogsList(Map<String, Object> state) {
        if (state == null) return Collections.emptyList();
        Object o = state.get("logs");
        if (o instanceof List<?> list) {
            return list.stream()
                    .filter(item -> item instanceof Map)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return Collections.emptyList();
    }

    /**
     * Safely extract nested map. Returns empty map if missing or wrong type.
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> getMap(Map<String, Object> map, String key) {
        if (map == null) return Collections.emptyMap();
        Object o = map.get(key);
        return o instanceof Map<?, ?> ? (Map<String, Object>) o : Collections.emptyMap();
    }

    /**
     * Safely extract nested map with default. Returns default if missing or wrong type.
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> getMapOrDefault(Map<String, Object> map, String key,
                                                      Map<String, Object> defaultValue) {
        if (map == null) return defaultValue != null ? defaultValue : Collections.emptyMap();
        Object o = map.get(key);
        return o instanceof Map<?, ?> ? (Map<String, Object>) o : (defaultValue != null ? defaultValue : Collections.emptyMap());
    }

    /**
     * Safely extract list of maps from a map. Returns empty list if missing or wrong type.
     * Use for nodes, edges, providers, etc.
     */
    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> getListOfMaps(Map<String, Object> map, String key) {
        if (map == null) return Collections.emptyList();
        Object o = map.get(key);
        if (o instanceof List<?> list) {
            return list.stream()
                    .filter(item -> item instanceof Map)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return Collections.emptyList();
    }

    /**
     * Create a log entry map for execution state. DRY: Used by ExecutionService and ExecutionOrchestratorService.
     */
    public static Map<String, Object> createLogEntry(String level, String nodeId, String message) {
        return createLogEntry(LocalDateTime.now().toString(), level, nodeId, message);
    }

    /**
     * Create a log entry map with explicit timestamp. DRY: Used by ExecutionState.toStateMap().
     */
    public static Map<String, Object> createLogEntry(String timestamp, String level, String nodeId, String message) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("timestamp", timestamp);
        entry.put("level", Objects.requireNonNullElse(level, "INFO"));
        entry.put("node_id", nodeId);
        entry.put("message", Objects.requireNonNullElse(message, ""));
        return entry;
    }
}
