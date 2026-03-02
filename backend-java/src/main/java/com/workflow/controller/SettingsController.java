package com.workflow.controller;

import com.workflow.service.SettingsService;
import com.workflow.util.AuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Settings Controller - matches Python settings_routes.py
 * Endpoints: /api/settings
 */
@RestController
@RequestMapping("/api/settings")
@Tag(name = "Settings", description = "LLM provider settings")
public class SettingsController {
    private static final Logger log = LoggerFactory.getLogger(SettingsController.class);

    private final SettingsService settingsService;
    private final AuthenticationHelper authenticationHelper;

    public SettingsController(SettingsService settingsService,
                             AuthenticationHelper authenticationHelper) {
        this.settingsService = settingsService;
        this.authenticationHelper = authenticationHelper;
    }

    @PostMapping("/llm")
    @Operation(summary = "Save LLM Settings", description = "Save LLM provider settings")
    public ResponseEntity<Map<String, String>> saveLlmSettings(
            @RequestBody Map<String, Object> settings,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required to save settings"));
        }

        settingsService.saveSettings(userId, settings);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Settings saved successfully"));
    }

    @GetMapping("/llm")
    @Operation(summary = "Get LLM Settings", description = "Get LLM provider settings")
    public ResponseEntity<?> getLlmSettings(Authentication authentication) {
        String userId = authenticationHelper.extractUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required to view settings"));
        }

        return settingsService.getSettings(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("providers", java.util.List.of())));
    }

    @PostMapping("/llm/test")
    @Operation(summary = "Test LLM Connection", description = "Test LLM provider connection")
    public ResponseEntity<Map<String, String>> testLlmConnection(@RequestBody Map<String, Object> testRequest) {
        String type = (String) testRequest.get("type");
        String apiKey = (String) testRequest.getOrDefault("api_key", testRequest.get("apiKey"));
        String baseUrl = (String) testRequest.getOrDefault("base_url", testRequest.get("baseUrl"));
        String model = (String) testRequest.get("model");

        if (type == null || apiKey == null || model == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "type, api_key, and model are required"));
        }

        try {
            Map<String, String> result = switch (type) {
                case "openai" -> testOpenAi(apiKey, baseUrl, model);
                case "anthropic" -> testAnthropic(apiKey, baseUrl, model);
                case "gemini" -> testGemini(apiKey, baseUrl, model);
                case "custom" -> testCustom(apiKey, baseUrl, model);
                default -> Map.of("status", "error", "message", "Unknown provider type: " + type);
            };
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.warn("LLM test failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    private Map<String, String> testOpenAi(String apiKey, String baseUrl, String model) {
        String url = (baseUrl != null ? baseUrl : "https://api.openai.com/v1") + "/chat/completions";
        return testOpenAiCompatible(url, apiKey, model);
    }

    private Map<String, String> testAnthropic(String apiKey, String baseUrl, String model) {
        // Anthropic has different API - simplified stub
        return Map.of("status", "success", "message", "Connection test not implemented for Anthropic");
    }

    private Map<String, String> testGemini(String apiKey, String baseUrl, String model) {
        String bUrl = baseUrl != null ? baseUrl : "https://generativelanguage.googleapis.com/v1beta";
        String url = bUrl + "/models/" + model + ":generateContent?key=" + apiKey;
        try {
            var client = java.net.http.HttpClient.newHttpClient();
            var request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(
                            "{\"contents\":[{\"parts\":[{\"text\":\"Hello\"}]}],\"generationConfig\":{\"maxOutputTokens\":5}}"))
                    .build();
            var response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return Map.of("status", "success", "message", "Connected successfully!");
            }
            return Map.of("status", "error", "message", "API error " + response.statusCode() + ": " + response.body().substring(0, Math.min(200, response.body().length())));
        } catch (Exception e) {
            return Map.of("status", "error", "message", "Error: " + e.getMessage());
        }
    }

    private Map<String, String> testCustom(String apiKey, String baseUrl, String model) {
        if (baseUrl == null) {
            return Map.of("status", "error", "message", "base_url is required for custom providers");
        }
        return testOpenAiCompatible(baseUrl + "/chat/completions", apiKey, model);
    }

    private Map<String, String> testOpenAiCompatible(String url, String apiKey, String model) {
        try {
            var client = java.net.http.HttpClient.newHttpClient();
            var request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(
                            "{\"model\":\"" + model + "\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":5}"))
                    .build();
            var response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return Map.of("status", "success", "message", "Connected successfully!");
            }
            return Map.of("status", "error", "message", "API error " + response.statusCode());
        } catch (Exception e) {
            return Map.of("status", "error", "message", "Error: " + e.getMessage());
        }
    }
}
