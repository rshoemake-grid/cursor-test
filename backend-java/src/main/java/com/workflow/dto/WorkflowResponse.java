package com.workflow.dto;

import com.workflow.util.ObjectUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * WorkflowResponse DTO - matches Python WorkflowResponse schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowResponse {
    private String id;
    private String name;
    private String description;
    private String version;
    private List<Node> nodes;
    private List<Edge> edges;
    private Map<String, Object> variables;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Return nodes or empty list if null. DRY: Used by WorkflowExecutor and WorkflowGraphBuilder. */
    public List<Node> getNodesOrEmpty() {
        return ObjectUtils.orEmptyList(nodes);
    }

    /** Return edges or empty list if null. DRY: Used by WorkflowExecutor and WorkflowGraphBuilder. */
    public List<Edge> getEdgesOrEmpty() {
        return ObjectUtils.orEmptyList(edges);
    }
}
