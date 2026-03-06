package com.workflow.exception;

/**
 * Thrown when user is not authorized. Maps to 403.
 */
public class ForbiddenException extends ApplicationException {
    public ForbiddenException(String message) {
        super(message);
    }
}
