package com.workflow.util;

import java.util.List;
import java.util.Locale;

/**
 * Settings validation — mirrors Python {@code backend/utils/settings_utils.py}.
 */
public final class SettingsUtils {

    private static final List<String> EXACT_PLACEHOLDERS =
            List.of(
                    "your-api-key-here",
                    "your-api*****here",
                    "sk-your-api-key-here",
                    "sk-your-api*****here",
                    "your-api-key",
                    "api-key-here");

    private SettingsUtils() {
    }

    /**
     * @return false for empty, short, or known placeholder strings; true otherwise (connection test may still fail).
     */
    public static boolean isValidApiKey(String apiKey) {
        if (apiKey == null) {
            return false;
        }
        String trimmed = apiKey.trim();
        if (trimmed.isEmpty()) {
            return false;
        }
        if (trimmed.length() < 10) {
            return false;
        }
        String lower = trimmed.toLowerCase(Locale.ROOT);
        for (String p : EXACT_PLACEHOLDERS) {
            if (lower.equals(p.toLowerCase(Locale.ROOT))) {
                return false;
            }
        }
        if (trimmed.length() < 25
                && (lower.contains("your-api-key-here") || lower.contains("your-api*****here"))) {
            return false;
        }
        if (trimmed.length() < 30 && trimmed.contains("*****here")) {
            return false;
        }
        return true;
    }
}
