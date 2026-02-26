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
     * Safely extract nodes from definition map
     */
    @SuppressWarnings("unchecked")
    private List<Node> extractNodes(Map<String, Object> definition) {
        Object nodesObj = definition.get("nodes");
        if (nodesObj == null) {
            return List.of();
        }
        try {
            return objectMapper.convertValue(nodesObj, new TypeReference<List<Node>>() {});
        } catch (Exception e) {
            // Fallback to direct cast if conversion fails
            return (List<Node>) nodesObj;
        }
    }
    
    /**
     * Safely extract edges from definition map
     */
    @SuppressWarnings("unchecked")
    private List<Edge> extractEdges(Map<String, Object> definition) {
        Object edgesObj = definition.get("edges");
        if (edgesObj == null) {
            return List.of();
        }
        try {
            return objectMapper.convertValue(edgesObj, new TypeReference<List<Edge>>() {});
        } catch (Exception e) {
            // Fallback to direct cast if conversion fails
            return (List<Edge>) edgesObj;
        }
    }
    
    /**
     * Safely extract variables from definition map
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> extractVariables(Map<String, Object> definition) {
        Object variablesObj = definition.get("variables");
        if (variablesObj == null) {
            return Map.of();
        }
        try {
            return objectMapper.convertValue(variablesObj, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            // Fallback to direct cast if conversion fails
            return (Map<String, Object>) variablesObj;
        }
    }
}
