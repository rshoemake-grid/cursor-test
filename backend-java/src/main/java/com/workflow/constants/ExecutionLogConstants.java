package com.workflow.constants;

/**
 * DRY: Log level constants for execution logs. Used by WorkflowExecutor, ExecutionService, ExecutionOrchestratorService.
 */
public final class ExecutionLogConstants {

    private ExecutionLogConstants() {
    }

    public static final String LOG_LEVEL_INFO = "INFO";
    public static final String LOG_LEVEL_ERROR = "ERROR";
}
