package com.workflow.exception;

/**
 * Thrown when request data is invalid. Maps to 400.
 */
public class ValidationException extends ApplicationException {
    public ValidationException(String message) {
        super(message);
    }
}
