package com.workflow.util;

import org.springframework.core.env.Environment;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * DRY: Centralizes LLM config extraction and URL building used by AgentNodeExecutor and WorkflowChatService.
 */
public final class LlmConfigUtils {

    private static final String DEFAULT_BASE_URL = "https://api.openai.com/v1";
    /** Default model when none specified. Exposed for WebClientLlmApiClient fallback. */
    public static final String DEFAULT_MODEL = "gpt-4o-mini";

    private LlmConfigUtils() {
    }

    public static String getBaseUrl(Map<String, Object> config) {
        return getBaseUrlRaw(config, DEFAULT_BASE_URL);
    }

    /**
     * Return base_url or baseUrl if present, else null. Used when baseUrl is optional (e.g. test endpoint).
     */
    public static String getBaseUrlOrNull(Map<String, Object> config) {
        return getBaseUrlRaw(config, null);
    }

    private static String getBaseUrlRaw(Map<String, Object> config, String defaultWhenNull) {
        if (config == null) return defaultWhenNull;
        Object o = config.get("base_url");
        if (o == null) o = config.get("baseUrl");
        return ObjectUtils.toStringOrDefault(o, defaultWhenNull);
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
     * Validate that an API key is available; throw if not.
     */
    public static void validateApiKey(Map<String, Object> config, Environment env) {
        String key = getApiKeyWithEnvFallback(ObjectUtils.orEmptyMap(config), env);
        if (key == null || key.isBlank()) {
            throw new IllegalStateException(ErrorMessages.NO_LLM_API_KEY);
        }
    }

    /**
     * Check if any LLM API key is available in config or environment.
     * Use for pre-execution validation (e.g. ExecutionOrchestratorService).
     */
    public static boolean hasAnyApiKey(Map<String, Object> config, Environment env) {
        String key = getApiKeyWithEnvFallback(ObjectUtils.orEmptyMap(config), env);
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
     * Get API key from config, or from Environment properties.
     * When env is null, returns null (no System.getenv fallback). Production should always pass Environment.
     */
    public static String getApiKeyWithEnvFallback(Map<String, Object> config, Environment env) {
        String key = getApiKey(config);
        if (key != null) return key;
        if (env == null) return null;
        String type =
                ObjectUtils.toStringOrDefault(config != null ? config.get("type") : null, "openai")
                        .trim()
                        .toLowerCase(Locale.ROOT);
        return switch (type) {
            case "anthropic" -> firstNonBlank(env.getProperty("ANTHROPIC_API_KEY"));
            case "gemini" ->
                    firstNonBlank(env.getProperty("GEMINI_API_KEY"), env.getProperty("GOOGLE_API_KEY"));
            default ->
                    firstNonBlank(
                            env.getProperty("OPENAI_API_KEY"),
                            env.getProperty("GEMINI_API_KEY"),
                            env.getProperty("GOOGLE_API_KEY"));
        };
    }

    private static String firstNonBlank(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String c : candidates) {
            if (c != null && !c.isBlank()) {
                return c;
            }
        }
        return null;
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
     * Prepared LLM request context (url, apiKey, model). DRY: Used by AgentNodeExecutor and WorkflowChatService.
     */
    public record LlmRequestContext(String url, String apiKey, String model) {
    }

    /**
     * Validate config, extract url/apiKey/model. Throws if API key missing.
     */
    public static LlmRequestContext prepareRequest(Map<String, Object> config, Environment env) {
        validateApiKey(config, env);
        String baseUrl = getBaseUrl(ObjectUtils.orEmptyMap(config));
        String url = buildChatCompletionsUrl(baseUrl);
        String apiKey = getApiKeyWithEnvFallback(config, env);
        String model = getModel(config);
        return new LlmRequestContext(url, apiKey, model);
    }

    /**
     * Build a chat message map for OpenAI-compatible API. DRY: Used by AgentNodeExecutor and WorkflowChatService.
     */
    public static Map<String, Object> buildMessage(String role, String content) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("role", role);
        m.put("content", ObjectUtils.orDefault(content, ""));
        return m;
    }

    /**
     * Return baseUrl if non-blank, else defaultWhenNull. Used by LlmTestService for provider-specific defaults.
     */
    public static String normalizeBaseUrl(String baseUrl, String defaultWhenNull) {
        if (baseUrl != null && !baseUrl.isBlank()) return baseUrl;
        return ObjectUtils.orDefault(defaultWhenNull, DEFAULT_BASE_URL);
    }
}
