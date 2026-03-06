package com.workflow.service;

import com.workflow.dto.ExecutionRequest;
import com.workflow.dto.ExecutionResponse;
import com.workflow.dto.ExecutionStatus;
import com.workflow.entity.Execution;
import com.workflow.engine.WorkflowExecutor;
import com.workflow.util.JsonStateUtils;
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
 * Creates execution record and runs workflow in background
 * S-M3: In production, sanitize error details in execution state
 */
@Service
public class ExecutionOrchestratorService {
    private static final Logger log = LoggerFactory.getLogger(ExecutionOrchestratorService.class);
    private static final String GENERIC_ERROR_MESSAGE = "Execution failed";

    private final WorkflowService workflowService;
    private final ExecutionRepository executionRepository;
    private final SettingsService settingsService;
    private final WorkflowExecutor workflowExecutor;
    private final Environment environment;

    public ExecutionOrchestratorService(WorkflowService workflowService,
                                       ExecutionRepository executionRepository,
                                       SettingsService settingsService,
                                       WorkflowExecutor workflowExecutor,
                                       Environment environment) {
        this.workflowService = workflowService;
        this.executionRepository = executionRepository;
        this.settingsService = settingsService;
        this.workflowExecutor = workflowExecutor;
        this.environment = environment;
    }

    private boolean isProduction() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> "production".equalsIgnoreCase(p));
    }

    @Transactional
    public ExecutionResponse executeWorkflow(String workflowId, String userId, ExecutionRequest request) {
        // Validate workflow exists and user has access
        workflowService.getWorkflow(workflowId, userId);

        // Check for LLM config (required for agent nodes - optional for simple workflows)
        Optional<Map<String, Object>> llmConfig = settingsService.getActiveLlmConfig(userId);
        if (llmConfig.isEmpty() && System.getenv("GEMINI_API_KEY") == null && System.getenv("GOOGLE_API_KEY") == null) {
            throw new IllegalArgumentException(
                    "No LLM provider configured. Please configure an LLM provider in Settings before executing workflows.");
        }

        String executionId = "exec-" + UUID.randomUUID();
        Map<String, Object> inputs = request != null && request.getInputs() != null
                ? request.getInputs() : Map.of();

        // Create execution record
        Execution execution = new Execution();
        execution.setId(executionId);
        execution.setWorkflowId(workflowId);
        execution.setUserId(userId);
        execution.setStatus(ExecutionStatus.RUNNING.getValue());
        execution.setState(Map.of("logs", new ArrayList<Map<String, Object>>()));
        execution.setStartedAt(LocalDateTime.now());
        executionRepository.save(execution);

        log.info("Created execution {} for workflow {}", executionId, workflowId);

        // Run execution in background
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
            String errorMessage = isProduction() ? GENERIC_ERROR_MESSAGE
                    : (e.getMessage() != null ? e.getMessage() : GENERIC_ERROR_MESSAGE);
            String logMessage = GENERIC_ERROR_MESSAGE.equals(errorMessage)
                    ? errorMessage : "Execution failed: " + errorMessage;
            final String msg = logMessage;
            executionRepository.findById(executionId).ifPresent(exec -> {
                Map<String, Object> state = exec.getState() != null ? new HashMap<>(exec.getState()) : new HashMap<>();
                List<Map<String, Object>> logs = new ArrayList<>(JsonStateUtils.getLogsList(state));
                logs.add(Map.of(
                        "timestamp", LocalDateTime.now().toString(),
                        "level", "ERROR",
                        "node_id", (Object) null,
                        "message", msg
                ));
                state.put("logs", logs);
                state.put("error", errorMessage);
                exec.setStatus(ExecutionStatus.FAILED.getValue());
                exec.setState(state);
                exec.setCompletedAt(LocalDateTime.now());
                executionRepository.save(exec);
            });
        }
    }

    private Map<String, Object> executeWorkflowInternal(String workflowId, String userId,
                                                        Map<String, Object> inputs) {
        var workflowResponse = workflowService.getWorkflow(workflowId, userId);
        var llmConfig = settingsService.getActiveLlmConfig(userId).orElse(Map.of());
        return workflowExecutor.execute(workflowResponse, inputs, llmConfig, userId);
    }
}
