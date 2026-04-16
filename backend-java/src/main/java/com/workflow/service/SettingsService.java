package com.workflow.service;

import com.workflow.entity.Settings;
import com.workflow.repository.SettingsRepository;
import com.workflow.util.JsonStateUtils;
import com.workflow.util.LlmConfigUtils;
import com.workflow.util.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Service for LLM/settings business logic - matches Python settings_routes and SettingsService
 * Handles LLM provider configuration for workflow execution and chat
 */
@Service
@Transactional
public class SettingsService {
    private static final Logger log = LoggerFactory.getLogger(SettingsService.class);
    private static final String ANONYMOUS_USER_ID = "anonymous";

    private final SettingsRepository settingsRepository;

    public SettingsService(SettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getSettings(String userId) {
        return settingsRepository.findById(Objects.requireNonNullElse(userId, ANONYMOUS_USER_ID))
                .map(s -> ObjectUtils.orEmptyMap(s.getSettingsData()));
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getActiveLlmConfig(String userId) {
        Optional<Map<String, Object>> settings = getSettings(userId);
        if (settings.isEmpty()) {
            return Optional.empty();
        }
        Map<String, Object> s = settings.get();
        Object dm = s.get("default_model");
        if (dm == null) {
            dm = s.get("defaultModel");
        }
        if (dm != null) {
            String defaultModel = String.valueOf(dm).trim();
            if (!defaultModel.isEmpty()) {
                Optional<Map<String, Object>> byModel = getProviderConfigForModel(userId, defaultModel);
                if (byModel.isPresent()) {
                    return byModel;
                }
            }
        }
        List<Map<String, Object>> providers = JsonStateUtils.getListOfMaps(s, "providers");
        if (providers.isEmpty()) {
            return Optional.empty();
        }
        return providers.stream()
                .filter(p -> Boolean.TRUE.equals(p.get("enabled")))
                .findFirst()
                .map(this::providerToLlmConfig);
    }

    /**
     * LLM config for workflow chat (Python {@code get_llm_config_for_workflow_chat}): optional {@code chat_assistant_model}
     * in stored settings selects a provider via {@link #getProviderConfigForModel}; unknown model falls back to
     * {@link #getActiveLlmConfig}.
     */
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getLlmConfigForWorkflowChat(String userId) {
        Optional<Map<String, Object>> settings = getSettings(userId);
        if (settings.isEmpty()) {
            return getActiveLlmConfig(userId);
        }
        Map<String, Object> s = settings.get();
        Object chatRaw = s.get("chat_assistant_model");
        if (chatRaw == null) {
            chatRaw = s.get("chatAssistantModel");
        }
        if (chatRaw != null) {
            String chatModel = String.valueOf(chatRaw).trim();
            if (!chatModel.isEmpty()) {
                Optional<Map<String, Object>> byModel = getProviderConfigForModel(userId, chatModel);
                if (byModel.isPresent()) {
                    log.info(
                            "Workflow chat using chat_assistant_model={} for user {}",
                            chatModel,
                            Objects.requireNonNullElse(userId, ANONYMOUS_USER_ID));
                    return byModel;
                }
                log.warn(
                        "chat_assistant_model {} not found on any enabled provider for user {}; falling back to default LLM config",
                        chatModel,
                        Objects.requireNonNullElse(userId, ANONYMOUS_USER_ID));
            }
        }
        return getActiveLlmConfig(userId);
    }

    /**
     * Resolve stored provider config for a model id (Python {@code get_provider_for_model} / {@code _find_provider_with_model}):
     * first enabled provider whose {@code models} list contains the model (case-insensitive).
     */
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getProviderConfigForModel(String userId, String modelName) {
        if (modelName == null || modelName.isBlank()) {
            return Optional.empty();
        }
        Optional<Map<String, Object>> settings = getSettings(userId);
        if (settings.isEmpty()) {
            return Optional.empty();
        }
        String targetNorm = modelName.trim().toLowerCase(Locale.ROOT);
        List<Map<String, Object>> providers = JsonStateUtils.getListOfMaps(settings.get(), "providers");
        for (Map<String, Object> provider : providers) {
            if (!Boolean.TRUE.equals(provider.get("enabled"))) {
                continue;
            }
            Object apiKey = provider.get("apiKey");
            if (apiKey == null || apiKey.toString().isBlank()) {
                continue;
            }
            List<String> models = JsonStateUtils.getStringList(provider, "models");
            String matched = findMatchingModelName(models, targetNorm);
            if (matched == null) {
                continue;
            }
            return Optional.of(buildProviderLlmConfig(provider, matched));
        }
        return Optional.empty();
    }

    public void saveSettings(String userId, Map<String, Object> settingsData) {
        String effectiveUserId = Objects.requireNonNullElse(userId, ANONYMOUS_USER_ID);
        Settings settings = settingsRepository.findById(effectiveUserId)
                .orElse(new Settings());
        settings.setUserId(effectiveUserId);
        settings.setSettingsData(new HashMap<>(ObjectUtils.orEmptyMap(settingsData)));
        settingsRepository.save(settings);
        log.info("Saved settings for user: {}", effectiveUserId);
    }

    /**
     * Optional workflow-chat iteration cap from stored settings (Python {@code user_settings.iteration_limit}).
     */
    @Transactional(readOnly = true)
    public Optional<Integer> getChatIterationLimit(String userId) {
        return getSettings(userId)
                .map(s -> s.get("iteration_limit"))
                .map(o -> {
                    if (o instanceof Number n) {
                        return n.intValue();
                    }
                    try {
                        return Integer.parseInt(String.valueOf(o));
                    } catch (NumberFormatException e) {
                        return null;
                    }
                })
                .filter(v -> v != null);
    }

    private Map<String, Object> providerToLlmConfig(Map<String, Object> provider) {
        Object dm = provider.get("defaultModel");
        Object fm = provider.get("model");
        String model = ObjectUtils.toStringOrDefault(dm != null ? dm : fm, LlmConfigUtils.DEFAULT_MODEL);
        return buildProviderLlmConfig(provider, model);
    }

    private static String findMatchingModelName(List<String> models, String targetNorm) {
        for (String m : models) {
            if (m == null) {
                continue;
            }
            String trimmed = m.trim();
            if (trimmed.toLowerCase(Locale.ROOT).equals(targetNorm)) {
                return trimmed;
            }
        }
        return null;
    }

    private Map<String, Object> buildProviderLlmConfig(Map<String, Object> provider, String model) {
        Map<String, Object> config = new HashMap<>();
        config.put("type", provider.get("type"));
        config.put("api_key", provider.get("apiKey"));
        config.put("base_url", provider.get("baseUrl"));
        config.put("model", model);
        return config;
    }
}
