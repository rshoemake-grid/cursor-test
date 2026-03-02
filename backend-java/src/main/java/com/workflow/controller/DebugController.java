package com.workflow.controller;

import com.workflow.entity.Execution;
import com.workflow.entity.Workflow;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.ExecutionRepository;
import com.workflow.repository.WorkflowRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.*;

/**
 * Debug Controller - matches Python debug_routes.py
 */
@RestController
@RequestMapping("/api/debug")
@Tag(name = "Debug", description = "Debugging and validation endpoints")
public class DebugController {
    private final WorkflowRepository workflowRepository;
    private final ExecutionRepository executionRepository;

    public DebugController(WorkflowRepository workflowRepository, ExecutionRepository executionRepository) {
        this.workflowRepository = workflowRepository;
        this.executionRepository = executionRepository;
    }

    @GetMapping("/workflow/{workflowId}/validate")
    @Operation(summary = "Validate Workflow")
    public ResponseEntity<Map<String, Object>> validate(@PathVariable String workflowId) {
        Workflow w = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        Map<String, Object> def = w.getDefinition();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> nodes = (List<Map<String, Object>>) (def != null ? def.get("nodes") : null);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> edges = (List<Map<String, Object>>) (def != null ? def.get("edges") : null);
        nodes = nodes != null ? nodes : List.of();
        edges = edges != null ? edges : List.of();

        List<Map<String, Object>> issues = new ArrayList<>();
        List<Map<String, Object>> warnings = new ArrayList<>();

        Set<String> nodeIds = new HashSet<>();
        Set<String> connected = new HashSet<>();
        for (Map<String, Object> n : nodes) {
            if (n.get("id") != null) nodeIds.add(n.get("id").toString());
        }
        for (Map<String, Object> e : edges) {
            if (e.get("source") != null) connected.add(e.get("source").toString());
            if (e.get("target") != null) connected.add(e.get("target").toString());
        }
        Set<String> orphans = new HashSet<>(nodeIds);
        orphans.removeAll(connected);
        if (!orphans.isEmpty()) {
            warnings.add(Map.of("type", "orphan_nodes", "message", "Found " + orphans.size() + " disconnected nodes", "nodes", orphans));
        }

        List<String> types = nodes.stream().map(n -> (String) n.get("type")).filter(Objects::nonNull).toList();
        if (!types.contains("start")) {
            issues.add(Map.of("type", "missing_start", "message", "Workflow has no START node", "severity", "error"));
        }
        if (!types.contains("end")) {
            warnings.add(Map.of("type", "missing_end", "message", "Workflow has no END node", "severity", "warning"));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("workflow_id", workflowId);
        result.put("valid", issues.isEmpty());
        result.put("issues", issues);
        result.put("warnings", warnings);
        result.put("node_count", nodes.size());
        result.put("edge_count", edges.size());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/workflow/{workflowId}/executions/history")
    @Operation(summary = "Execution History")
    public ResponseEntity<List<Map<String, Object>>> executionHistory(
            @PathVariable String workflowId,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status) {
        List<Execution> executions = executionRepository.findByWorkflowId(workflowId);
        if (status != null) {
            executions = executions.stream().filter(e -> status.equals(e.getStatus())).toList();
        }
        List<Map<String, Object>> result = executions.stream()
                .sorted((a, b) -> b.getStartedAt().compareTo(a.getStartedAt()))
                .limit(limit)
                .map(e -> {
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
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/execution/{executionId}/timeline")
    @Operation(summary = "Execution Timeline")
    public ResponseEntity<Map<String, Object>> timeline(@PathVariable String executionId) {
        Execution e = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found"));
        Map<String, Object> state = e.getState() != null ? e.getState() : Map.of();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> logs = (List<Map<String, Object>>) state.getOrDefault("logs", List.of());
        Map<String, Object> result = new HashMap<>();
        result.put("execution_id", executionId);
        result.put("status", e.getStatus());
        result.put("started_at", e.getStartedAt());
        result.put("completed_at", e.getCompletedAt());
        result.put("timeline", logs);
        result.put("node_states", state.getOrDefault("node_states", Map.of()));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/execution/{executionId}/node/{nodeId}")
    @Operation(summary = "Node Execution Details")
    public ResponseEntity<Map<String, Object>> nodeDetails(@PathVariable String executionId, @PathVariable String nodeId) {
        Execution e = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found"));
        Map<String, Object> state = e.getState() != null ? e.getState() : Map.of();
        @SuppressWarnings("unchecked")
        Map<String, Object> nodeStates = (Map<String, Object>) state.getOrDefault("node_states", Map.of());
        if (!nodeStates.containsKey(nodeId)) {
            throw new ResourceNotFoundException("Node not found in execution");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> nodeState = (Map<String, Object>) nodeStates.get(nodeId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> logs = (List<Map<String, Object>>) state.getOrDefault("logs", List.of());
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
        return ResponseEntity.ok(result);
    }

    @GetMapping("/workflow/{workflowId}/stats")
    @Operation(summary = "Workflow Stats")
    public ResponseEntity<Map<String, Object>> workflowStats(@PathVariable String workflowId) {
        List<Execution> executions = executionRepository.findByWorkflowId(workflowId);
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
        return ResponseEntity.ok(result);
    }

    @PostMapping("/execution/{executionId}/export")
    @Operation(summary = "Export Execution")
    public ResponseEntity<Map<String, Object>> exportExecution(@PathVariable String executionId) {
        Execution e = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found"));
        Workflow w = workflowRepository.findById(e.getWorkflowId()).orElse(null);
        Map<String, Object> result = new HashMap<>();
        result.put("export_version", "1.0");
        result.put("exported_at", java.time.LocalDateTime.now());
        Map<String, Object> execData = new HashMap<>();
        execData.put("id", e.getId());
        execData.put("workflow_id", e.getWorkflowId());
        execData.put("status", e.getStatus());
        execData.put("started_at", e.getStartedAt());
        execData.put("completed_at", e.getCompletedAt());
        execData.put("state", e.getState());
        result.put("execution", execData);
        Map<String, Object> wfData = new HashMap<>();
        wfData.put("id", w != null ? w.getId() : null);
        wfData.put("name", w != null ? w.getName() : null);
        wfData.put("definition", w != null ? w.getDefinition() : null);
        result.put("workflow", wfData);
        return ResponseEntity.ok(result);
    }
}
