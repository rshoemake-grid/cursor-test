package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowShareResponse {
    private String id;
    private String workflowId;
    private String sharedWithUserId;
    private String permission;
    private String sharedBy;
    private LocalDateTime createdAt;
}
