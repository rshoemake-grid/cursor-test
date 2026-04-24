package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * ExecutionRequest DTO - matches Python ExecutionRequest schema ({@code workflow_id}, {@code inputs}).
 * <p>
 * HTTP execute bodies are parsed with {@link #fromHttpJson(JsonNode, ObjectMapper)} so {@code inputs}
 * can be an object, a JSON string of an object, or other shapes (coerced to an empty map) without
 * {@code HttpMessageNotReadableException} from strict {@code Map} binding.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionRequest {
    @JsonProperty("workflow_id")
    @JsonAlias({"workflowId"})
    private String workflowId;

    private Map<String, Object> inputs;

    /**
     * Parse execute POST JSON without binding directly to this bean (avoids Jackson edge cases on
     * {@code inputs} for complex client payloads).
     */
    public static ExecutionRequest fromHttpJson(JsonNode root, ObjectMapper objectMapper) {
        ExecutionRequest r = new ExecutionRequest();
        if (root == null || root.isNull() || root.isMissingNode()) {
            r.setInputs(Map.of());
            return r;
        }
        if (!root.isObject()) {
            r.setInputs(Map.of());
            return r;
        }
        JsonNode wid = root.get("workflow_id");
        if (wid == null || wid.isNull()) {
            wid = root.get("workflowId");
        }
        if (wid != null && wid.isValueNode() && !wid.isNull()) {
            r.setWorkflowId(wid.asText());
        }
        r.setInputs(coerceInputs(root.get("inputs"), objectMapper));
        return r;
    }

    private static Map<String, Object> coerceInputs(JsonNode inputsNode, ObjectMapper om) {
        try {
            if (inputsNode == null || inputsNode.isNull() || inputsNode.isMissingNode()) {
                return Map.of();
            }
            if (inputsNode.isObject()) {
                return om.convertValue(inputsNode, new TypeReference<Map<String, Object>>() {});
            }
            if (inputsNode.isTextual()) {
                String t = inputsNode.asText().trim();
                if (t.isEmpty()) {
                    return Map.of();
                }
                JsonNode inner = om.readTree(t);
                if (inner != null && inner.isObject()) {
                    return om.convertValue(inner, new TypeReference<Map<String, Object>>() {});
                }
                return Map.of();
            }
            return Map.of();
        } catch (Exception ignored) {
            return Map.of();
        }
    }
}
