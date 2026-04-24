package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Edge DTO - matches Python Edge schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class Edge {
    private String id;
    private String source;
    private String target;
    private String label;
    private String sourceHandle;
    private String targetHandle;
    /** Branch id for condition edges (Python executor uses {@code condition} or handle). */
    private String condition;
}
