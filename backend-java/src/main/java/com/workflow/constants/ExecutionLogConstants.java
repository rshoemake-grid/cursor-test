package com.workflow.constants;

/**
 * DRY: Log level constants for execution logs. Used by WorkflowExecutor, ExecutionService, ExecutionOrchestratorService.
 */
public final class ExecutionLogConstants {

    private ExecutionLogConstants() {
    }

    public static final String LOG_LEVEL_INFO = "INFO";
    public static final String LOG_LEVEL_ERROR = "ERROR";

    public static final String WORKFLOW_EXECUTION_STARTED = "Workflow execution started";
    public static final String WORKFLOW_EXECUTION_COMPLETED = "Workflow execution completed";
    public static final String WORKFLOW_CONTAINS_NO_NODES = "Workflow contains no nodes";

    public static String skippingNode(Object nodeType, String nodeId) {
        return "Skipping " + nodeType + " node: " + nodeId;
    }

    public static String executionLogFilename(String executionId, String format) {
        return "execution_" + executionId + "_logs." + (format != null && format.equalsIgnoreCase("json") ? "json" : "txt");
    }
}
