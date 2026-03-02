package com.workflow.exception;

/**
 * Exception for 403 Forbidden - not authorized
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
