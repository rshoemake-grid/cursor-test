package com.workflow.util;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class WorkflowChatContextFormatterTest {

    @Test
    void formatIncludesNodesPositionsEdgesAndConnectivity() {
        Node start = new Node();
        start.setId("start-1");
        start.setType(NodeType.START);
        start.setName("Start");
        start.setPosition(Map.of("x", 0.0, "y", 0.0));

        Node agent = new Node();
        agent.setId("agent-1");
        agent.setType(NodeType.AGENT);
        agent.setName("Agent");
        agent.setPosition(Map.of("x", 200.0, "y", 0.0));

        Edge edge = new Edge("e1", "start-1", "agent-1", null, null, null);

        String text = WorkflowChatContextFormatter.formatWorkflowForLlm(
                "My Flow", "Desc", List.of(start, agent), List.of(edge));

        assertTrue(text.contains("My Flow"));
        assertTrue(text.contains("start-1"));
        assertTrue(text.contains("agent-1"));
        assertTrue(text.contains("Isolated nodes"));
        assertTrue(text.contains("start-1 -> agent-1") || text.contains("e1"));
    }

    @Test
    void formatEmptyWorkflow() {
        String text = WorkflowChatContextFormatter.formatWorkflowForLlm("Empty", "", List.of(), List.of());
        assertTrue(text.contains("Empty"));
        assertTrue(text.contains("Canvas is empty"));
    }

    @Test
    void nodeDisplayNameFallsBackToDataLabel() {
        Node n = new Node();
        n.setId("x-1");
        n.setData(Map.of("label", "From label"));
        assertTrue(WorkflowChatContextFormatter.nodeDisplayName(n).contains("From label"));
    }
}
