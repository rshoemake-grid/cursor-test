package com.workflow.engine;

import java.util.Map;

/**
 * DRY-19, DRY-20: Centralizes input fallback resolution for node executors.
 * Resolves the first non-null value from a map for the given keys.
 */
public final class InputResolver {

    private InputResolver() {
    }

    /**
     * Get the first non-null value from inputs for the given keys.
     *
     * @param inputs the input map
     * @param keys   keys to try in order
     * @return first non-null value, or null if none found
     */
    public static Object getFirstOf(Map<String, Object> inputs, String... keys) {
        if (inputs == null) {
            return null;
        }
        for (String key : keys) {
            Object value = inputs.get(key);
            if (value != null) {
                return value;
            }
        }
        return null;
    }
}
