package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * ExecutionRequest DTO - matches Python ExecutionRequest schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionRequest {
    private String workflowId;
    private Map<String, Object> inputs;
}
