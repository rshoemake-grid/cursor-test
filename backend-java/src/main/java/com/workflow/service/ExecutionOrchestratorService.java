package com.workflow.service;

import com.workflow.dto.ExecutionRequest;
import com.workflow.dto.ExecutionResponse;
import com.workflow.dto.ExecutionStatus;
import com.workflow.entity.Execution;
import com.workflow.engine.WorkflowExecutor;
import com.workflow.util.EnvironmentUtils;
import com.workflow.util.ObjectUtils;
import com.workflow.repository.ExecutionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Orchestrates workflow execution - matches Python ExecutionOrchestrator
 * SRP: Delegates validation/creation to ExecutionCreationService; focuses on background execution.
 * S-M3: In production, sanitize error details in execution state
 */
@Service
public class ExecutionOrchestratorService {
    private static final Logger log = LoggerFactory.getLogger(ExecutionOrchestratorService.class);
    private static final String GENERIC_ERROR_MESSAGE = "Execution failed";

    private final ExecutionCreationService executionCreationService;
    private final ExecutionRepository executionRepository;
    private final ExecutionService executionService;
    private final WorkflowService workflowService;
    private final SettingsService settingsService;
    private final WorkflowExecutor workflowExecutor;
    private final Environment environment;

    public ExecutionOrchestratorService(ExecutionCreationService executionCreationService,
                                       ExecutionRepository executionRepository,
                                       ExecutionService executionService,
                                       WorkflowService workflowService,
                                       SettingsService settingsService,
                                       WorkflowExecutor workflowExecutor,
                                       Environment environment) {
        this.executionCreationService = executionCreationService;
        this.executionRepository = executionRepository;
        this.executionService = executionService;
        this.workflowService = workflowService;
        this.settingsService = settingsService;
        this.workflowExecutor = workflowExecutor;
        this.environment = environment;
    }

    @Transactional
    public ExecutionResponse executeWorkflow(String workflowId, String userId, ExecutionRequest request) {
        Execution execution = executionCreationService.validateAndCreate(workflowId, userId);
        String executionId = execution.getId();

        Map<String, Object> inputs = ObjectUtils.orDefault(
                request != null ? request.getInputs() : null, Map.of());

        log.info("Created execution {} for workflow {}", executionId, workflowId);

        runExecutionInBackground(executionId, workflowId, userId, inputs);

        return new ExecutionResponse(
                executionId,
                workflowId,
                ExecutionStatus.RUNNING.getValue(),
                null,
                null,
                null,
                execution.getStartedAt(),
                null,
                List.of()
        );
    }

    @Async
    public void runExecutionInBackground(String executionId, String workflowId, String userId,
                                         Map<String, Object> inputs) {
        try {
            log.info("Starting background execution for {}", executionId);

            // Simplified executor: process workflow and update state
            Map<String, Object> state = executeWorkflowInternal(workflowId, userId, inputs);

            Execution execution = executionRepository.findById(executionId).orElse(null);
            if (execution != null) {
                execution.setStatus((String) state.getOrDefault("status", ExecutionStatus.COMPLETED.getValue()));
                execution.setState(state);
                execution.setCompletedAt(LocalDateTime.now());
                executionRepository.save(execution);
            }
        } catch (Exception e) {
            log.error("Background execution {} failed: {}", executionId, e.getMessage(), e);
            String errorMessage = EnvironmentUtils.isProduction(environment) ? GENERIC_ERROR_MESSAGE
                    : ObjectUtils.orDefault(e.getMessage(), GENERIC_ERROR_MESSAGE);
            String logMessage = GENERIC_ERROR_MESSAGE.equals(errorMessage)
                    ? errorMessage : "Execution failed: " + errorMessage;
            executionService.appendLogAndUpdateExecutionState(executionId, userId, "ERROR", null, logMessage,
                    ExecutionStatus.FAILED.getValue(), errorMessage);
        }
    }

    private Map<String, Object> executeWorkflowInternal(String workflowId, String userId,
                                                        Map<String, Object> inputs) {
        var workflowResponse = workflowService.getWorkflow(workflowId, userId);
        var llmConfig = settingsService.getActiveLlmConfig(userId).orElse(Map.of());
        return workflowExecutor.execute(workflowResponse, inputs, llmConfig, userId);
    }
}
