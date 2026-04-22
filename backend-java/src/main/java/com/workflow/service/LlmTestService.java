package com.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.config.LlmProviderConfig;
import com.workflow.util.ErrorMessages;
import com.workflow.util.LlmConfigUtils;
import com.workflow.util.ObjectUtils;
import com.workflow.util.LlmErrorResponseBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

/**
 * Service for testing LLM provider connections.
 * Uses provider registry (OCP), shared HTTP helper (DRY), and configurable URLs.
 */
@Service
public class LlmTestService {
    private static final Logger log = LoggerFactory.getLogger(LlmTestService.class);

    private final LlmProviderConfig.LlmProviderUrls providerUrls;
    private final Map<String, ProviderTester> providerRegistry;
    private final ObjectMapper objectMapper;

    @FunctionalInterface
    private interface ProviderTester {
        Map<String, String> test(String apiKey, String baseUrl, String model);
    }

    public LlmTestService(LlmProviderConfig.LlmProviderUrls providerUrls, ObjectMapper objectMapper) {
        this.providerUrls = providerUrls;
        this.objectMapper = objectMapper;
        providerRegistry = Map.of(
                "openai", this::testOpenAi,
                "anthropic", this::testAnthropic,
                "gemini", this::testGemini,
                "custom", this::testCustom
        );
    }

    /**
     * Test provider by type - OCP: new providers via registry.
     */
    public Map<String, String> testProvider(String type, String apiKey, String baseUrl, String model) {
        var tester = providerRegistry.get(ObjectUtils.orDefaultIfBlank(type, "").toLowerCase());
        if (tester == null) {
            return LlmErrorResponseBuilder.error(ErrorMessages.unknownProviderType(type));
        }
        return tester.test(apiKey, baseUrl, model);
    }

    public Map<String, String> testOpenAi(String apiKey, String baseUrl, String model) {
        String url = LlmConfigUtils.buildChatCompletionsUrl(LlmConfigUtils.normalizeBaseUrl(baseUrl, providerUrls.getOpenai()));
        return testOpenAiCompatible(url, apiKey, model);
    }

    public Map<String, String> testAnthropic(String apiKey, String baseUrl, String model) {
        String url = LlmConfigUtils.normalizeBaseUrl(baseUrl, providerUrls.getAnthropic()) + "/messages";
        return httpPost(url, Map.of(
                "x-api-key", apiKey,
                "anthropic-version", "2023-06-01",
                "Content-Type", "application/json"
        ), buildOpenAiCompatiblePayload(model, 5));
    }

    public Map<String, String> testGemini(String apiKey, String baseUrl, String model) {
        String bUrl = LlmConfigUtils.normalizeBaseUrl(baseUrl, providerUrls.getGemini());
        String encodedModel = URLEncoder.encode(model != null ? model : "", StandardCharsets.UTF_8);
        String encodedKey = URLEncoder.encode(apiKey != null ? apiKey : "", StandardCharsets.UTF_8);
        String url = bUrl + "/models/" + encodedModel + ":generateContent?key=" + encodedKey;
        return httpPost(url, Map.of("Content-Type", "application/json"),
                buildGeminiPayload(5));
    }

    public Map<String, String> testCustom(String apiKey, String baseUrl, String model) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return LlmErrorResponseBuilder.error(ErrorMessages.BASE_URL_REQUIRED_CUSTOM);
        }
        String url = LlmConfigUtils.buildChatCompletionsUrl(baseUrl);
        return testOpenAiCompatible(url, apiKey, model);
    }

    private Map<String, String> testOpenAiCompatible(String url, String apiKey, String model) {
        return httpPost(url, Map.of(
                "Authorization", "Bearer " + apiKey,
                "Content-Type", "application/json"
        ), buildOpenAiCompatiblePayload(model, 5));
    }

    private String buildOpenAiCompatiblePayload(String model, int maxTokens) {
        try {
            Map<String, Object> payload = Map.of(
                    "model", ObjectUtils.orDefaultIfBlank(model, ""),
                    "messages", List.of(Map.of("role", "user", "content", "Hello")),
                    "max_tokens", maxTokens
            );
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.warn("Failed to build OpenAI payload: {}", e.getMessage());
            throw new IllegalStateException(ErrorMessages.UNEXPECTED_ERROR);
        }
    }

    private String buildGeminiPayload(int maxOutputTokens) {
        try {
            Map<String, Object> payload = Map.of(
                    "contents",
                    List.of(
                            Map.of(
                                    "role",
                                    "user",
                                    "parts",
                                    List.of(Map.of("text", "Hello")))),
                    "generationConfig", Map.of("maxOutputTokens", maxOutputTokens));
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.warn("Failed to build Gemini payload: {}", e.getMessage());
            throw new IllegalStateException(ErrorMessages.UNEXPECTED_ERROR);
        }
    }

    /**
     * Shared HTTP POST helper (DRY).
     */
    private Map<String, String> httpPost(String url, Map<String, String> headers, String body) {
        try {
            var builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .POST(HttpRequest.BodyPublishers.ofString(body));
            for (var e : headers.entrySet()) {
                builder.header(e.getKey(), e.getValue());
            }
            var request = builder.build();
            var response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return Map.of("status", "success", "message", ErrorMessages.CONNECTED_SUCCESSFULLY);
            }
            log.warn("LLM test API error {}: {}", response.statusCode(), response.body());
            return LlmErrorResponseBuilder.error(ErrorMessages.llmApiError(response.statusCode()));
        } catch (Exception e) {
            log.warn("LLM test HTTP request failed: {}", e.getMessage());
            return LlmErrorResponseBuilder.error(ErrorMessages.UNEXPECTED_ERROR);
        }
    }
}
