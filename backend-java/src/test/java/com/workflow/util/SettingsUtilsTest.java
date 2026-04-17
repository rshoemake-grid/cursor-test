package com.workflow.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SettingsUtilsTest {

    @Test
    void isValidApiKey_nullOrBlank_false() {
        assertFalse(SettingsUtils.isValidApiKey(null));
        assertFalse(SettingsUtils.isValidApiKey(""));
        assertFalse(SettingsUtils.isValidApiKey("   "));
    }

    @Test
    void isValidApiKey_tooShort_false() {
        assertFalse(SettingsUtils.isValidApiKey("short"));
    }

    @Test
    void isValidApiKey_exactPlaceholders_false() {
        assertFalse(SettingsUtils.isValidApiKey("your-api-key-here"));
        assertFalse(SettingsUtils.isValidApiKey("SK-YOUR-API-KEY-HERE"));
        assertFalse(SettingsUtils.isValidApiKey("api-key-here"));
    }

    @Test
    void isValidApiKey_maskedShort_false() {
        assertFalse(SettingsUtils.isValidApiKey("sk-your-api*****here"));
    }

    @Test
    void isValidApiKey_reasonableKey_true() {
        assertTrue(SettingsUtils.isValidApiKey("sk-123456789012345678901234"));
    }
}
