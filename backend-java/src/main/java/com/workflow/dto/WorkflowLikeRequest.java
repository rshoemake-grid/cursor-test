package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WorkflowLike request - matches Python WorkflowLike
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowLikeRequest {
    private String workflowId;
}
