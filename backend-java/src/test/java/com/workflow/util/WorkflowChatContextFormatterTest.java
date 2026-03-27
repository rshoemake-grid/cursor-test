package com.workflow.util;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * TDD: Context string for workflow chat must stay aligned with Python {@code context.get_workflow_context}.
 */
class WorkflowChatContextFormatterTest {

    @Test
    void format_includesDescriptionAndEmptyGraph() {
        String out = WorkflowChatContextFormatter.format(
                "My Flow",
                null,
                List.of(),
                List.of());
        assertTrue(out.contains("Workflow: My Flow\n"));
        assertTrue(out.contains("Description: None\n"));
        assertTrue(out.contains("Nodes (0):\n"));
        assertTrue(out.contains("Edges (0)"));
        assertTrue(out.contains("complete connection list"));
    }

    @Test
    void format_listsNodeTypesNamesAndEdgeHandles() {
        Node a = new Node();
        a.setId("n1");
        a.setType(NodeType.START);
        a.setData(Map.of("name", "Entry"));
        Node b = new Node();
        b.setId("n2");
        b.setType(NodeType.CONDITION);
        b.setName("Branch");
        Edge e = new Edge(null, "n1", "n2", null, "true", null);

        String out = WorkflowChatContextFormatter.format("W", "A test", List.of(a, b), List.of(e));

        assertTrue(out.contains("Description: A test\n"));
        assertTrue(out.contains("  - n1: start (Entry)\n"));
        assertTrue(out.contains("  - n2: condition (Branch)\n"));
        assertTrue(out.contains("  - n1 -> n2 (sourceHandle=true)\n"));
    }

    @Test
    void format_multipleNodesNoEdges_addsDisconnectedNote() {
        Node a = new Node();
        a.setId("a");
        a.setType(NodeType.START);
        Node b = new Node();
        b.setId("b");
        b.setType(NodeType.END);
        String out = WorkflowChatContextFormatter.format("W", "", List.of(a, b), List.of());
        assertTrue(out.contains("Multiple nodes but zero edges"));
    }

    @Test
    void format_singleNodeNoEdges_noDisconnectedNote() {
        Node a = new Node();
        a.setId("a");
        a.setType(NodeType.START);
        String out = WorkflowChatContextFormatter.format("W", "", List.of(a), List.of());
        assertEquals(-1, out.indexOf("Multiple nodes but zero edges"));
    }
}
