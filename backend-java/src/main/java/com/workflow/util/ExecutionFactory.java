package com.workflow.util;

import com.workflow.dto.ExecutionStatus;
import com.workflow.entity.Execution;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

/**
 * DRY: Centralizes Execution entity creation used by ExecutionOrchestratorService.
 */
public final class ExecutionFactory {

    private ExecutionFactory() {
    }

    /**
     * Create a new Execution in RUNNING state with empty logs.
     */
    public static Execution createRunning(String workflowId, String userId) {
        String executionId = "exec-" + UUID.randomUUID();
        Execution execution = new Execution();
        execution.setId(executionId);
        execution.setWorkflowId(workflowId);
        execution.setUserId(userId);
        execution.setStatus(ExecutionStatus.RUNNING.getValue());
        execution.setState(Map.of("logs", new ArrayList<Map<String, Object>>()));
        execution.setStartedAt(LocalDateTime.now());
        return execution;
    }
}
