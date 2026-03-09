package com.workflow.service;

import com.workflow.config.LlmProviderConfig;
import com.workflow.util.LlmConfigUtils;
import com.workflow.util.ObjectUtils;
import com.workflow.util.LlmErrorResponseBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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

    @FunctionalInterface
    private interface ProviderTester {
        Map<String, String> test(String apiKey, String baseUrl, String model);
    }

    public LlmTestService(LlmProviderConfig.LlmProviderUrls providerUrls) {
        this.providerUrls = providerUrls;
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
            return LlmErrorResponseBuilder.error("Unknown provider type: " + type);
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
        String url = bUrl + "/models/" + model + ":generateContent?key=" + apiKey;
        return httpPost(url, Map.of("Content-Type", "application/json"),
                buildGeminiPayload(5));
    }

    public Map<String, String> testCustom(String apiKey, String baseUrl, String model) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return LlmErrorResponseBuilder.error("base_url is required for custom providers");
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

    private static String buildOpenAiCompatiblePayload(String model, int maxTokens) {
        return "{\"model\":\"" + model + "\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":" + maxTokens + "}";
    }

    private static String buildGeminiPayload(int maxOutputTokens) {
        return "{\"contents\":[{\"parts\":[{\"text\":\"Hello\"}]}],\"generationConfig\":{\"maxOutputTokens\":" + maxOutputTokens + "}}";
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
                return Map.of("status", "success", "message", "Connected successfully!");
            }
            String errBody = response.body();
            String errMsg = errBody != null && !errBody.isEmpty()
                    ? errBody.substring(0, Math.min(200, errBody.length()))
                    : "";
            return LlmErrorResponseBuilder.error("API error " + response.statusCode() + ": " + errMsg);
        } catch (Exception e) {
            return LlmErrorResponseBuilder.error("Error: " + java.util.Objects.requireNonNullElse(e.getMessage(), "Unknown error"));
        }
    }
}
