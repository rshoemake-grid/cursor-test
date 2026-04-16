package com.workflow.workflowchat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.Edge;
import com.workflow.dto.Node;
import com.workflow.service.WorkflowChatChangesMerge;
import com.workflow.util.ObjectUtils;
import com.workflow.util.WorkflowChatContextFormatter;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Refreshes the live workflow text after each tool call (Python {@code refresh_live_workflow_summary}).
 */
public final class WorkflowChatLiveSummary {

    private WorkflowChatLiveSummary() {
    }

    @SuppressWarnings("unchecked")
    public static void refresh(
            ObjectMapper objectMapper,
            Map<String, String> live,
            Map<String, Object> snapshot,
            Map<String, List<Object>> workflowChanges) {
        if (snapshot == null) {
            return;
        }
        Map<String, Object> tmpDef = Map.of(
                "nodes", snapshot.getOrDefault("nodes", List.of()),
                "edges", snapshot.getOrDefault("edges", List.of()));
        List<Map<String, Object>> curNodes = new ArrayList<>(mapsFromDefinitionPart(objectMapper, tmpDef, "nodes"));
        List<Map<String, Object>> curEdges = new ArrayList<>(mapsFromDefinitionPart(objectMapper, tmpDef, "edges"));

        WorkflowChatChangesMerge.MergedGraph merged = WorkflowChatChangesMerge.merge(
                curNodes,
                curEdges,
                castMapList(workflowChanges.get("nodes_to_add")),
                castMapList(workflowChanges.get("nodes_to_update")),
                castStringList(workflowChanges.get("nodes_to_delete")),
                castMapList(workflowChanges.get("edges_to_add")),
                castMapList(workflowChanges.get("edges_to_delete")));

        List<Node> nodesDto = objectMapper.convertValue(merged.nodes(), new TypeReference<List<Node>>() {});
        List<Edge> edgesDto = objectMapper.convertValue(merged.edges(), new TypeReference<List<Edge>>() {});

        live.put("text", WorkflowChatContextFormatter.formatWorkflowForLlm(
                String.valueOf(snapshot.get("name")),
                ObjectUtils.toStringOrDefault(snapshot.get("description"), ""),
                nodesDto,
                edgesDto));
    }

    public static List<Map<String, Object>> mapsFromDefinitionPart(ObjectMapper om, Map<String, Object> def, String key) {
        Object raw = def.get(key);
        if (raw == null) {
            return new ArrayList<>();
        }
        try {
            return new ArrayList<>(om.convertValue(raw, new TypeReference<List<Map<String, Object>>>() {}));
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> castMapList(List<Object> in) {
        if (in == null) {
            return List.of();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object o : in) {
            if (o instanceof Map) {
                out.add(new LinkedHashMap<>((Map<String, Object>) o));
            }
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private static List<String> castStringList(List<Object> in) {
        if (in == null) {
            return List.of();
        }
        return in.stream().map(String::valueOf).toList();
    }
}
