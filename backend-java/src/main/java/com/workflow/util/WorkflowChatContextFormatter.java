package com.workflow.util;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;

import java.util.List;
import java.util.Map;

/**
 * Builds the workflow context string for the chat LLM.
 * Kept in sync with Python {@code backend.api.workflow_chat.context.get_workflow_context} (excluding DB/access).
 */
public final class WorkflowChatContextFormatter {

    private WorkflowChatContextFormatter() {
    }

    public static String format(String workflowName, String description,
                               List<Node> nodes, List<Edge> edges) {
        String desc = (description == null || description.isBlank()) ? "None" : description;
        StringBuilder sb = new StringBuilder();
        sb.append("Workflow: ").append(workflowName != null ? workflowName : "").append("\n");
        sb.append("Description: ").append(desc).append("\n\n");
        sb.append("Nodes (").append(nodes.size()).append("):\n");
        for (Node n : nodes) {
            String id = ObjectUtils.toStringOrDefault(n != null ? n.getId() : null, "unknown");
            String typeStr = nodeTypeString(n != null ? n.getType() : null);
            String nodeName = nodeDisplayName(n, id);
            sb.append("  - ").append(id).append(": ").append(typeStr).append(" (").append(nodeName).append(")\n");
        }
        sb.append("\nEdges (").append(edges.size())
                .append(") — this is the complete connection list; nodes not listed here are not connected:\n");
        for (Edge e : edges) {
            String source = ObjectUtils.toStringOrDefault(e != null ? e.getSource() : null, "unknown");
            String target = ObjectUtils.toStringOrDefault(e != null ? e.getTarget() : null, "unknown");
            String handle = e != null ? e.getSourceHandle() : null;
            String suffix = (handle != null && !handle.isBlank()) ? " (sourceHandle=" + handle + ")" : "";
            sb.append("  - ").append(source).append(" -> ").append(target).append(suffix).append("\n");
        }
        if (edges.isEmpty() && nodes.size() > 1) {
            sb.append("\nNote: Multiple nodes but zero edges — the graph is disconnected until edges are added.\n");
        }
        return sb.toString();
    }

    private static String nodeTypeString(NodeType type) {
        if (type == null) {
            return "unknown";
        }
        return type.getValue();
    }

    private static String nodeDisplayName(Node n, String nodeId) {
        if (n == null) {
            return nodeId;
        }
        if (n.getName() != null && !n.getName().isBlank()) {
            return n.getName();
        }
        Map<String, Object> data = n.getData();
        if (data != null) {
            Object dataName = data.get("name");
            if (dataName != null) {
                String s = ObjectUtils.toStringOrDefault(dataName, "");
                if (!s.isBlank()) {
                    return s;
                }
            }
        }
        return nodeId;
    }
}
