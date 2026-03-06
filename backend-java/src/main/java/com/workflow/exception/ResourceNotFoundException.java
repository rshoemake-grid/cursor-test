package com.workflow.exception;

/**
 * Thrown when a requested resource does not exist. Maps to 404.
 */
public class ResourceNotFoundException extends ApplicationException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
