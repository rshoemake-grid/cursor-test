package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowChatResponse {
    private String message;
    /** Matches Python / frontend: {@code workflow_changes}. */
    @JsonProperty("workflow_changes")
    private Map<String, Object> workflowChanges;
    @JsonProperty("workflow_id")
    private String workflowId;
}
