package com.workflow.exception;

/**
 * Thrown when authentication is required but missing or invalid. Maps to 401.
 */
public class UnauthorizedException extends ApplicationException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
