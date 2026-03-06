package com.workflow.util;

import java.util.Map;

/**
 * DRY-14: Centralizes LLM error response format used by SettingsController, LlmTestService, etc.
 */
public final class LlmErrorResponseBuilder {

    private LlmErrorResponseBuilder() {
    }

    /**
     * Build standard error response map for LLM/test endpoints.
     */
    public static Map<String, String> error(String message) {
        return Map.of("status", "error", "message", message != null ? message : "Unknown error");
    }

    /**
     * Build error response from exception message.
     */
    public static Map<String, String> error(Exception e) {
        return error(e != null ? e.getMessage() : "Unknown error");
    }
}
