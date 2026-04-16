package com.workflow.engine;

import com.workflow.dto.ExecutionLogEntry;
import com.workflow.dto.ExecutionStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ExecutionStateTest {

    @Test
    void toStateMap_includesPythonExecutionStateFields() {
        LocalDateTime started = LocalDateTime.parse("2026-04-16T12:00:00");
        LocalDateTime completed = LocalDateTime.parse("2026-04-16T12:05:00");

        ExecutionState state = new ExecutionState();
        state.setExecutionId("exec-abc");
        state.setWorkflowId("wf-1");
        state.setStatus(ExecutionStatus.RUNNING.getValue());
        state.setCurrentNode("node-1");
        state.getVariables().put("k", "v");
        state.setStartedAt(started);
        state.setCompletedAt(completed);
        state.addLog(new ExecutionLogEntry(started, "INFO", null, "hello"));

        NodeState ns = NodeState.builder()
                .nodeId("node-1")
                .status(ExecutionStatus.COMPLETED.getValue())
                .build();
        state.getNodeStates().put("node-1", ns);

        Map<String, Object> map = state.toStateMap();

        assertEquals("exec-abc", map.get("execution_id"));
        assertEquals("wf-1", map.get("workflow_id"));
        assertEquals(ExecutionStatus.RUNNING.getValue(), map.get("status"));
        assertEquals("node-1", map.get("current_node"));
        @SuppressWarnings("unchecked")
        Map<String, Object> vars = (Map<String, Object>) map.get("variables");
        assertNotNull(vars);
        assertEquals("v", vars.get("k"));
        assertEquals(started.toString(), map.get("started_at"));
        assertEquals(completed.toString(), map.get("completed_at"));
        assertNotNull(map.get("node_states"));
        assertNotNull(map.get("logs"));
    }
}
