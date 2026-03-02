package com.workflow.exception;

/**
 * Exception thrown when an execution is not found - matches Python ExecutionNotFoundError
 */
public class ExecutionNotFoundException extends ResourceNotFoundException {
    public ExecutionNotFoundException(String message) {
        super(message);
    }
}
