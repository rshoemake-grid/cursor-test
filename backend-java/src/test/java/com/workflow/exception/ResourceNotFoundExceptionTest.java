package com.workflow.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResourceNotFoundExceptionTest {

    @Test
    void constructor_SetsMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Workflow not found: 123");
        assertEquals("Workflow not found: 123", ex.getMessage());
    }

    @Test
    void isRuntimeException() {
        ResourceNotFoundException ex = new ResourceNotFoundException("test");
        assertTrue(ex instanceof RuntimeException);
    }
}
