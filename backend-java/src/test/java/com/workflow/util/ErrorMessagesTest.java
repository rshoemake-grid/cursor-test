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
    void executionFailureDetailUsesCauseMessageWhenTopMessageNull() {
        assertEquals(
                "root cause text",
                ErrorMessages.executionFailureDetail(
                        new IllegalStateException(null, new RuntimeException("root cause text"))));
    }

    @Test
    void executionFailureDetailSkipsBlankMessagesInChain() {
        Exception inner = new Exception("inner");
        // Single-arg RuntimeException(Throwable) sets message to cause.toString(), not null.
        RuntimeException mid = new RuntimeException("   ", inner);
        assertEquals(
                "inner",
                ErrorMessages.executionFailureDetail(new IllegalStateException("   ", mid)));
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
