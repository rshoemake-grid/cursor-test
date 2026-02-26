package com.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * WorkflowCreate DTO - matches Python WorkflowCreate schema
 * Includes validation annotations for input validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowCreate {
    @NotBlank(message = "Workflow name is required")
    @Size(min = 1, max = 255, message = "Workflow name must be between 1 and 255 characters")
    private String name;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    @Size(max = 50, message = "Version must not exceed 50 characters")
    private String version;
    
    @NotNull(message = "Nodes are required")
    @NotEmpty(message = "Workflow must have at least one node")
    private List<Node> nodes;
    
    @NotNull(message = "Edges are required")
    private List<Edge> edges;
    
    private Map<String, Object> variables;
}
