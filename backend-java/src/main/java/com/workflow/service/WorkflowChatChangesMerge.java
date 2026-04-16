package com.workflow.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Pure merge of workflow chat tool edits into nodes/edges (Python {@code _apply_chat_changes_merge}).
 */
public final class WorkflowChatChangesMerge {

    private WorkflowChatChangesMerge() {
    }

    public record MergedGraph(List<Map<String, Object>> nodes, List<Map<String, Object>> edges) {
    }

    public static MergedGraph merge(
            List<Map<String, Object>> currentNodes,
            List<Map<String, Object>> currentEdges,
            List<Map<String, Object>> nodesToAdd,
            List<Map<String, Object>> nodesToUpdate,
            List<String> nodesToDelete,
            List<Map<String, Object>> edgesToAdd,
            List<Map<String, Object>> edgesToDelete) {
        List<Map<String, Object>> finalNodes = new ArrayList<>(copyNodes(currentNodes));
        List<Map<String, Object>> finalEdges = new ArrayList<>(copyEdges(currentEdges));
        finalNodes.addAll(copyNodes(nodesToAdd));

        for (Map<String, Object> update : orEmpty(nodesToUpdate)) {
            applyNodeUpdate(finalNodes, update);
        }

        Set<String> deleteIds = new HashSet<>(orEmpty(nodesToDelete));
        finalNodes.removeIf(n -> deleteIds.contains(String.valueOf(n.get("id"))));

        for (Map<String, Object> edge : orEmpty(edgesToAdd)) {
            Object src = edge.get("source");
            Object tgt = edge.get("target");
            if (src == null || tgt == null) {
                continue;
            }
            boolean exists = finalEdges.stream().anyMatch(
                    e -> src.equals(e.get("source")) && tgt.equals(e.get("target")));
            if (!exists) {
                finalEdges.add(new LinkedHashMap<>(edge));
            }
        }

        List<Map<String, Object>> del = orEmpty(edgesToDelete);
        finalEdges.removeIf(e -> del.stream().anyMatch(
                d -> String.valueOf(d.get("source")).equals(String.valueOf(e.get("source")))
                        && String.valueOf(d.get("target")).equals(String.valueOf(e.get("target")))));

        return new MergedGraph(finalNodes, finalEdges);
    }

    @SuppressWarnings("unchecked")
    private static void applyNodeUpdate(List<Map<String, Object>> finalNodes, Map<String, Object> update) {
        String nid = String.valueOf(update.get("node_id"));
        Map<String, Object> updates = (Map<String, Object>) update.get("updates");
        if (updates == null) {
            return;
        }
        for (int i = 0; i < finalNodes.size(); i++) {
            Map<String, Object> node = finalNodes.get(i);
            if (!nid.equals(String.valueOf(node.get("id")))) {
                continue;
            }
            Map<String, Object> merged = new LinkedHashMap<>(node);
            for (Map.Entry<String, Object> e : updates.entrySet()) {
                if (e.getValue() != null) {
                    merged.put(e.getKey(), e.getValue());
                }
            }
            if (node.containsKey("data")) {
                Map<String, Object> data = new LinkedHashMap<>(
                        (Map<String, Object>) node.getOrDefault("data", Map.of()));
                for (Map.Entry<String, Object> e : updates.entrySet()) {
                    if (e.getValue() != null) {
                        data.put(e.getKey(), e.getValue());
                    }
                }
                merged.put("data", data);
            }
            finalNodes.set(i, merged);
            break;
        }
    }

    private static List<Map<String, Object>> copyNodes(List<Map<String, Object>> in) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> n : orEmpty(in)) {
            out.add(new LinkedHashMap<>(n));
        }
        return out;
    }

    private static List<Map<String, Object>> copyEdges(List<Map<String, Object>> in) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> e : orEmpty(in)) {
            out.add(new LinkedHashMap<>(e));
        }
        return out;
    }

    private static <T> List<T> orEmpty(List<T> l) {
        return l == null ? List.of() : l;
    }
}
