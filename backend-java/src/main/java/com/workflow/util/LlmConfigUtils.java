package com.workflow.util;

import org.springframework.core.env.Environment;

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
        return ObjectUtils.toStringOrDefault(o, DEFAULT_BASE_URL);
    }

    /**
     * Return base_url or baseUrl if present, else null. Used when baseUrl is optional (e.g. test endpoint).
     */
    public static String getBaseUrlOrNull(Map<String, Object> config) {
        if (config == null) return null;
        Object o = config.get("base_url");
        if (o == null) o = config.get("baseUrl");
        return ObjectUtils.toStringOrDefault(o, null);
    }

    public static String getApiKey(Map<String, Object> config) {
        if (config != null) {
            Object o = config.get("api_key");
            if (o == null) o = config.get("apiKey");
            if (o != null && !o.toString().isBlank()) return o.toString();
        }
        return null;
    }

    /**
     * Check if any LLM API key is available in config or environment.
     * Use for pre-execution validation (e.g. ExecutionOrchestratorService).
     */
    public static boolean hasAnyApiKey(Map<String, Object> config, Environment env) {
        String key = getApiKeyWithEnvFallback(config != null ? config : Map.of(), env);
        return key != null && !key.isBlank();
    }

    /**
     * Get API key from config, or from environment (OPENAI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY).
     * DIP: Prefer overload with Environment parameter.
     */
    public static String getApiKeyWithEnvFallback(Map<String, Object> config) {
        return getApiKeyWithEnvFallback(config, null);
    }

    /**
     * Get API key from config, or from Environment properties. Uses System.getenv when env is null (e.g. tests).
     */
    public static String getApiKeyWithEnvFallback(Map<String, Object> config, Environment env) {
        String key = getApiKey(config);
        if (key != null) return key;
        if (env != null) {
            key = env.getProperty("OPENAI_API_KEY");
            if (key != null) return key;
            key = env.getProperty("GEMINI_API_KEY");
            if (key != null) return key;
            key = env.getProperty("GOOGLE_API_KEY");
            return key;
        }
        key = System.getenv("OPENAI_API_KEY");
        if (key != null) return key;
        key = System.getenv("GEMINI_API_KEY");
        if (key != null) return key;
        return System.getenv("GOOGLE_API_KEY");
    }

    public static String getModel(Map<String, Object> config) {
        if (config == null) return DEFAULT_MODEL;
        Object o = config.get("model");
        if (o == null) o = config.get("defaultModel");
        return ObjectUtils.toStringOrDefault(o, DEFAULT_MODEL);
    }

    /**
     * Build chat completions URL, handling trailing slash.
     */
    public static String buildChatCompletionsUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) return DEFAULT_BASE_URL + "/chat/completions";
        if (baseUrl.contains("/chat/completions")) return baseUrl;
        return baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
    }

    /**
     * Return baseUrl if non-blank, else defaultWhenNull. Used by LlmTestService for provider-specific defaults.
     */
    public static String normalizeBaseUrl(String baseUrl, String defaultWhenNull) {
        if (baseUrl != null && !baseUrl.isBlank()) return baseUrl;
        return ObjectUtils.orDefault(defaultWhenNull, DEFAULT_BASE_URL);
    }
}
