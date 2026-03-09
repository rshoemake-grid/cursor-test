package com.workflow.constants;

/**
 * DRY: Log level constants for execution logs. Used by WorkflowExecutor, ExecutionService, ExecutionOrchestratorService.
 */
public final class ExecutionLogConstants {

    private ExecutionLogConstants() {
    }

    public static final String LOG_LEVEL_INFO = "INFO";
    public static final String LOG_LEVEL_ERROR = "ERROR";

    public static final String WORKFLOW_CONTAINS_NO_NODES = "Workflow contains no nodes";
    public static final String NODE_FAILED_PREFIX = "Node failed: ";
    public static final String WORKFLOW_EXECUTION_FAILED_PREFIX = "Workflow execution failed: ";

    public static String skippingNode(Object nodeType, String nodeId) {
        return "Skipping " + nodeType + " node: " + nodeId;
    }

    public static String nodeFailed(String message) {
        return NODE_FAILED_PREFIX + (message != null ? message : "");
    }

    public static String workflowExecutionFailed(String message) {
        return WORKFLOW_EXECUTION_FAILED_PREFIX + (message != null ? message : "");
    }
}
