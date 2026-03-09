package com.workflow.util;

import java.util.Map;
import java.util.Objects;

/**
 * DRY-14: Centralizes LLM error response format used by SettingsController, LlmTestService, etc.
 */
public final class LlmErrorResponseBuilder {

    private static final String DEFAULT_ERROR_MESSAGE = "Unknown error";

    private LlmErrorResponseBuilder() {
    }

    /**
     * Build standard error response map for LLM/test endpoints.
     */
    public static Map<String, String> error(String message) {
        return Map.of("status", "error", "message", Objects.requireNonNullElse(message, DEFAULT_ERROR_MESSAGE));
    }

    /**
     * Build error response from exception message.
     */
    public static Map<String, String> error(Exception e) {
        return error(ObjectUtils.safeGet(e, Exception::getMessage));
    }
}
