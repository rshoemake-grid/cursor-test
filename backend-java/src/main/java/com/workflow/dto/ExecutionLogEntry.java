package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ExecutionLogEntry DTO - matches Python ExecutionLogEntry schema
 * A log entry during workflow execution
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionLogEntry {
    private LocalDateTime timestamp;
    private String level;  // INFO, WARNING, ERROR
    private String nodeId;
    private String message;
}
