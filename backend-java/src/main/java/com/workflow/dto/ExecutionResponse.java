package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * ExecutionResponse DTO - matches Python ExecutionResponse schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResponse {
    private String executionId;
    private String workflowId;
    private String status;
    private String currentNode;
    private Map<String, Object> result;
    private String error;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Map<String, Object> logs;
}
