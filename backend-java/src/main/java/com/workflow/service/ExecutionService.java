package com.workflow.service;

import com.workflow.dto.*;
import com.workflow.entity.Execution;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ExecutionResponseMapper;
import com.workflow.util.OwnershipUtils;
import com.workflow.util.JsonStateUtils;
import com.workflow.util.PaginationUtils;
import com.workflow.util.RepositoryUtils;
import com.workflow.exception.ExecutionNotFoundException;
import com.workflow.repository.ExecutionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for execution business logic - matches Python ExecutionService
 * Handles execution CRUD, logs, cancel operations
 */
@Service
@Transactional
public class ExecutionService implements ExecutionOwnershipChecker {
    private static final Logger log = LoggerFactory.getLogger(ExecutionService.class);

    private final ExecutionRepository executionRepository;

    public ExecutionService(ExecutionRepository executionRepository) {
        this.executionRepository = executionRepository;
    }

    /**
     * Get execution by ID. S-C2: Requires ownership (execution.userId == userId).
     */
    @Transactional(readOnly = true)
    public ExecutionResponse getExecution(String executionId, String userId) {
        Execution execution = RepositoryUtils.findByIdOrThrow(executionRepository, executionId,
                () -> new ExecutionNotFoundException(ErrorMessages.executionNotFound(executionId)));
        assertExecutionOwner(execution, userId);
        return ExecutionResponseMapper.toResponse(execution);
    }

    @Transactional(readOnly = true)
    public List<ExecutionResponse> listExecutions(String workflowId, String userId, String status,
                                                  Integer limit, int offset) {
        int size = PaginationUtils.resolvePageSize(limit);
        int page = offset / size;
        var pageable = PageRequest.of(page, size);

        List<Execution> executions = executionRepository.findWithFilters(workflowId, userId, status, pageable);
        return executions.stream().map(ExecutionResponseMapper::toResponse).collect(Collectors.toList());
    }

    /**
     * Get running executions for user. S-C2: Filter by userId.
     * Code Review 2026 (Low #13): Reject null userId to avoid returning all executions.
     */
    @Transactional(readOnly = true)
    public List<ExecutionResponse> getRunningExecutions(String userId) {
        if (userId == null) {
            throw new IllegalArgumentException(ErrorMessages.USER_ID_REQUIRED);
        }
        List<Execution> executions = executionRepository.findByUserIdAndStatus(userId, ExecutionStatus.RUNNING.getValue());
        return executions.stream().map(ExecutionResponseMapper::toResponse).collect(Collectors.toList());
    }

    /**
     * Get execution logs. S-C2: Requires ownership.
     */
    @Transactional(readOnly = true)
    public ExecutionLogsResponse getExecutionLogs(String executionId, String userId, String level, String nodeId,
                                                  int limit, int offset) {
        Execution execution = RepositoryUtils.findByIdOrThrow(executionRepository, executionId,
                () -> new ExecutionNotFoundException(ErrorMessages.executionNotFound(executionId)));
        assertExecutionOwner(execution, userId);

        List<Map<String, Object>> rawLogs = JsonStateUtils.getLogsList(execution.getState());

        List<ExecutionLogEntry> logEntries = rawLogs.stream()
                .map(ExecutionResponseMapper::toLogEntry)
                .filter(e -> e != null)
                .filter(e -> level == null || level.equalsIgnoreCase(e.getLevel()))
                .filter(e -> nodeId == null || nodeId.equals(e.getNodeId()))
                .sorted(Comparator.comparing(ExecutionLogEntry::getTimestamp).reversed())
                .collect(Collectors.toList());

        int total = logEntries.size();
        int from = Math.min(offset, total);
        int to = Math.min(offset + limit, total);
        List<ExecutionLogEntry> paginated = logEntries.subList(from, to);

        return new ExecutionLogsResponse(executionId, paginated, total, limit, offset);
    }

    /**
     * Cancel execution. S-C2: Requires ownership.
     */
    public ExecutionResponse cancelExecution(String executionId, String userId) {
        Execution execution = RepositoryUtils.findByIdOrThrow(executionRepository, executionId,
                () -> new ExecutionNotFoundException(ErrorMessages.executionNotFound(executionId)));
        assertExecutionOwner(execution, userId);

        String status = execution.getStatus();
        if (!ExecutionStatus.PENDING.getValue().equals(status) && !ExecutionStatus.RUNNING.getValue().equals(status)) {
            throw new IllegalArgumentException(ErrorMessages.executionNotCancellable(executionId, status));
        }

        appendLogAndUpdateExecutionState(executionId, userId, "INFO", null, "Execution cancelled by user",
                ExecutionStatus.CANCELLED.getValue(), null);
        execution = RepositoryUtils.findByIdOrThrow(executionRepository, executionId,
                () -> new ExecutionNotFoundException(ErrorMessages.executionNotFound(executionId)));
        log.info("Cancelled execution {}", executionId);
        return ExecutionResponseMapper.toResponse(execution);
    }

    /**
     * Update execution state after workflow run. SRP: Centralizes execution persistence used by ExecutionOrchestratorService.
     */
    public void updateExecutionState(String executionId, Map<String, Object> state) {
        Execution execution = executionRepository.findById(executionId).orElse(null);
        if (execution != null) {
            execution.setStatus((String) state.getOrDefault("status", ExecutionStatus.COMPLETED.getValue()));
            execution.setState(state);
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
        }
    }

    /**
     * Append log entry and update execution status. DRY: used by ExecutionOrchestratorService (failure) and cancelExecution.
     */
    public void appendLogAndUpdateExecutionState(String executionId, String userId, String level, String nodeId,
                                                  String message, String newStatus, String errorMessage) {
        Execution exec = RepositoryUtils.findByIdOrThrow(executionRepository, executionId,
                () -> new ExecutionNotFoundException(ErrorMessages.executionNotFound(executionId)));
        assertExecutionOwner(exec, userId);
        Map<String, Object> state = new HashMap<>(JsonStateUtils.getStateOrEmpty(exec.getState()));
        List<Map<String, Object>> logs = new ArrayList<>(JsonStateUtils.getLogsList(state));
        logs.add(JsonStateUtils.createLogEntry(level, nodeId, message));
        state.put("logs", logs);
        state.put("status", newStatus);
        if (errorMessage != null) state.put("error", errorMessage);
        exec.setStatus(newStatus);
        exec.setState(state);
        exec.setCompletedAt(LocalDateTime.now());
        executionRepository.save(exec);
    }

    /**
     * Assert user owns the execution. Throws if not found or not owner.
     * Used by DebugController and other callers requiring ownership.
     */
    public void requireExecutionOwner(String executionId, String userId) {
        Execution execution = RepositoryUtils.findByIdOrThrow(executionRepository, executionId,
                () -> new ExecutionNotFoundException(ErrorMessages.executionNotFound(executionId)));
        assertExecutionOwner(execution, userId);
    }

    /**
     * Check if user owns the execution. Returns false if execution not found or not owner.
     * Used by WebSocketAuthHandshakeInterceptor (DRY: centralizes execution ownership logic).
     */
    @Transactional(readOnly = true)
    public boolean isExecutionOwner(String executionId, String userId) {
        Execution execution = executionRepository.findById(executionId).orElse(null);
        return execution != null && Objects.equals(userId, execution.getUserId());
    }

    private void assertExecutionOwner(Execution execution, String userId) {
        boolean isOwner = userId != null && Objects.equals(userId, execution.getUserId());
        OwnershipUtils.require(isOwner, ErrorMessages.NOT_AUTHORIZED_EXECUTION);
    }

}
