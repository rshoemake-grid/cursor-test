package com.workflow.constants;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WorkflowConstantsTest {

    @Test
    void defaultVersion_IsCorrect() {
        assertEquals("1.0.0", WorkflowConstants.DEFAULT_VERSION);
    }

    @Test
    void tokenTypeBearer_IsCorrect() {
        assertEquals("bearer", WorkflowConstants.TOKEN_TYPE_BEARER);
    }
}
