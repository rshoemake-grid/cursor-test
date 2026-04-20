package com.workflow.util;

import com.workflow.dto.Node;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Merges {@code node.data.input_config} with top-level {@code node.inputConfig}, matching Python
 * {@code get_node_input_config}.
 */
public final class NodeInputConfigUtils {

    private NodeInputConfigUtils() {}

    @SuppressWarnings("unchecked")
    public static Map<String, Object> getMergedInputConfig(Node node) {
        Map<String, Object> inputConfig = new LinkedHashMap<>();
        Map<String, Object> data = node.getData();
        if (data != null && data.get("input_config") instanceof Map<?, ?> nested) {
            inputConfig.putAll((Map<String, Object>) nested);
        }
        Map<String, Object> top = node.getInputConfig();
        if (top == null || top.isEmpty()) {
            return inputConfig;
        }
        for (Map.Entry<String, Object> e : top.entrySet()) {
            String key = e.getKey();
            Object value = e.getValue();
            if (value != null && (!(value instanceof String) || !((String) value).trim().isEmpty())) {
                inputConfig.put(key, value);
            } else if (!inputConfig.containsKey(key)) {
                inputConfig.put(key, value);
            }
        }
        return inputConfig;
    }
}
