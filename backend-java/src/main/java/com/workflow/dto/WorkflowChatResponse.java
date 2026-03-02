package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowChatResponse {
    private String message;
    private Map<String, Object> workflowChanges;  // nodes_to_add, nodes_to_update, etc.
    private String workflowId;
}
