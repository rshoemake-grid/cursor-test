package com.workflow.engine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * State of a single node during execution.
 * Mirrors Python NodeState schema.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeState {
    private String nodeId;
    private String status;
    private Object input;
    private Object output;
    private String error;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("node_id", nodeId);
        map.put("status", status);
        map.put("input", input);
        map.put("output", output);
        if (error != null) {
            map.put("error", error);
        }
        if (startedAt != null) {
            map.put("started_at", startedAt.toString());
        }
        if (completedAt != null) {
            map.put("completed_at", completedAt.toString());
        }
        return map;
    }
}
