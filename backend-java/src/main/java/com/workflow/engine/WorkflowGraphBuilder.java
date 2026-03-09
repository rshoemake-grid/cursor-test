package com.workflow.engine;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import com.workflow.dto.WorkflowResponse;

import java.util.*;

/**
 * Builds execution graph (adjacency, in-degree, node map) from workflow.
 * Extracted from WorkflowExecutor for SRP.
 */
public final class WorkflowGraphBuilder {

    private WorkflowGraphBuilder() {
    }

    public static GraphResult build(WorkflowResponse workflow) {
        List<Node> nodes = workflow.getNodesOrEmpty();
        List<Edge> edges = workflow.getEdgesOrEmpty();

        Map<String, Node> nodeMap = new HashMap<>();
        Map<String, List<String>> adjacency = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();

        for (Node n : nodes) {
            nodeMap.put(n.getId(), n);
            adjacency.put(n.getId(), new ArrayList<>());
            inDegree.put(n.getId(), 0);
        }

        Set<String> validIds = new HashSet<>(nodeMap.keySet());
        for (Edge e : edges) {
            if (!validIds.contains(e.getSource()) || !validIds.contains(e.getTarget())) {
                continue;
            }
            adjacency.get(e.getSource()).add(e.getTarget());
            inDegree.merge(e.getTarget(), 1, Integer::sum);
        }

        List<String> startNodes = inDegree.entrySet().stream()
                .filter(entry -> entry.getValue() == 0)
                .map(Map.Entry::getKey)
                .toList();
        if (startNodes.isEmpty() && !nodes.isEmpty()) {
            Optional<Node> start = nodes.stream()
                    .filter(n -> NodeType.START.equals(n.getType()))
                    .findFirst();
            startNodes = start.map(n -> List.of(n.getId()))
                    .orElse(List.of(nodes.get(0).getId()));
        }

        return new GraphResult(adjacency, inDegree, nodeMap, edges, startNodes);
    }

    public record GraphResult(
            Map<String, List<String>> adjacency,
            Map<String, Integer> inDegree,
            Map<String, Node> nodeMap,
            List<Edge> edges,
            List<String> startNodes
    ) {
    }
}
