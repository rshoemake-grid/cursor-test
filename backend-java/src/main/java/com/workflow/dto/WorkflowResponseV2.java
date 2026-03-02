package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * WorkflowResponseV2 - extended response for marketplace/templates (matches Python)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowResponseV2 {
    private String id;
    private String name;
    private String description;
    private String version;
    private List<Node> nodes;
    private List<Edge> edges;
    private Map<String, Object> variables;
    private String ownerId;
    private Boolean isPublic;
    private Boolean isTemplate;
    private String category;
    private List<String> tags;
    private Integer likesCount;
    private Integer viewsCount;
    private Integer usesCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
