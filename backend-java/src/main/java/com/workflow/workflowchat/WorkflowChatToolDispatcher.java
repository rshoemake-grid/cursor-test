package com.workflow.workflowchat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.constants.WorkflowChatModels;
import com.workflow.engine.LlmApiClient;
import com.workflow.service.ChatChangesService;
import com.workflow.service.WorkflowChatChangesMerge;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Dispatches workflow-chat LLM tool calls (Python {@code get_tool_handlers}).
 */
@Component
public class WorkflowChatToolDispatcher {

    private final ChatChangesService chatChangesService;
    private final ObjectMapper objectMapper;

    public WorkflowChatToolDispatcher(ChatChangesService chatChangesService, ObjectMapper objectMapper) {
        this.chatChangesService = chatChangesService;
        this.objectMapper = objectMapper;
    }

    public static Map<String, List<Object>> newChangeBuckets() {
        Map<String, List<Object>> m = new LinkedHashMap<>();
        m.put("nodes_to_add", new ArrayList<>());
        m.put("nodes_to_update", new ArrayList<>());
        m.put("nodes_to_delete", new ArrayList<>());
        m.put("edges_to_add", new ArrayList<>());
        m.put("edges_to_delete", new ArrayList<>());
        return m;
    }

    public Map<String, Object> dispatch(
            LlmApiClient.ToolCallSpec call,
            ChatSession session,
            String workflowId,
            String userId) throws Exception {
        JsonNode args = objectMapper.readTree(
                call.argumentsJson() == null || call.argumentsJson().isBlank() ? "{}" : call.argumentsJson());
        return switch (call.name()) {
            case "add_node" -> handleAddNode(call.id(), args, session);
            case "update_node" -> handleUpdateNode(call.id(), args, session);
            case "delete_node" -> handleDeleteNode(call.id(), args, session);
            case "connect_nodes" -> handleConnect(call.id(), args, session);
            case "disconnect_nodes" -> handleDisconnect(call.id(), args, session);
            case "get_workflow_info" -> handleGetInfo(call.id(), session);
            case "save_workflow" -> handleSave(call.id(), args, session, workflowId, userId);
            default -> toolMessage(call.id(), Map.of("status", "error", "message", "Unknown function: " + call.name()));
        };
    }

