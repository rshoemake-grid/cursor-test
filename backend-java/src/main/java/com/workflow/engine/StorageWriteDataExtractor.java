package com.workflow.engine;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Extracts payload to persist from node inputs (Python {@code extract_data_to_write} subset).
 */
public final class StorageWriteDataExtractor {

    private StorageWriteDataExtractor() {
    }

    public static Object extract(Map<String, Object> nodeInputs) {
        if (nodeInputs == null || nodeInputs.isEmpty()) {
            return null;
        }
        if (!anyContent(nodeInputs)) {
            return null;
        }
        if (nodeInputs.containsKey("data")) {
            if (nodeInputs.size() == 2 && nodeInputs.containsKey("source")) {
                return nodeInputs.get("data");
            }
            if (nodeInputs.size() == 1) {
                return nodeInputs.get("data");
            }
            Object d = nodeInputs.get("data");
            if (d != null && !"".equals(d) && !(d instanceof Map<?, ?> mm && mm.isEmpty())) {
                return d;
            }
            Map<String, Object> filtered = new LinkedHashMap<>();
            for (Map.Entry<String, Object> e : nodeInputs.entrySet()) {
                if (hasContent(e.getValue())) {
                    filtered.put(e.getKey(), e.getValue());
                }
            }
            return filtered.isEmpty() ? null : filtered;
        }
        var values = nodeInputs.values().stream().filter(StorageWriteDataExtractor::hasContent).toList();
        if (values.size() == 1) {
            return values.get(0);
        }
        if (values.size() > 1) {
            for (Object v : values) {
                if (v instanceof String s && s.startsWith("data:image/")) {
                    return v;
                }
            }
            return nodeInputs;
        }
        return null;
    }

    private static boolean anyContent(Map<String, Object> m) {
        return m.values().stream().anyMatch(StorageWriteDataExtractor::hasContent);
    }

    private static boolean hasContent(Object value) {
        if (value == null || "".equals(value)) {
            return false;
        }
        if (value instanceof Map<?, ?> mm && mm.isEmpty()) {
            return false;
        }
        return !(value instanceof String s) || s.startsWith("data:image/") || !s.isBlank();
    }
}
