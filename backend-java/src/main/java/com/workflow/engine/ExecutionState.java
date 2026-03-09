package com.workflow.engine;

import com.workflow.dto.ExecutionLogEntry;
import com.workflow.util.JsonStateUtils;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Mutable state tracked during workflow execution.
 * Mirrors Python ExecutionState schema.
 */
@Data
public class ExecutionState {
    private String executionId;
    private String workflowId;
    private String status;
    private String currentNode;
    private final Map<String, NodeState> nodeStates = new HashMap<>();
    private final Map<String, Object> variables = new HashMap<>();
    private Object result;
    private String error;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private final List<ExecutionLogEntry> logs = new ArrayList<>();

    public void addLog(ExecutionLogEntry entry) {
        logs.add(entry);
    }

    public void addLog(String level, String nodeId, String message) {
        logs.add(new ExecutionLogEntry(LocalDateTime.now(), level, nodeId, message));
    }

    /**
     * Convert to Map for storage in Execution entity state.
     */
    public Map<String, Object> toStateMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("status", status);
        map.put("result", result);
        List<Map<String, Object>> logsList = new ArrayList<>();
        for (ExecutionLogEntry l : logs) {
            String timestamp = l.getTimestamp() != null ? l.getTimestamp().toString() : null;
            logsList.add(JsonStateUtils.createLogEntry(timestamp, l.getLevel(), l.getNodeId(), l.getMessage()));
        }
        map.put("logs", logsList);
        Map<String, Object> nodeStatesMap = new HashMap<>();
        nodeStates.forEach((id, ns) -> nodeStatesMap.put(id, ns.toMap()));
        map.put("node_states", nodeStatesMap);
        map.put("current_node", currentNode);
        if (error != null) {
            map.put("error", error);
        }
        return map;
    }
}
