package com.workflow.service;

import com.workflow.entity.Settings;
import com.workflow.repository.SettingsRepository;
import com.workflow.util.JsonStateUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for LLM/settings business logic - matches Python settings_routes and SettingsService
 * Handles LLM provider configuration for workflow execution and chat
 */
@Service
@Transactional
public class SettingsService {
    private static final Logger log = LoggerFactory.getLogger(SettingsService.class);

    private final SettingsRepository settingsRepository;

    public SettingsService(SettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getSettings(String userId) {
        return settingsRepository.findById(userId != null ? userId : "anonymous")
                .map(s -> s.getSettingsData() != null ? s.getSettingsData() : Map.<String, Object>of());
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getActiveLlmConfig(String userId) {
        Optional<Map<String, Object>> settings = getSettings(userId);
        if (settings.isEmpty()) {
            return Optional.empty();
        }
        List<Map<String, Object>> providers = JsonStateUtils.getListOfMaps(settings.get(), "providers");
        if (providers.isEmpty()) {
            return Optional.empty();
        }
        return providers.stream()
                .filter(p -> Boolean.TRUE.equals(p.get("enabled")))
                .findFirst()
                .map(this::providerToLlmConfig);
    }

    public void saveSettings(String userId, Map<String, Object> settingsData) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        Settings settings = settingsRepository.findById(effectiveUserId)
                .orElse(new Settings());
        settings.setUserId(effectiveUserId);
        settings.setSettingsData(settingsData != null ? new HashMap<>(settingsData) : new HashMap<>());
        settingsRepository.save(settings);
        log.info("Saved settings for user: {}", effectiveUserId);
    }

    private Map<String, Object> providerToLlmConfig(Map<String, Object> provider) {
        Map<String, Object> config = new HashMap<>();
        config.put("type", provider.get("type"));
        config.put("api_key", provider.get("apiKey"));
        config.put("base_url", provider.get("baseUrl"));
        config.put("model", provider.getOrDefault("defaultModel", provider.get("model")));
        return config;
    }
}
