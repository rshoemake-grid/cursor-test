package com.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowShareCreate {
    @NotBlank(message = "workflowId is required")
    private String workflowId;
    @NotBlank(message = "sharedWithUsername is required")
    private String sharedWithUsername;
    private String permission; // view, edit, execute
}
