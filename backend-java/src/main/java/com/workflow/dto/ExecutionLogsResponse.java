package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * ExecutionLogsResponse DTO - matches Python ExecutionLogsResponse schema
 * Response model for execution logs with pagination
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionLogsResponse {
    private String executionId;
    private List<ExecutionLogEntry> logs;
    private int total;
    private int limit;
    private int offset;
}
