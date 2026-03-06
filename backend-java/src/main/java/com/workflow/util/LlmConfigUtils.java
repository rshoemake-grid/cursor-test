package com.workflow.util;

import java.util.Map;

/**
 * DRY: Centralizes LLM config extraction and URL building used by AgentNodeExecutor and WorkflowChatService.
 */
public final class LlmConfigUtils {

    private static final String DEFAULT_BASE_URL = "https://api.openai.com/v1";
    private static final String DEFAULT_MODEL = "gpt-4o-mini";

    private LlmConfigUtils() {
    }

    public static String getBaseUrl(Map<String, Object> config) {
        if (config == null) return DEFAULT_BASE_URL;
        Object o = config.get("base_url");
        if (o == null) o = config.get("baseUrl");
        return o != null ? o.toString() : DEFAULT_BASE_URL;
    }

    public static String getApiKey(Map<String, Object> config) {
        if (config != null) {
            Object o = config.get("api_key");
            if (o == null) o = config.get("apiKey");
            if (o != null && !o.toString().isBlank()) return o.toString();
        }
        return null;
    }

    public static String getApiKeyWithEnvFallback(Map<String, Object> config) {
        String key = getApiKey(config);
        if (key != null) return key;
        key = System.getenv("OPENAI_API_KEY");
        if (key != null) return key;
        key = System.getenv("GEMINI_API_KEY");
        if (key != null) return key;
        key = System.getenv("GOOGLE_API_KEY");
        return key;
    }

    public static String getModel(Map<String, Object> config) {
        if (config == null) return DEFAULT_MODEL;
        Object o = config.get("model");
        if (o == null) o = config.get("defaultModel");
        return o != null ? o.toString() : DEFAULT_MODEL;
    }

    /**
     * Build chat completions URL, handling trailing slash.
     */
    public static String buildChatCompletionsUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) return DEFAULT_BASE_URL + "/chat/completions";
        if (baseUrl.contains("/chat/completions")) return baseUrl;
        return baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
    }
}