    private Map<String, Object> handleAddNode(String toolCallId, JsonNode args, ChatSession session) throws Exception {
        if (!args.hasNonNull("node_type")) {
            return toolMessage(toolCallId, Map.of("status", "error", "message", "node_type is required"));
        }
        String nodeType = args.get("node_type").asText();
        if (session.snapshot != null && ("start".equals(nodeType) || "end".equals(nodeType))
                && hasNodeTypeOnCanvas(session, nodeType)) {
            return toolMessage(toolCallId, Map.of(
                    "status", "error",
                    "message", "A " + nodeType + " node already exists on the canvas. Use connect_nodes or update_node instead."));
        }
        String nodeId = nodeType + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String nodeName = args.hasNonNull("name") ? args.get("name").asText() : nodeType + " Node";
        Map<String, Object> newNode = new LinkedHashMap<>();
        newNode.put("id", nodeId);
        newNode.put("type", nodeType);
        newNode.put("name", nodeName);
        newNode.put("description", args.hasNonNull("description") ? args.get("description").asText() : "");
        if (args.has("position") && args.get("position").isObject()) {
            newNode.put("position", objectMapper.convertValue(args.get("position"), Map.class));
        } else {
            newNode.put("position", Map.of("x", 100, "y", 100));
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("label", nodeName);
        data.put("name", nodeName);
        data.put("description", newNode.get("description"));
        if (args.has("config") && args.get("config").isObject()) {
            Map<String, Object> cfg = objectMapper.convertValue(args.get("config"), Map.class);
            String configKey = WorkflowChatModels.NODE_CONFIG_KEYS.get(nodeType);
            if (configKey != null) {
                newNode.put(configKey, cfg);
                data.put(configKey, cfg);
            }
        }
        newNode.put("data", data);
        session.workflowChanges.get("nodes_to_add").add(newNode);
        return toolMessage(toolCallId, Map.of("status", "success", "action", "added_node", "node_id", nodeId));
    }

    private boolean hasNodeTypeOnCanvas(ChatSession session, String nodeType) {
        Map<String, Object> snap = session.snapshot;
        if (snap == null) {
            return false;
        }
        Map<String, Object> tmp = Map.of(
                "nodes", snap.getOrDefault("nodes", List.of()),
                "edges", snap.getOrDefault("edges", List.of()));
        List<Map<String, Object>> baseNodes = WorkflowChatLiveSummary.mapsFromDefinitionPart(objectMapper, tmp, "nodes");
        List<Map<String, Object>> baseEdges = WorkflowChatLiveSummary.mapsFromDefinitionPart(objectMapper, tmp, "edges");
        WorkflowChatChangesMerge.MergedGraph merged = WorkflowChatChangesMerge.merge(
                new ArrayList<>(baseNodes),
                new ArrayList<>(baseEdges),
                castMapList(session.workflowChanges.get("nodes_to_add")),
                castMapList(session.workflowChanges.get("nodes_to_update")),
                castStringList(session.workflowChanges.get("nodes_to_delete")),
                castMapList(session.workflowChanges.get("edges_to_add")),
                castMapList(session.workflowChanges.get("edges_to_delete")));
        for (Map<String, Object> n : merged.nodes()) {
            if (nodeType.equals(String.valueOf(n.get("type")))) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> handleUpdateNode(String toolCallId, JsonNode args, ChatSession session) throws Exception {
        if (!args.hasNonNull("node_id")) {
            return toolMessage(toolCallId, Map.of("status", "error", "message", "node_id is required"));
        }
        Map<String, Object> updates = new LinkedHashMap<>();
        if (args.hasNonNull("name")) {
            updates.put("name", args.get("name").asText());
        }
        if (args.has("description")) {
            updates.put("description", args.get("description").asText());
        }
        if (args.has("config") && args.get("config").isObject()) {
            updates.putAll(objectMapper.convertValue(args.get("config"), Map.class));
        }
        Map<String, Object> upd = Map.of(
                "node_id", args.get("node_id").asText(),
                "updates", updates);
        session.workflowChanges.get("nodes_to_update").add(upd);
        return toolMessage(toolCallId, Map.of("status", "success", "action", "updated_node", "node_id", args.get("node_id").asText()));
    }

    private Map<String, Object> handleDeleteNode(String toolCallId, JsonNode args, ChatSession session) throws Exception {
        if (!args.hasNonNull("node_id")) {
            return toolMessage(toolCallId, Map.of("status", "error", "message", "node_id is required"));
        }
        session.workflowChanges.get("nodes_to_delete").add(args.get("node_id").asText());
        return toolMessage(toolCallId, Map.of("status", "success", "action", "deleted_node", "node_id", args.get("node_id").asText()));
    }

    private Map<String, Object> handleConnect(String toolCallId, JsonNode args, ChatSession session) throws Exception {
        if (!args.hasNonNull("source_node_id") || !args.hasNonNull("target_node_id")) {
            return toolMessage(toolCallId, Map.of("status", "error", "message", "source_node_id and target_node_id are required"));
        }
        String s = args.get("source_node_id").asText();
        String t = args.get("target_node_id").asText();
        Map<String, Object> edge = new LinkedHashMap<>();
        edge.put("id", "e-" + s + "-" + t);
        edge.put("source", s);
        edge.put("target", t);
        if (args.hasNonNull("source_handle")) {
            edge.put("sourceHandle", args.get("source_handle").asText());
        }
        session.workflowChanges.get("edges_to_add").add(edge);
        return toolMessage(toolCallId, Map.of("status", "success", "action", "connected_nodes", "edge_id", edge.get("id")));
    }

    private Map<String, Object> handleDisconnect(String toolCallId, JsonNode args, ChatSession session) throws Exception {
        if (!args.hasNonNull("source_node_id") || !args.hasNonNull("target_node_id")) {
            return toolMessage(toolCallId, Map.of("status", "error", "message", "source_node_id and target_node_id are required"));
        }
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("source", args.get("source_node_id").asText());
        e.put("target", args.get("target_node_id").asText());
        session.workflowChanges.get("edges_to_delete").add(e);
        return toolMessage(toolCallId, Map.of("status", "success", "action", "disconnected_nodes"));
    }

    private Map<String, Object> handleGetInfo(String toolCallId, ChatSession session) throws Exception {
        String text = session.liveSummary.getOrDefault("text", "");
        return toolMessage(toolCallId, text);
    }

    private Map<String, Object> handleSave(
            String toolCallId,
            JsonNode args,
            ChatSession session,
            String workflowId,
            String userId) throws Exception {
        if (workflowId == null || workflowId.isBlank()) {
            return toolMessage(toolCallId, Map.of("status", "error", "message", "No workflow ID provided. Cannot save workflow."));
        }
        Optional<String> nameOpt = Optional.empty();
        if (args.has("name") && !args.get("name").isNull()) {
            String n = args.get("name").asText();
            if (!n.isBlank()) {
                nameOpt = Optional.of(n);
            }
        }
        boolean updateDescription = args.has("description");
        String descriptionValue = updateDescription && !args.get("description").isNull()
                ? args.get("description").asText()
                : null;
        try {
            Map<String, Object> result = chatChangesService.applyChatChanges(
                    workflowId,
                    castMapList(session.workflowChanges.get("nodes_to_add")),
                    castMapList(session.workflowChanges.get("nodes_to_update")),
                    castStringList(session.workflowChanges.get("nodes_to_delete")),
                    castMapList(session.workflowChanges.get("edges_to_add")),
                    castMapList(session.workflowChanges.get("edges_to_delete")),
                    nameOpt,
                    updateDescription,
                    descriptionValue,
                    userId);
            appendAll(session.savedChanges, session.workflowChanges);
            clearBuckets(session.workflowChanges);
            if (session.snapshot != null) {
                session.snapshot.put("nodes", result.get("final_nodes"));
                session.snapshot.put("edges", result.get("final_edges"));
            }
            return toolMessage(toolCallId, Map.of(
                    "status", "success",
                    "action", "saved_workflow",
                    "workflow_id", workflowId,
                    "nodes_count", result.get("nodes_count"),
                    "edges_count", result.get("edges_count")));
        } catch (Exception e) {
            return toolMessage(toolCallId, Map.of("status", "error", "message", "Error saving workflow: " + e.getMessage()));
        }
    }

    private static void appendAll(Map<String, List<Object>> dest, Map<String, List<Object>> src) {
        for (Map.Entry<String, List<Object>> e : src.entrySet()) {
            dest.get(e.getKey()).addAll(e.getValue());
        }
    }

    private static void clearBuckets(Map<String, List<Object>> b) {
        for (List<Object> list : b.values()) {
            list.clear();
        }
    }

    private Map<String, Object> toolMessage(String toolCallId, Object content) throws Exception {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("role", "tool");
        m.put("tool_call_id", toolCallId);
        if (content instanceof String s) {
            m.put("content", s);
        } else {
            m.put("content", objectMapper.writeValueAsString(content));
        }
        return m;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> castMapList(List<Object> in) {
        if (in == null) {
            return List.of();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object o : in) {
            if (o instanceof Map) {
                out.add((Map<String, Object>) o);
            }
        }
        return out;
    }

    private static List<String> castStringList(List<Object> in) {
        if (in == null) {
            return List.of();
        }
        return in.stream().map(String::valueOf).toList();
    }

    /**
     * Mutable state for one chat request.
     */
    public static final class ChatSession {
        public final Map<String, List<Object>> workflowChanges = newChangeBuckets();
        public final Map<String, List<Object>> savedChanges = newChangeBuckets();
        public final Map<String, String> liveSummary = new LinkedHashMap<>();
        public Map<String, Object> snapshot;
    }
}
