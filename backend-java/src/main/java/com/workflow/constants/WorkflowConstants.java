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
}
