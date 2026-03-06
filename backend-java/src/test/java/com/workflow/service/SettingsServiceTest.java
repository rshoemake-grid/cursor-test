package com.workflow.service;

import com.workflow.entity.Settings;
import com.workflow.repository.SettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    private static Settings settingsWithData(Map<String, Object> data) {
        Settings s = new Settings();
        s.setUserId("user-1");
        s.setSettingsData(data);
        return s;
    }
}
