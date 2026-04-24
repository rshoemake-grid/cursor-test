package com.workflow.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.*;
import com.workflow.entity.Workflow;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Mapper for converting between Workflow entities and DTOs
 * DRY: Centralizes conversion logic
 * Fixes unsafe type casting issues
 */
@Component
public class WorkflowMapper {
    private final ObjectMapper objectMapper;
    
    public WorkflowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    /**
     * Convert Workflow entity to WorkflowResponse DTO
     */
    public WorkflowResponse toResponse(Workflow workflow) {
        WorkflowResponse response = new WorkflowResponse();
        response.setId(workflow.getId());
        response.setName(workflow.getName());
        response.setDescription(workflow.getDescription());
        response.setVersion(workflow.getVersion());
        response.setCreatedAt(workflow.getCreatedAt());
        response.setUpdatedAt(workflow.getUpdatedAt());
        
        // Safely extract definition components (extractNodes/Edges/Variables handle null)
        response.setNodes(extractNodes(workflow.getDefinition()));
        response.setEdges(extractEdges(workflow.getDefinition()));
        response.setVariables(extractVariables(workflow.getDefinition()));
        
        return response;
    }

    /**
     * DRY-9: Convert Workflow entity to WorkflowResponseV2 (marketplace/import-export).
     */
    public WorkflowResponseV2 toWorkflowResponseV2(Workflow workflow) {
        if (workflow == null) return null;
        Map<String, Object> def = ObjectUtils.orEmptyMap(workflow.getDefinition());
        return new WorkflowResponseV2(
                workflow.getId(), workflow.getName(), workflow.getDescription(), workflow.getVersion(),
                extractNodes(def), extractEdges(def), extractVariables(def),
                workflow.getOwnerId(), workflow.getIsPublic(), workflow.getIsTemplate(),
                workflow.getCategory(), workflow.getTags(), workflow.getLikesCount(),
                workflow.getViewsCount(), workflow.getUsesCount(),
                workflow.getCreatedAt(), workflow.getUpdatedAt());
    }

    /**
     * Build definition map from WorkflowCreate DTO
     */
    public Map<String, Object> buildDefinition(WorkflowCreate workflowCreate) {
        return Map.of(
            "nodes", ObjectUtils.orDefault(workflowCreate.getNodes(), List.of()),
            "edges", ObjectUtils.orDefault(workflowCreate.getEdges(), List.of()),
            "variables", ObjectUtils.orDefault(workflowCreate.getVariables(), Map.of())
        );
    }
    
    /**
     * Safely extract nodes from definition map (public for MarketplaceService)
     * DRY-12: Uses convertValueOrCast helper
     */
    @SuppressWarnings("unchecked")
    public List<Node> extractNodes(Map<String, Object> definition) {
        return extractOrDefault(ObjectUtils.orEmptyMap(definition).get("nodes"), new TypeReference<List<Node>>() {}, List.of());
    }

    /**
     * Safely extract edges from definition map (public for MarketplaceService)
     * DRY-12: Uses convertValueOrCast helper
     */
    @SuppressWarnings("unchecked")
    public List<Edge> extractEdges(Map<String, Object> definition) {
        return extractOrDefault(ObjectUtils.orEmptyMap(definition).get("edges"), new TypeReference<List<Edge>>() {}, List.of());
    }

    /**
     * Safely extract variables from definition map (public for MarketplaceService)
     * DRY-12: Uses convertValueOrCast helper
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> extractVariables(Map<String, Object> definition) {
        return extractOrDefault(ObjectUtils.orEmptyMap(definition).get("variables"), new TypeReference<Map<String, Object>>() {}, Map.of());
    }

    @SuppressWarnings("unchecked")
    private <T> T extractOrDefault(Object obj, TypeReference<T> typeRef, T empty) {
        return obj == null ? empty : convertValueOrCast(obj, typeRef);
    }

    /**
     * DRY-12: Convert value via ObjectMapper. Never raw-cast {@code List<Map>} to {@code List<Edge>} —
     * that yields {@code LinkedHashMap} elements at runtime and {@code ClassCastException} in
     * {@link com.workflow.engine.WorkflowExecutor} when iterating edges.
     */
    @SuppressWarnings("unchecked")
    private <T> T convertValueOrCast(Object value, TypeReference<T> typeRef) {
        try {
            return objectMapper.convertValue(value, typeRef);
        } catch (Exception ignoredStrictFailure) {
            ObjectMapper lenient = objectMapper.copy();
            lenient.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            try {
                return lenient.convertValue(value, typeRef);
            } catch (Exception lenientListEx) {
                JavaType targetType = lenient.getTypeFactory().constructType(typeRef);
                if (value instanceof List<?> list && targetType.isCollectionLikeType()) {
                    JavaType contentType = targetType.getContentType();
                    if (contentType != null && contentType.getRawClass() != null) {
                        Class<?> elemClass = contentType.getRawClass();
                        List<Object> out = new ArrayList<>(list.size());
                        int idx = 0;
                        for (Object item : list) {
                            if (item == null) {
                                out.add(null);
                            } else {
                                try {
                                    out.add(lenient.convertValue(item, elemClass));
                                } catch (Exception elemEx) {
                                    throw new IllegalStateException(
                                            "Cannot convert workflow definition list index " + idx
                                                    + " to " + elemClass.getName(),
                                            elemEx);
                                }
                            }
                            idx++;
                        }
                        return (T) out;
                    }
                }
                if (value instanceof Map<?, ?>) {
                    return (T) value;
                }
                throw new IllegalStateException(
                        "Cannot convert workflow definition fragment to " + typeRef.getType() + ": "
                                + lenientListEx.getMessage(),
                        lenientListEx);
            }
        }
    }

    /**
     * Nodes as maps for workflow-chat merge (preserves arbitrary JSON shape).
     */
    public List<Map<String, Object>> definitionNodesAsMaps(Map<String, Object> definition) {
        return convertMapList(ObjectUtils.orEmptyMap(definition).get("nodes"));
    }

    /**
     * Edges as maps for workflow-chat merge.
     */
    public List<Map<String, Object>> definitionEdgesAsMaps(Map<String, Object> definition) {
        return convertMapList(ObjectUtils.orEmptyMap(definition).get("edges"));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> convertMapList(Object raw) {
        if (raw == null) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.convertValue(raw, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            if (raw instanceof List<?> list) {
                List<Map<String, Object>> out = new ArrayList<>();
                for (Object o : list) {
                    if (o instanceof Map) {
                        out.add((Map<String, Object>) o);
                    }
                }
                return out;
            }
            return new ArrayList<>();
        }
    }
}
