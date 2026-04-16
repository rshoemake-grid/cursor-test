package com.workflow.engine;

import com.workflow.dto.LoopConfig;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class LoopNodeExecutorTest {

    private final LoopNodeExecutor executor = new LoopNodeExecutor();

    @Test
    void whileLoopReturnsInitializedState() {
        Node n = new Node();
        n.setId("l1");
        n.setType(NodeType.LOOP);
        LoopConfig cfg = new LoopConfig();
        cfg.setLoopType("while");
        cfg.setCondition("x > 1");
        cfg.setMaxIterations(10);
        n.setLoopConfig(cfg);

        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) executor.execute(n, Map.of(), new ExecutionState(), new NodeExecutionContext(Map.of(), "u", java.util.List.of(), java.util.Map.of()));

        assertEquals("while", out.get("loop_type"));
        assertEquals("x > 1", out.get("condition"));
        assertEquals(10, out.get("max_iterations"));
    }

    @Test
    void untilLoopReturnsInitializedState() {
        Node n = new Node();
        n.setId("l2");
        n.setType(NodeType.LOOP);
        LoopConfig cfg = new LoopConfig();
        cfg.setLoopType("until");
        cfg.setCondition("done");
        n.setLoopConfig(cfg);

        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) executor.execute(n, Map.of(), new ExecutionState(), new NodeExecutionContext(Map.of(), "u", java.util.List.of(), java.util.Map.of()));

        assertEquals("until", out.get("loop_type"));
        assertEquals("done", out.get("condition"));
    }
}
