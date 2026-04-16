package com.workflow.service;

/**
 * Checks execution ownership. Allows mocking in tests (Mockito cannot mock ExecutionService).
 */
public interface ExecutionOwnershipChecker {
    /**
     * Return true if the user owns the execution, false if not found or not owner.
     */
    boolean isExecutionOwner(String executionId, String userId);

    /**
     * WebSocket / execution stream access (Python {@code _verify_websocket_auth_and_ownership}):
     * same as {@link #isExecutionOwner} when {@code execution.userId} is set; when it is null
     * (guest-style run), the workflow owner may open the stream.
     */
    boolean canOpenExecutionStream(String executionId, String userId);
}
