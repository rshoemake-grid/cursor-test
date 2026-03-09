package com.workflow.service;

/**
 * Checks execution ownership. Allows mocking in tests (Mockito cannot mock ExecutionService).
 */
public interface ExecutionOwnershipChecker {
    /**
     * Return true if the user owns the execution, false if not found or not owner.
     */
    boolean isExecutionOwner(String executionId, String userId);
}
