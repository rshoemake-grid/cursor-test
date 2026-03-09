package com.workflow.util;

/**
 * DRY: Centralized error messages used across services.
 */
public final class ErrorMessages {

    private ErrorMessages() {
    }

    public static final String WORKFLOW_NOT_FOUND = "Workflow not found";
    public static final String SHARE_NOT_FOUND = "Share not found";
    public static final String VERSION_NOT_FOUND = "Version not found";
    public static final String TEMPLATE_NOT_FOUND = "Template not found";
    public static final String USER_NOT_FOUND = "User not found";
    public static final String LIKE_NOT_FOUND = "Like not found";
    public static final String EXECUTION_NOT_FOUND = "Execution not found";
    public static final String NODE_NOT_FOUND_IN_EXECUTION = "Node not found in execution";

    public static final String NOT_AUTHORIZED_WORKFLOW = "Not authorized to access this workflow";
    public static final String NOT_AUTHORIZED_EXECUTION = "Not authorized to access this execution";
    public static final String NOT_AUTHORIZED_DELETE_TEMPLATE = "Not authorized to delete this template";
    public static final String USER_ID_REQUIRED = "userId is required";
    public static final String USERNAME_ALREADY_EXISTS = "Username already exists";
    public static final String EMAIL_ALREADY_EXISTS = "Email already exists";
    public static final String RESET_TOKEN_EXPIRED = "Reset token has expired";
    public static final String RESET_TOKEN_ALREADY_USED = "Reset token has already been used";
    public static final String INVALID_RESET_TOKEN = "Invalid or expired reset token";
    public static final String INVALID_REFRESH_TOKEN = "Invalid refresh token";
    public static final String REFRESH_TOKEN_EXPIRED = "Refresh token expired or revoked";

    public static final String IMPORT_FILE_EMPTY = "Import file is empty or invalid";
    public static final String IMPORT_BODY_EMPTY = "Import body must not be empty";
    public static final String IMPORT_BODY_MISSING_DEFINITION = "Import body must contain 'definition'";
    public static final String IMPORT_DEFINITION_NOT_OBJECT = "Import 'definition' must be an object";
    public static final String IMPORT_DEFINITION_TOO_LARGE = "Import definition exceeds maximum size";

    public static final String BULK_DELETE_NO_IDS = "No workflow IDs provided";
    public static final String BULK_DELETE_AUTH_REQUIRED = "Authentication required";

    public static String workflowNotFound(String id) {
        return WORKFLOW_NOT_FOUND + ": " + id;
    }

    public static String executionNotFound(String id) {
        return EXECUTION_NOT_FOUND + ": " + id;
    }

    public static String executionNotCancellable(String executionId, String status) {
        return "Execution " + executionId + " is not in a cancellable state (current status: " + status + ")";
    }
}
