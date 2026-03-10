package com.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * WorkflowTemplateCreate - matches Python WorkflowTemplateCreate
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplateCreate {
    @NotBlank(message = "name is required")
    private String name;
    private String description;
    private String category;
    private List<String> tags;
    private Map<String, Object> definition;
    private Boolean isOfficial;
    private String difficulty;
    private String estimatedTime;
}
