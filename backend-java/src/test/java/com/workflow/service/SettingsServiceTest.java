package com.workflow.service;

import com.workflow.entity.Settings;
import com.workflow.repository.SettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * T-6: Tests for SettingsService - getActiveLlmConfig and provider selection.
 */
@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private SettingsRepository settingsRepository;

    private SettingsService settingsService;

    @BeforeEach
    void setUp() {
        settingsService = new SettingsService(settingsRepository);
    }

    @Test
    void getActiveLlmConfig_noSettings_returnsEmpty() {
        when(settingsRepository.findById("user-1")).thenReturn(Optional.empty());

        Optional<Map<String, Object>> result = settingsService.getActiveLlmConfig("user-1");

        assertTrue(result.isEmpty());
    }

    @Test
    void getActiveLlmConfig_noProviders_returnsEmpty() {
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of())));

        Optional<Map<String, Object>> result = settingsService.getActiveLlmConfig("user-1");

        assertTrue(result.isEmpty());
    }

    @Test
    void getActiveLlmConfig_providersNotList_returnsEmpty() {
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of("providers", "not-a-list"))));

        Optional<Map<String, Object>> result = settingsService.getActiveLlmConfig("user-1");

        assertTrue(result.isEmpty());
    }

    @Test
    void getActiveLlmConfig_firstEnabledProvider_returned() {
        Map<String, Object> provider = Map.of(
                "type", "openai",
                "enabled", true,
                "apiKey", "sk-test",
                "baseUrl", "https://api.openai.com/v1",
                "model", "gpt-4o-mini"
        );
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of("providers", List.of(provider)))));

        Optional<Map<String, Object>> result = settingsService.getActiveLlmConfig("user-1");

        assertTrue(result.isPresent());
        assertEquals("openai", result.get().get("type"));
        assertEquals("sk-test", result.get().get("api_key"));
        assertEquals("https://api.openai.com/v1", result.get().get("base_url"));
        assertEquals("gpt-4o-mini", result.get().get("model"));
    }

    @Test
    void getActiveLlmConfig_skipsDisabledProviders() {
        Map<String, Object> disabled = Map.of("type", "openai", "enabled", false);
        Map<String, Object> enabled = Map.of(
                "type", "anthropic",
                "enabled", true,
                "apiKey", "sk-ant",
                "model", "claude-3"
        );
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of("providers", List.of(disabled, enabled)))));

        Optional<Map<String, Object>> result = settingsService.getActiveLlmConfig("user-1");

        assertTrue(result.isPresent());
        assertEquals("anthropic", result.get().get("type"));
    }

    @Test
    void getActiveLlmConfig_allDisabled_returnsEmpty() {
        Map<String, Object> p1 = Map.of("type", "openai", "enabled", false);
        Map<String, Object> p2 = Map.of("type", "anthropic", "enabled", false);
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of("providers", List.of(p1, p2)))));

        Optional<Map<String, Object>> result = settingsService.getActiveLlmConfig("user-1");

        assertTrue(result.isEmpty());
    }

    @Test
    void getActiveLlmConfig_usesDefaultModelWhenPresent() {
        Map<String, Object> provider = Map.of(
                "type", "openai",
                "enabled", true,
                "apiKey", "sk-test",
                "model", "gpt-4",
                "defaultModel", "gpt-4o-mini"
        );
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of("providers", List.of(provider)))));

        Optional<Map<String, Object>> result = settingsService.getActiveLlmConfig("user-1");

        assertTrue(result.isPresent());
        assertEquals("gpt-4o-mini", result.get().get("model"));
    }

    @Test
    void getActiveLlmConfig_prefersTopLevelDefaultModelWhenListedOnProvider() {
        Map<String, Object> provider = new HashMap<>();
        provider.put("type", "openai");
        provider.put("enabled", true);
        provider.put("apiKey", "sk-test");
        provider.put("baseUrl", "https://api.openai.com/v1");
        provider.put("defaultModel", "gpt-4o-mini");
        provider.put("models", List.of("gpt-4o-mini", "gpt-4o"));
        Map<String, Object> data = new HashMap<>();
        data.put("providers", List.of(provider));
        data.put("default_model", "gpt-4o");
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(data)));

        Optional<Map<String, Object>> result = settingsService.getActiveLlmConfig("user-1");

        assertTrue(result.isPresent());
        assertEquals("gpt-4o", result.get().get("model"));
    }

    @Test
    void getLlmConfigForWorkflowChat_usesChatAssistantModel() {
        Map<String, Object> provider = new HashMap<>();
        provider.put("type", "openai");
        provider.put("enabled", true);
        provider.put("apiKey", "sk-test");
        provider.put("baseUrl", "https://api.openai.com/v1");
        provider.put("defaultModel", "gpt-4o-mini");
        provider.put("models", List.of("gpt-4o-mini", "gpt-4o"));
        Map<String, Object> data = new HashMap<>();
        data.put("providers", List.of(provider));
        data.put("chat_assistant_model", "gpt-4o");
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(data)));

        Optional<Map<String, Object>> result = settingsService.getLlmConfigForWorkflowChat("user-1");

        assertTrue(result.isPresent());
        assertEquals("gpt-4o", result.get().get("model"));
    }

    @Test
    void getLlmConfigForWorkflowChat_unknownChatModel_fallsBackToActive() {
        Map<String, Object> provider = new HashMap<>();
        provider.put("type", "openai");
        provider.put("enabled", true);
        provider.put("apiKey", "sk-test");
        provider.put("baseUrl", "https://api.openai.com/v1");
        provider.put("defaultModel", "gpt-4o-mini");
        provider.put("models", List.of("gpt-4o-mini", "gpt-4o"));
        Map<String, Object> data = new HashMap<>();
        data.put("providers", List.of(provider));
        data.put("chat_assistant_model", "unknown-model-xyz");
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(data)));

        Optional<Map<String, Object>> result = settingsService.getLlmConfigForWorkflowChat("user-1");

        assertTrue(result.isPresent());
        assertEquals("gpt-4o-mini", result.get().get("model"));
    }

    @Test
    void getLlmConfigForWorkflowChat_emptyChatAssistantModel_usesActive() {
        Map<String, Object> provider = new HashMap<>();
        provider.put("type", "openai");
        provider.put("enabled", true);
        provider.put("apiKey", "sk-test");
        provider.put("baseUrl", "https://api.openai.com/v1");
        provider.put("defaultModel", "gpt-4o-mini");
        provider.put("models", List.of("gpt-4o-mini", "gpt-4o"));
        Map<String, Object> data = new HashMap<>();
        data.put("providers", List.of(provider));
        data.put("chat_assistant_model", "");
        data.put("default_model", "gpt-4o");
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(data)));

        Optional<Map<String, Object>> result = settingsService.getLlmConfigForWorkflowChat("user-1");

        assertTrue(result.isPresent());
        assertEquals("gpt-4o", result.get().get("model"));
    }

    @Test
    void getProviderConfigForModel_blankModel_returnsEmpty() {
        assertTrue(settingsService.getProviderConfigForModel("user-1", " ").isEmpty());
        verifyNoInteractions(settingsRepository);
    }

    @Test
    void getProviderConfigForModel_noSettings_returnsEmpty() {
        when(settingsRepository.findById("user-1")).thenReturn(Optional.empty());

        assertTrue(settingsService.getProviderConfigForModel("user-1", "claude-3").isEmpty());
    }

    @Test
    void getProviderConfigForModel_findsEnabledProviderWithModel_caseInsensitive() {
        Map<String, Object> anthropic = new HashMap<>();
        anthropic.put("type", "anthropic");
        anthropic.put("enabled", true);
        anthropic.put("apiKey", "sk-ant");
        anthropic.put("baseUrl", "https://api.anthropic.com/v1");
        anthropic.put("models", List.of("claude-3-5-sonnet-20241022"));
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of("providers", List.of(anthropic)))));

        Optional<Map<String, Object>> result =
                settingsService.getProviderConfigForModel("user-1", "CLAUDE-3-5-SONNET-20241022");

        assertTrue(result.isPresent());
        assertEquals("anthropic", result.get().get("type"));
        assertEquals("sk-ant", result.get().get("api_key"));
        assertEquals("https://api.anthropic.com/v1", result.get().get("base_url"));
        assertEquals("claude-3-5-sonnet-20241022", result.get().get("model"));
    }

    @Test
    void getProviderConfigForModel_skipsDisabledAndMissingApiKey() {
        Map<String, Object> disabled = new HashMap<>();
        disabled.put("type", "anthropic");
        disabled.put("enabled", false);
        disabled.put("apiKey", "x");
        disabled.put("models", List.of("claude-x"));
        Map<String, Object> noKey = new HashMap<>();
        noKey.put("type", "anthropic");
        noKey.put("enabled", true);
        noKey.put("models", List.of("claude-x"));
        Map<String, Object> ok = new HashMap<>();
        ok.put("type", "gemini");
        ok.put("enabled", true);
        ok.put("apiKey", "g-key");
        ok.put("models", List.of("gemini-pro"));
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of("providers", List.of(disabled, noKey, ok)))));

        Optional<Map<String, Object>> result = settingsService.getProviderConfigForModel("user-1", "gemini-pro");

        assertTrue(result.isPresent());
        assertEquals("gemini", result.get().get("type"));
        assertEquals("g-key", result.get().get("api_key"));
    }

    @Test
    void getProviderConfigForModel_noMatchingModel_returnsEmpty() {
        Map<String, Object> p = new HashMap<>();
        p.put("type", "openai");
        p.put("enabled", true);
        p.put("apiKey", "sk");
        p.put("models", List.of("gpt-4o"));
        when(settingsRepository.findById("user-1"))
                .thenReturn(Optional.of(settingsWithData(Map.of("providers", List.of(p)))));

        assertTrue(settingsService.getProviderConfigForModel("user-1", "gpt-5").isEmpty());
    }

    private static Settings settingsWithData(Map<String, Object> data) {
        Settings s = new Settings();
        s.setUserId("user-1");
        s.setSettingsData(data);
        return s;
    }
}
