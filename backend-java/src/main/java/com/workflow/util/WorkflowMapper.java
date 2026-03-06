package com.workflow.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.*;
import com.workflow.entity.Workflow;
import org.springframework.stereotype.Component;

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
        
        // Safely extract definition components
        Map<String, Object> definition = workflow.getDefinition();
        if (definition != null) {
            response.setNodes(extractNodes(definition));
            response.setEdges(extractEdges(definition));
            response.setVariables(extractVariables(definition));
        }
        
        return response;
    }

    /**
     * DRY-9: Convert Workflow entity to WorkflowResponseV2 (marketplace/import-export).
     */
    public WorkflowResponseV2 toWorkflowResponseV2(Workflow workflow) {
        if (workflow == null) return null;
        Map<String, Object> def = workflow.getDefinition() != null ? workflow.getDefinition() : Map.of();
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
            "nodes", workflowCreate.getNodes() != null ? workflowCreate.getNodes() : List.of(),
            "edges", workflowCreate.getEdges() != null ? workflowCreate.getEdges() : List.of(),
            "variables", workflowCreate.getVariables() != null ? workflowCreate.getVariables() : Map.of()
        );
    }
    
    /**
     * Safely extract nodes from definition map (public for MarketplaceService)
     * DRY-12: Uses convertValueOrCast helper
     */
    @SuppressWarnings("unchecked")
    public List<Node> extractNodes(Map<String, Object> definition) {
        Object nodesObj = definition != null ? definition.get("nodes") : null;
        return nodesObj == null ? List.of() : convertValueOrCast(nodesObj, new TypeReference<List<Node>>() {});
    }

    /**
     * Safely extract edges from definition map (public for MarketplaceService)
     * DRY-12: Uses convertValueOrCast helper
     */
    @SuppressWarnings("unchecked")
    public List<Edge> extractEdges(Map<String, Object> definition) {
        Object edgesObj = definition != null ? definition.get("edges") : null;
        return edgesObj == null ? List.of() : convertValueOrCast(edgesObj, new TypeReference<List<Edge>>() {});
    }

    /**
     * Safely extract variables from definition map (public for MarketplaceService)
     * DRY-12: Uses convertValueOrCast helper
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> extractVariables(Map<String, Object> definition) {
        Object variablesObj = definition != null ? definition.get("variables") : null;
        return variablesObj == null ? Map.of() : convertValueOrCast(variablesObj, new TypeReference<Map<String, Object>>() {});
    }

    /**
     * DRY-12: Convert value via ObjectMapper, fallback to cast on failure.
     */
    @SuppressWarnings("unchecked")
    private <T> T convertValueOrCast(Object value, TypeReference<T> typeRef) {
        try {
            return objectMapper.convertValue(value, typeRef);
        } catch (Exception e) {
            return (T) value;
        }
    }
}
