package com.workflow.exception;

/**
 * Base exception for application-level errors.
 * Code Review 2026: Establishes consistent hierarchy for ResourceNotFoundException,
 * ValidationException, ForbiddenException, ExecutionNotFoundException.
 */
public class ApplicationException extends RuntimeException {
    public ApplicationException(String message) {
        super(message);
    }

    public ApplicationException(String message, Throwable cause) {
        super(message, cause);
    }
}
