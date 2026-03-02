package com.workflow.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ValidationExceptionTest {

    @Test
    void constructor_SetsMessage() {
        ValidationException ex = new ValidationException("Username is required");
        assertEquals("Username is required", ex.getMessage());
    }

    @Test
    void isRuntimeException() {
        ValidationException ex = new ValidationException("test");
        assertTrue(ex instanceof RuntimeException);
    }
}
