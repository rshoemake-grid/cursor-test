package com.workflow.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Map;

/**
 * Accepts {@code inputs} as a JSON object, or a JSON string containing an object (double-encoded),
 * or non-objects (treated as empty). Prevents {@code HttpMessageNotReadableException} when the
 * client sends {@code "inputs": "{}"} or {@code []} instead of an object.
 */
public class ExecutionRequestInputsDeserializer extends JsonDeserializer<Map<String, Object>> {

    @Override
    public Map<String, Object> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        if (node == null || node.isNull()) {
            return Map.of();
        }
        ObjectMapper mapper = (ObjectMapper) p.getCodec();
        if (node.isObject()) {
            return mapper.convertValue(node, new TypeReference<Map<String, Object>>() {});
        }
        if (node.isTextual()) {
            String t = node.asText().trim();
            if (t.isEmpty()) {
                return Map.of();
            }
            try {
                JsonNode inner = mapper.readTree(t);
                if (inner != null && inner.isObject()) {
                    return mapper.convertValue(inner, new TypeReference<Map<String, Object>>() {});
                }
            } catch (Exception ignored) {
                return Map.of();
            }
            return Map.of();
        }
        return Map.of();
    }
}
