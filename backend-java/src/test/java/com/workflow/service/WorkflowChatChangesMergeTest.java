package com.workflow.service;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WorkflowChatChangesMergeTest {

    @Test
    void addsNodesAndEdges() {
        List<Map<String, Object>> nodes = new ArrayList<>(List.of(node("a", "agent")));
        List<Map<String, Object>> edges = new ArrayList<>();
        var m = WorkflowChatChangesMerge.merge(
                nodes,
                edges,
                List.of(node("b", "tool")),
                List.of(),
                List.of(),
                List.of(edge("a", "b")),
                List.of());
        assertEquals(2, m.nodes().size());
        assertEquals(1, m.edges().size());
    }

    @Test
    void deletesNodeAndBlockingEdge() {
        var m = WorkflowChatChangesMerge.merge(
                List.of(node("a", "start"), node("b", "end")),
                List.of(edge("a", "b")),
                List.of(),
                List.of(),
                List.of("b"),
                List.of(),
                List.of(Map.of("source", "a", "target", "b")));
        assertEquals(1, m.nodes().size());
        assertTrue(m.edges().isEmpty());
    }

    private static Map<String, Object> node(String id, String type) {
        Map<String, Object> n = new LinkedHashMap<>();
        n.put("id", id);
        n.put("type", type);
        n.put("name", id);
        return n;
    }

    private static Map<String, Object> edge(String s, String t) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("id", "e-" + s + "-" + t);
        e.put("source", s);
        e.put("target", t);
        return e;
    }
}
