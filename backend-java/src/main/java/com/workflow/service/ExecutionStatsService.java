package com.workflow.service;

import com.workflow.entity.Execution;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.ExecutionRepository;
import com.workflow.util.PaginationUtils;
import com.workflow.util.JsonStateUtils;
import com.workflow.util.RepositoryUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

/**
 * SRP-1: Execution stats and history logic extracted from DebugController.
 * Code Review 2026: Repository-level pagination for getExecutionHistory.
 */
@Service
public class ExecutionStatsService {
    private static final int MAX_HISTORY_LIMIT = 500;
    /** Code Review 2026 P-3: Cap stats to avoid loading unbounded rows. Stats are for most recent executions. */
    private static final int MAX_STATS_LIMIT = 5000;

    private final ExecutionRepository executionRepository;
    private final ExecutionService executionService;

    public ExecutionStatsService(ExecutionRepository executionRepository, ExecutionService executionService) {
        this.executionRepository = executionRepository;
        this.executionService = executionService;
    }

    public List<Map<String, Object>> getExecutionHistory(String workflowId, int limit, String status) {
        int safeLimit = PaginationUtils.clampLimit(limit, MAX_HISTORY_LIMIT);
        var pageable = PageRequest.of(0, safeLimit);
        List<Execution> executions = status != null
                ? executionRepository.findByWorkflowIdAndStatusOrderByStartedAtDesc(workflowId, status, pageable)
                : executionRepository.findByWorkflowIdOrderByStartedAtDesc(workflowId, pageable);
        return executions.stream().map(this::toHistoryEntry).toList();
    }

    public Map<String, Object> getTimeline(String executionId, String userId) {
        executionService.requireExecutionOwner(executionId, userId);
        Execution e = RepositoryUtils.findByIdOrThrow(executionRepository, executionId, "Execution not found");
        Map<String, Object> state = JsonStateUtils.getStateOrEmpty(e.getState());
        Map<String, Object> result = new HashMap<>();
        result.put("execution_id", executionId);
        result.put("status", e.getStatus());
        result.put("started_at", e.getStartedAt());
        result.put("completed_at", e.getCompletedAt());
        result.put("timeline", JsonStateUtils.getLogsList(state));
        result.put("node_states", JsonStateUtils.getMap(state, "node_states"));
        return result;
    }

    public Map<String, Object> getNodeDetails(String executionId, String nodeId, String userId) {
        executionService.requireExecutionOwner(executionId, userId);
        Execution e = RepositoryUtils.findByIdOrThrow(executionRepository, executionId, "Execution not found");
        Map<String, Object> state = JsonStateUtils.getStateOrEmpty(e.getState());
        Map<String, Object> nodeStates = JsonStateUtils.getMap(state, "node_states");
        if (!nodeStates.containsKey(nodeId)) {
            throw new ResourceNotFoundException("Node not found in execution");
        }
        Map<String, Object> nodeState = JsonStateUtils.getMap(nodeStates, nodeId);
        List<Map<String, Object>> logs = JsonStateUtils.getLogsList(state);
        List<Map<String, Object>> nodeLogs = logs.stream()
                .filter(l -> nodeId.equals(l.get("node_id")))
                .toList();
        Map<String, Object> result = new HashMap<>();
        result.put("execution_id", executionId);
        result.put("node_id", nodeId);
        result.put("status", nodeState.get("status"));
        result.put("inputs", nodeState.get("inputs"));
        result.put("output", nodeState.get("output"));
        result.put("error", nodeState.get("error"));
        result.put("logs", nodeLogs);
        return result;
    }

    public Map<String, Object> getWorkflowStats(String workflowId) {
        var pageable = PageRequest.of(0, MAX_STATS_LIMIT);
        List<Execution> executions = executionRepository.findByWorkflowIdOrderByStartedAtDesc(workflowId, pageable);
        long success = executions.stream().filter(e -> "completed".equals(e.getStatus())).count();
        long failure = executions.stream().filter(e -> "failed".equals(e.getStatus())).count();
        double avgDur = executions.stream()
                .filter(ex -> ex.getCompletedAt() != null && ex.getStartedAt() != null)
                .mapToLong(ex -> Duration.between(ex.getStartedAt(), ex.getCompletedAt()).getSeconds())
                .average()
                .orElse(0);
        Map<String, Object> result = new HashMap<>();
        result.put("workflow_id", workflowId);
        result.put("total_executions", executions.size());
        result.put("success_count", success);
        result.put("failure_count", failure);
        result.put("success_rate", executions.isEmpty() ? 0 : (double) success / executions.size());
        result.put("average_duration_seconds", executions.isEmpty() ? null : avgDur);
        return result;
    }

    private Map<String, Object> toHistoryEntry(Execution e) {
        Map<String, Object> m = new HashMap<>();
        m.put("execution_id", e.getId());
        m.put("workflow_id", e.getWorkflowId());
        m.put("status", e.getStatus());
        m.put("started_at", e.getStartedAt());
        m.put("completed_at", e.getCompletedAt());
        if (e.getCompletedAt() != null && e.getStartedAt() != null) {
            m.put("duration_seconds", Duration.between(e.getStartedAt(), e.getCompletedAt()).getSeconds());
        }
        return m;
    }
}
