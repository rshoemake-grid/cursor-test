package com.workflow.service;

import com.workflow.dto.*;
import com.workflow.entity.Execution;
import com.workflow.exception.ExecutionNotFoundException;
import com.workflow.repository.ExecutionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for execution business logic - matches Python ExecutionService
 * Handles execution CRUD, logs, cancel operations
 */
@Service
@Transactional
public class ExecutionService {
    private static final Logger log = LoggerFactory.getLogger(ExecutionService.class);

    private final ExecutionRepository executionRepository;

    public ExecutionService(ExecutionRepository executionRepository) {
        this.executionRepository = executionRepository;
    }

    @Transactional(readOnly = true)
    public ExecutionResponse getExecution(String executionId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ExecutionNotFoundException("Execution not found: " + executionId));
        return toResponse(execution);
    }

    @Transactional(readOnly = true)
    public List<ExecutionResponse> listExecutions(String workflowId, String userId, String status,
                                                  Integer limit, int offset) {
        int size = (limit != null && limit > 0) ? Math.min(limit, 100) : 50;
        int page = offset / size;
        var pageable = PageRequest.of(page, size);

        List<Execution> executions = executionRepository.findWithFilters(workflowId, userId, status, pageable);
        return executions.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExecutionResponse> getRunningExecutions() {
        List<Execution> executions = executionRepository.findByStatus(ExecutionStatus.RUNNING.getValue());
        return executions.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExecutionLogsResponse getExecutionLogs(String executionId, String level, String nodeId,
                                                  int limit, int offset) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ExecutionNotFoundException("Execution not found: " + executionId));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rawLogs = Optional.ofNullable(execution.getState())
                .map(s -> (List<Map<String, Object>>) s.get("logs"))
                .orElse(Collections.emptyList());

        List<ExecutionLogEntry> logEntries = rawLogs.stream()
                .map(this::toLogEntry)
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

    public ExecutionResponse cancelExecution(String executionId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ExecutionNotFoundException("Execution not found: " + executionId));

        String status = execution.getStatus();
        if (!ExecutionStatus.PENDING.getValue().equals(status) && !ExecutionStatus.RUNNING.getValue().equals(status)) {
            throw new IllegalArgumentException("Execution " + executionId + " is not in a cancellable state (current status: " + status + ")");
        }

        execution.setStatus(ExecutionStatus.CANCELLED.getValue());
        execution.setCompletedAt(LocalDateTime.now());

        Map<String, Object> state = execution.getState() != null ? new HashMap<>(execution.getState()) : new HashMap<>();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> logs = (List<Map<String, Object>>) state.getOrDefault("logs", new ArrayList<>());
        logs.add(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "level", "INFO",
                "node_id", (Object) null,
                "message", "Execution cancelled by user"
        ));
        state.put("logs", logs);
        state.put("status", ExecutionStatus.CANCELLED.getValue());
        execution.setState(state);

        execution = executionRepository.save(execution);
        log.info("Cancelled execution {}", executionId);
        return toResponse(execution);
    }

    private ExecutionResponse toResponse(Execution execution) {
        Map<String, Object> state = execution.getState() != null ? execution.getState() : Collections.emptyMap();

        List<ExecutionLogEntry> logs = Collections.emptyList();
        Object logsObj = state.get("logs");
        if (logsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawLogs = (List<Map<String, Object>>) logsObj;
            logs = rawLogs.stream()
                    .map(this::toLogEntry)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }

        return new ExecutionResponse(
                execution.getId(),
                execution.getWorkflowId(),
                execution.getStatus(),
                (String) state.get("current_node"),
                (Map<String, Object>) state.get("result"),
                (String) state.get("error"),
                execution.getStartedAt(),
                execution.getCompletedAt(),
                logs
        );
    }

    private ExecutionLogEntry toLogEntry(Map<String, Object> m) {
        try {
            Object ts = m.get("timestamp");
            LocalDateTime timestamp = LocalDateTime.now();
            if (ts instanceof String) {
                try {
                    String s = (String) ts;
                    timestamp = LocalDateTime.parse(s.replace("Z", ""), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                } catch (DateTimeParseException ignored) {
                    // fallback to now
                }
            }
            return new ExecutionLogEntry(
                    timestamp,
                    (String) m.getOrDefault("level", "INFO"),
                    (String) m.get("node_id"),
                    (String) m.getOrDefault("message", "")
            );
        } catch (Exception e) {
            log.warn("Failed to parse log entry: {}", e.getMessage());
            return null;
        }
    }
}
