package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowShareCreate {
    private String workflowId;
    private String sharedWithUsername;
    private String permission; // view, edit, execute
}
