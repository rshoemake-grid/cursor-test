package com.workflow.service;

import com.workflow.entity.Execution;
import com.workflow.repository.ExecutionRepository;
import com.workflow.util.ExecutionFactory;
import com.workflow.util.LlmConfigUtils;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

/**
 * SRP: Handles execution validation and creation.
 * Extracted from ExecutionOrchestratorService to separate validation/creation from orchestration.
 */
@Service
public class ExecutionCreationService {

    private final WorkflowService workflowService;
    private final SettingsService settingsService;
    private final ExecutionRepository executionRepository;
    private final Environment environment;

    public ExecutionCreationService(WorkflowService workflowService,
                                    SettingsService settingsService,
                                    ExecutionRepository executionRepository,
                                    Environment environment) {
        this.workflowService = workflowService;
        this.settingsService = settingsService;
        this.executionRepository = executionRepository;
        this.environment = environment;
    }

    /**
     * Validate workflow access and LLM config, then create and save execution.
     *
     * @throws IllegalArgumentException if validation fails
     */
    @Transactional
    public Execution validateAndCreate(String workflowId, String userId) {
        validateWorkflowAccess(workflowId, userId);
        validateLlmConfig(userId);

        Execution execution = ExecutionFactory.createRunning(workflowId, userId);
        return executionRepository.save(execution);
    }

    /**
     * Validate user has access to workflow.
     */
    public void validateWorkflowAccess(String workflowId, String userId) {
        workflowService.getWorkflow(workflowId, userId);
    }

    /**
     * Validate LLM config is available (Settings or env vars).
     */
    public void validateLlmConfig(String userId) {
        Optional<Map<String, Object>> llmConfig = settingsService.getActiveLlmConfig(userId);
        if (llmConfig.isEmpty() && !LlmConfigUtils.hasAnyApiKey(Map.of(), environment)) {
            throw new IllegalArgumentException(
                    "No LLM provider configured. Please configure an LLM provider in Settings before executing workflows.");
        }
    }
}
