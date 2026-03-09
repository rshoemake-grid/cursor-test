package com.workflow.util;

import com.workflow.dto.ExecutionLogEntry;
import com.workflow.dto.ExecutionResponse;
import com.workflow.entity.Execution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * SRP: Maps Execution entity to ExecutionResponse DTO. Extracted from ExecutionService.
 */
public final class ExecutionResponseMapper {

    private static final Logger log = LoggerFactory.getLogger(ExecutionResponseMapper.class);

    private ExecutionResponseMapper() {
    }

    public static ExecutionResponse toResponse(Execution execution) {
        Map<String, Object> state = JsonStateUtils.getStateOrEmpty(execution.getState());
        List<Map<String, Object>> rawLogs = JsonStateUtils.getLogsList(state);
        List<ExecutionLogEntry> logs = rawLogs.stream()
                .map(ExecutionResponseMapper::toLogEntry)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

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

    public static ExecutionLogEntry toLogEntry(Map<String, Object> m) {
        try {
            ExecutionLogEntry entry = JsonStateUtils.mapToExecutionLogEntry(m);
            if (entry == null) {
                log.debug("Log entry missing or unparseable timestamp, skipping");
            }
            return entry;
        } catch (Exception e) {
            log.warn("Failed to parse log entry: {}", e.getMessage());
            return null;
        }
    }
}
