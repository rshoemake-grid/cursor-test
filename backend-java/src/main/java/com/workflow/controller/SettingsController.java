package com.workflow.controller;

import com.workflow.service.LlmTestService;
import com.workflow.service.SettingsService;
import com.workflow.util.AuthenticationHelper;
import com.workflow.util.ErrorMessages;
import com.workflow.util.LlmConfigUtils;
import com.workflow.util.ErrorResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
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
    private final LlmTestService llmTestService;
    private final AuthenticationHelper authenticationHelper;

    public SettingsController(SettingsService settingsService,
                             LlmTestService llmTestService,
                             AuthenticationHelper authenticationHelper) {
        this.settingsService = settingsService;
        this.llmTestService = llmTestService;
        this.authenticationHelper = authenticationHelper;
    }

    @PostMapping("/llm")
    @Operation(summary = "Save LLM Settings", description = "Save LLM provider settings")
    public ResponseEntity<Map<String, String>> saveLlmSettings(
            @RequestBody Map<String, Object> settings,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        settingsService.saveSettings(userId, settings);
        return ResponseEntity.ok(Map.of("status", "success", "message", ErrorMessages.SETTINGS_SAVED_SUCCESS));
    }

    @GetMapping("/llm")
    @Operation(summary = "Get LLM Settings", description = "Get LLM provider settings")
    public ResponseEntity<?> getLlmSettings(Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        return settingsService.getSettings(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("providers", java.util.List.of())));
    }

    @PostMapping("/llm/test")
    @Operation(summary = "Test LLM Connection", description = "Test LLM provider connection (S-H4: requires auth)")
    public ResponseEntity<?> testLlmConnection(
            @RequestBody Map<String, Object> testRequest,
            Authentication authentication,
            HttpServletRequest request) {
        authenticationHelper.extractUserIdRequired(authentication);

        String type = (String) testRequest.get("type");
        String apiKey = LlmConfigUtils.getApiKey(testRequest);
        String baseUrl = LlmConfigUtils.getBaseUrlOrNull(testRequest);
        String model = (String) testRequest.get("model");

        if (type == null || apiKey == null || model == null) {
            return ErrorResponseBuilder.badRequest(ErrorMessages.LLM_TEST_REQUIRED_FIELDS, request.getRequestURI());
        }

        try {
            Map<String, String> result = llmTestService.testProvider(type, apiKey, baseUrl, model);
            if ("error".equals(result.get("status"))) {
                String message = result.getOrDefault("message", ErrorMessages.UNEXPECTED_ERROR);
                return ErrorResponseBuilder.validationError(message, request.getRequestURI());
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.warn("LLM test failed: {}", e.getMessage());
            return ErrorResponseBuilder.validationError(ErrorMessages.UNEXPECTED_ERROR, request.getRequestURI());
        }
    }
}
