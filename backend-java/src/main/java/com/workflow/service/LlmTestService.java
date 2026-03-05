package com.workflow.service;

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
 * Uses provider registry (OCP) and shared HTTP helper (DRY).
 */
@Service
public class LlmTestService {
    private static final Logger log = LoggerFactory.getLogger(LlmTestService.class);

    private static final String URL_OPENAI = "https://api.openai.com/v1";
    private static final String URL_ANTHROPIC = "https://api.anthropic.com/v1";
    private static final String URL_GEMINI = "https://generativelanguage.googleapis.com/v1beta";

    private final Map<String, ProviderTester> providerRegistry;

    @FunctionalInterface
    private interface ProviderTester {
        Map<String, String> test(String apiKey, String baseUrl, String model);
    }

    public LlmTestService() {
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
        var tester = providerRegistry.get(type != null ? type.toLowerCase() : "");
        if (tester == null) {
            return Map.of("status", "error", "message", "Unknown provider type: " + type);
        }
        return tester.test(apiKey, baseUrl, model);
    }

    public Map<String, String> testOpenAi(String apiKey, String baseUrl, String model) {
        String url = (baseUrl != null && !baseUrl.isEmpty() ? baseUrl : URL_OPENAI) + "/chat/completions";
        return testOpenAiCompatible(url, apiKey, model);
    }

    public Map<String, String> testAnthropic(String apiKey, String baseUrl, String model) {
        String url = (baseUrl != null && !baseUrl.isEmpty() ? baseUrl : URL_ANTHROPIC) + "/messages";
        return httpPost(url, Map.of(
                "x-api-key", apiKey,
                "anthropic-version", "2023-06-01",
                "Content-Type", "application/json"
        ), "{\"model\":\"" + model + "\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":5}");
    }

    public Map<String, String> testGemini(String apiKey, String baseUrl, String model) {
        String bUrl = (baseUrl != null && !baseUrl.isEmpty() ? baseUrl : URL_GEMINI);
        String url = bUrl + "/models/" + model + ":generateContent?key=" + apiKey;
        return httpPost(url, Map.of("Content-Type", "application/json"),
                "{\"contents\":[{\"parts\":[{\"text\":\"Hello\"}]}],\"generationConfig\":{\"maxOutputTokens\":5}}");
    }

    public Map<String, String> testCustom(String apiKey, String baseUrl, String model) {
        if (baseUrl == null || baseUrl.isEmpty()) {
            return Map.of("status", "error", "message", "base_url is required for custom providers");
        }
        String url = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
        return testOpenAiCompatible(url, apiKey, model);
    }

    private Map<String, String> testOpenAiCompatible(String url, String apiKey, String model) {
        return httpPost(url, Map.of(
                "Authorization", "Bearer " + apiKey,
                "Content-Type", "application/json"
        ), "{\"model\":\"" + model + "\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":5}");
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
            return Map.of("status", "error", "message", "API error " + response.statusCode() + ": " + errMsg);
        } catch (Exception e) {
            return Map.of("status", "error", "message", "Error: " + e.getMessage());
        }
    }
}
