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

    public static final String AUTH_REQUIRED = "Authentication required";
    public static final String BULK_DELETE_NO_IDS = "No workflow IDs provided";
    public static final String BULK_DELETE_AUTH_REQUIRED = AUTH_REQUIRED;

    public static final String USERNAME_PASSWORD_REQUIRED = "Username and password are required";
    public static final String INVALID_CREDENTIALS = "Invalid username or password";
    public static final String INVALID_JSON = "Invalid JSON";
    public static final String INVALID_REQUEST_BODY = "Invalid request body";
    public static final String VALIDATION_FAILED = "Validation failed";
    public static final String LLM_RESPONSE_INVALID_STRUCTURE = "LLM response missing expected structure (choices[0].message.content)";
    public static final String LLM_CONFIG_REQUIRED_AGENT = "LLM config required for agent nodes";
    public static final String NO_LLM_PROVIDER_CONFIGURED = "No LLM provider configured. Please configure an LLM provider in Settings.";
    public static final String NO_LLM_PROVIDER_CONFIGURED_EXECUTION = "No LLM provider configured. Please configure an LLM provider in Settings before executing workflows.";
    public static final String IMPORT_FILE_INVALID_JSON = "Import file contains invalid JSON";
    public static final String NOT_AUTHORIZED_USER_EXECUTIONS = "Not authorized to access another user's executions";

    public static final String UNKNOWN_WORKFLOW_ID = "unknown";

    public static final String CHAT_ERROR_PREFIX = "Chat error";

    public static final String INVALID_WORKFLOW_DEFINITION = "Invalid workflow definition: must contain 'nodes' and 'edges'";
    public static final String NO_LLM_API_KEY =
            "No LLM API key configured. Set api_key in Settings or one of OPENAI_API_KEY, GEMINI_API_KEY, "
                    + "GOOGLE_API_KEY env vars. For Gemini without an API key, set GOOGLE_CLOUD_PROJECT (or GCP_PROJECT) "
                    + "and use Application Default Credentials (gcloud auth application-default login).";
    public static final String EXECUTION_CANCELLED_BY_USER = "Execution cancelled by user";
    public static final String EXECUTION_FAILED = "Execution failed";
    public static final String UNEXPECTED_ERROR = "An unexpected error occurred";
    public static final String RESTORED_TO_VERSION_PREFIX = "Restored to version ";
    public static final String RESTORE_MESSAGE_KEY = "message";

    public static String fieldRequired(String fieldName) {
        return fieldName + " is required";
    }

    public static String chatError(String detail) {
        return detail != null && !detail.isBlank() ? CHAT_ERROR_PREFIX + ": " + detail : CHAT_ERROR_PREFIX;
    }

    public static String workflowNotFound(String id) {
        return WORKFLOW_NOT_FOUND + ": " + id;
    }

    public static String executionNotFound(String id) {
        return EXECUTION_NOT_FOUND + ": " + id;
    }

    public static String executionNotCancellable(String executionId, String status) {
        return "Execution " + executionId + " is not in a cancellable state (current status: " + status + ")";
    }

    public static String noExecutorForNodeType(String nodeType) {
        return "No executor registered for node type: " + nodeType
                + ". Add a NodeExecutor implementation or register it in the registry.";
    }

    public static String orphanNodes(int count) {
        return "Found " + count + " disconnected nodes";
    }

    public static final String MISSING_START_NODE = "Workflow has no START node";
    public static final String MISSING_END_NODE = "Workflow has no END node";

    public static String userNotFound(String username) {
        return USER_NOT_FOUND + ": " + username;
    }

    public static String unknownProviderType(String type) {
        return "Unknown provider type: " + type;
    }

    public static final String BASE_URL_REQUIRED_CUSTOM = "base_url is required for custom providers";
    public static final String FAILED_TO_FORMAT_LOGS_JSON = "Failed to format logs as JSON";
    public static final String PASSWORD_RESET_SUCCESS = "Password has been reset successfully";
    public static final String ALREADY_LIKED = "Already liked";
    public static final String LIKED_SUCCESSFULLY = "Liked successfully";

    public static String bulkDeleteSuccess(int count) {
        return "Successfully deleted " + count + " workflow(s)";
    }

    public static String bulkDeletePartial(int deletedCount, int failedCount) {
        return "Deleted " + deletedCount + " workflow(s). " + failedCount + " could not be deleted.";
    }

    public static final String PASSWORD_RESET_EMAIL_SENT = "If an account with that email exists, a password reset link has been sent.";
    public static final String FORBIDDEN = "Forbidden";
    public static final String UNAUTHORIZED = "Unauthorized";
    public static final String LLM_TEST_REQUIRED_FIELDS = "type, api_key, and model are required";

    public static String llmApiError(int statusCode) {
        return "API error " + statusCode + ". Check provider configuration.";
    }

    private static final int EXECUTION_ERROR_DETAIL_MAX_LEN = 2000;

    /**
     * User-visible execution failure detail for persisted state / WebSocket (trimmed, capped).
     */
    public static String executionFailureDetail(Throwable throwable) {
        if (throwable == null) {
            return EXECUTION_FAILED;
        }
        String msg = throwable.getMessage();
        if (msg != null && !msg.isBlank()) {
            return truncateExecutionDetail(msg.trim());
        }
        String simple = throwable.getClass().getSimpleName();
        if (simple != null && !simple.isBlank()) {
            return truncateExecutionDetail(simple);
        }
        return EXECUTION_FAILED;
    }

    private static String truncateExecutionDetail(String s) {
        if (s.length() <= EXECUTION_ERROR_DETAIL_MAX_LEN) {
            return s;
        }
        return s.substring(0, EXECUTION_ERROR_DETAIL_MAX_LEN) + "…";
    }

    public static final String SETTINGS_SAVED_SUCCESS = "Settings saved successfully";
    public static final String CONNECTED_SUCCESSFULLY = "Connected successfully!";
    public static final String PASSWORD_RESET_TOKEN_DEV_MESSAGE = "Password reset token generated. In production, this would be sent via email.";
    public static final String EXPORT_ALL_FILENAME = "workflows.json";
}
