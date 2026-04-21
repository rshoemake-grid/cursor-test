package com.workflow.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ValidationUtilsTest {

    @Test
    void normalizeLoginIdentifier_trimsAndHandlesNull() {
        assertEquals("", ValidationUtils.normalizeLoginIdentifier(null));
        assertEquals("", ValidationUtils.normalizeLoginIdentifier(""));
        assertEquals("alice", ValidationUtils.normalizeLoginIdentifier("  alice  "));
    }

    @Test
    void normalizeEmail_trimsLowercasesAndHandlesNull() {
        assertEquals("", ValidationUtils.normalizeEmail(null));
        assertEquals("", ValidationUtils.normalizeEmail("   "));
        assertEquals("a@b.co", ValidationUtils.normalizeEmail("  A@B.CO  "));
    }
}
