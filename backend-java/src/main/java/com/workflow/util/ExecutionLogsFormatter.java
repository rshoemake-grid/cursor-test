package com.workflow.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.ExecutionLogEntry;
import com.workflow.util.ObjectUtils;
import com.workflow.dto.ExecutionLogsResponse;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Formats execution logs for download (JSON or text).
 * DRY-8: Centralizes log formatting; uses ObjectMapper for JSON instead of manual string building.
 */
@Component
public class ExecutionLogsFormatter {
    private static final int SEPARATOR_WIDTH = 80;

    private final ObjectMapper objectMapper;

    public ExecutionLogsFormatter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String formatAsJson(String executionId, ExecutionLogsResponse logsResponse) {
        try {
            List<Map<String, Object>> logs = new ArrayList<>();
            for (ExecutionLogEntry e : logsResponse.getLogs()) {
                logs.add(JsonStateUtils.logEntryFromDto(e));
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("execution_id", executionId);
            result.put("logs", logs);
            result.put("total", logsResponse.getTotal());
            return objectMapper.writeValueAsString(result);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to format logs as JSON", ex);
        }
    }

    public String formatAsText(String executionId, ExecutionLogsResponse logsResponse) {
        StringBuilder sb = new StringBuilder();
        sb.append("Execution Logs for ").append(executionId).append("\n");
        sb.append("Total Logs: ").append(logsResponse.getTotal()).append("\n");
        sb.append("=".repeat(SEPARATOR_WIDTH)).append("\n\n");
        for (ExecutionLogEntry e : logsResponse.getLogs()) {
            String nodeStr = e.getNodeId() != null ? " [" + e.getNodeId() + "]" : "";
            sb.append("[").append(ObjectUtils.toStringOrDefault(e.getTimestamp(), "")).append("] ")
                    .append(e.getLevel()).append(nodeStr).append(": ")
                    .append(e.getMessage()).append("\n");
        }
        return sb.toString();
    }
}
