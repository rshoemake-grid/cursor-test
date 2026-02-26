package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * WorkflowDefinition DTO - matches Python WorkflowDefinition schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WorkflowDefinition {
    private String id;
    private String name;
    private String description;
    private String version = "1.0.0";
    private List<Node> nodes;
    private List<Edge> edges;
    private Map<String, Object> variables;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
