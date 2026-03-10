package com.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowVersionCreate {
    @NotBlank(message = "workflowId is required")
    private String workflowId;
    private String changeNotes;
}
