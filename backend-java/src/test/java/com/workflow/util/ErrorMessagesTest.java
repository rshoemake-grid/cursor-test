package com.workflow.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ErrorMessagesTest {

    @Test
    void executionFailureDetailUsesMessageWhenPresent() {
        assertEquals(
                "boom",
                ErrorMessages.executionFailureDetail(new IllegalStateException("boom")));
    }

    @Test
    void executionFailureDetailUsesClassNameWhenMessageBlank() {
        String d = ErrorMessages.executionFailureDetail(new RuntimeException("   "));
        assertEquals("RuntimeException", d);
    }

    @Test
    void executionFailureDetailFallsBackForNullThrowable() {
        assertEquals(ErrorMessages.EXECUTION_FAILED, ErrorMessages.executionFailureDetail(null));
    }

    @Test
    void executionFailureDetailTruncatesVeryLongMessages() {
        String longMsg = "x".repeat(3000);
        String d = ErrorMessages.executionFailureDetail(new Exception(longMsg));
        assertTrue(d.endsWith("…"));
        assertEquals(2001, d.length());
    }
}
