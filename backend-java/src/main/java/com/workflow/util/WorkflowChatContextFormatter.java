package com.workflow.util;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Formats workflow graph state for the workflow-chat LLM (parity with Python {@code format_workflow_for_llm}).
 */
public final class WorkflowChatContextFormatter {

    private WorkflowChatContextFormatter() {
    }

    /**
     * Human-readable canvas: nodes (with positions), edges, connectivity summary.
     */
    public static String formatWorkflowForLlm(String name, String description, List<Node> nodes, List<Edge> edges) {
        List<String> lines = new ArrayList<>();
        lines.add("=== Workflow on canvas ===");
        lines.add("This describes what is on the workflow canvas as stored for this chat request.");
        lines.add("");
        lines.add("Name: " + (name != null ? name : ""));
        lines.add("Description: " + (description == null || description.isBlank() ? "None" : description));
        lines.add("");
        lines.addAll(connectivityLines(nodes, edges));
        lines.add("");
        lines.add("Nodes (" + nodes.size() + "):");
        for (Node n : nodes) {
            String nodeId = n.getId() != null ? n.getId() : "unknown";
            String nodeType = n.getType() != null ? n.getType().getValue() : "unknown";
            String label = nodeDisplayName(n);
            String px = formatCoord(n.getPosition(), "x");
            String py = formatCoord(n.getPosition(), "y");
            lines.add("  - id=" + nodeId + " | type=" + nodeType + " | label=" + label
                    + " | canvas position (x,y)=(" + px + ", " + py + ")");
        }
        lines.add("");
        lines.add("Edges / connections (" + edges.size() + "):");
        if (edges.isEmpty()) {
            lines.add("  (none)");
        } else {
            for (Edge e : edges) {
                String eid = e.getId() != null ? e.getId() : "?";
                String src = e.getSource() != null ? e.getSource() : "?";
                String tgt = e.getTarget() != null ? e.getTarget() : "?";
                String handlePart = e.getSourceHandle() != null && !e.getSourceHandle().isBlank()
                        ? " | sourceHandle=" + e.getSourceHandle()
                        : "";
                lines.add("  - " + eid + ": " + src + " -> " + tgt + handlePart);
            }
        }
        return String.join("\n", lines);
    }

    static String nodeDisplayName(Node node) {
        if (node.getName() != null && !node.getName().isBlank()) {
            return node.getName();
        }
        Map<String, Object> data = node.getData();
        if (data != null) {
            Object n = data.get("name");
            if (n != null && !String.valueOf(n).isBlank()) {
                return String.valueOf(n);
            }
            Object lbl = data.get("label");
            if (lbl != null && !String.valueOf(lbl).isBlank()) {
                return String.valueOf(lbl);
            }
        }
        return node.getId() != null ? node.getId() : "unknown";
    }

    private static String formatCoord(Map<String, Double> position, String key) {
        if (position == null || !position.containsKey(key) || position.get(key) == null) {
            return "?";
        }
        return String.valueOf(position.get(key));
    }

    static List<String> connectivityLines(List<Node> nodes, List<Edge> edges) {
        List<String> lines = new ArrayList<>();
        List<String> nodeIds = new ArrayList<>();
        for (Node n : nodes) {
            if (n.getId() != null && !n.getId().isBlank()) {
                nodeIds.add(n.getId());
            }
        }
        Map<String, Integer> incoming = new HashMap<>();
        Map<String, Integer> outgoing = new HashMap<>();
        for (String id : nodeIds) {
            incoming.put(id, 0);
            outgoing.put(id, 0);
        }
        for (Edge e : edges) {
            String s = e.getSource();
            String t = e.getTarget();
            if (s != null && outgoing.containsKey(s)) {
                outgoing.merge(s, 1, Integer::sum);
            }
            if (t != null && incoming.containsKey(t)) {
                incoming.merge(t, 1, Integer::sum);
            }
        }
        lines.add("Summary: " + nodeIds.size() + " node(s) on canvas, " + edges.size()
                + " edge(s) (connections between nodes).");
        if (nodeIds.isEmpty()) {
            lines.add("Canvas is empty — there are no nodes yet.");
            return lines;
        }
        if (edges.isEmpty()) {
            lines.add("There are no edges yet — nodes exist but nothing is wired together.");
        }
        List<String> isolated = new ArrayList<>();
        for (String id : nodeIds) {
            int in = incoming.getOrDefault(id, 0);
            int out = outgoing.getOrDefault(id, 0);
            if (in == 0 && out == 0) {
                isolated.add(id);
            }
        }
        if (!isolated.isEmpty()) {
            lines.add("Isolated nodes (no connections at all): " + String.join(", ", isolated));
        } else {
            lines.add("Isolated nodes (no connections at all): none");
        }
        List<String> noIn = new ArrayList<>();
        List<String> noOut = new ArrayList<>();
        for (String id : nodeIds) {
            if (incoming.getOrDefault(id, 0) == 0) {
                noIn.add(id);
            }
            if (outgoing.getOrDefault(id, 0) == 0) {
                noOut.add(id);
            }
        }
        lines.add("Nodes with no incoming edge: " + (noIn.isEmpty() ? "none" : String.join(", ", noIn)));
        lines.add("Nodes with no outgoing edge: " + (noOut.isEmpty() ? "none" : String.join(", ", noOut)));
        return lines;
    }
}
