package com.workflow.engine;

import java.util.Map;

/**
 * Converts workflow node inputs to the user message string passed to Google ADK.
 * Matches Python {@code ADKAgent._convert_inputs_to_adk_format}.
 */
public final class AdkWorkflowInputConverter {

    private AdkWorkflowInputConverter() {
    }

    public static String toUserMessage(Map<String, Object> inputs) {
        if (inputs == null || inputs.isEmpty()) {
            return "";
        }
        if (inputs.size() == 1) {
            return String.valueOf(inputs.values().iterator().next());
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> e : inputs.entrySet()) {
            if (sb.length() > 0) {
                sb.append('\n');
            }
            sb.append(e.getKey()).append(": ").append(e.getValue());
        }
        return sb.toString();
    }
}
