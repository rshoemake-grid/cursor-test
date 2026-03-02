package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowVersionResponse {
    private String id;
    private String workflowId;
    private Integer versionNumber;
    private String changeNotes;
    private String createdBy;
    private LocalDateTime createdAt;
}
