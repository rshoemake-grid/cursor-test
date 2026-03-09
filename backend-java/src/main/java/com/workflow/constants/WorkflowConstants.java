package com.workflow.constants;

/**
 * Constants for workflow-related values
 * DRY: Centralizes magic strings and numbers
 */
public final class WorkflowConstants {
    private WorkflowConstants() {
        // Utility class - prevent instantiation
    }
    
    public static final String DEFAULT_VERSION = "1.0.0";
    public static final String TOKEN_TYPE_BEARER = "bearer";

    /** Default branch value when condition output is missing. Used by WorkflowExecutor and ConditionNodeExecutor. */
    public static final String BRANCH_TRUE = "true";
    public static final String BRANCH_FALSE = "false";
    public static final String DEFAULT_SOURCE_HANDLE = "default";
}
