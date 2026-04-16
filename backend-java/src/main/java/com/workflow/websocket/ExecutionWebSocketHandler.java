package com.workflow.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.util.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for execution streaming - matches Python websocket manager
 * Clients connect to /ws/executions/{executionId} for real-time updates
 */
@Component
public class ExecutionWebSocketHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(ExecutionWebSocketHandler.class);
    private final ObjectMapper objectMapper;

    public ExecutionWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // executionId -> set of sessions
    private final Map<String, Map<String, WebSocketSession>> executionConnections = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String executionId = extractExecutionId(session);
        if (executionId != null) {
            executionConnections.computeIfAbsent(executionId, k -> new ConcurrentHashMap<>())
                    .put(session.getId(), session);
            log.debug("WebSocket connected for execution {}: session {}", executionId, session.getId());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if ("ping".equals(message.getPayload())) {
            session.sendMessage(new TextMessage("{\"type\":\"pong\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String executionId = extractExecutionId(session);
        if (executionId != null) {
            Map<String, WebSocketSession> sessions = executionConnections.get(executionId);
            if (sessions != null) {
                sessions.remove(session.getId());
                if (sessions.isEmpty()) {
                    executionConnections.remove(executionId);
                }
            }
        }
    }

    /** Matches Python {@code ConnectionManager.broadcast_status}. */
    public void broadcastStatus(String executionId, String status, Map<String, Object> data) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", "status");
        message.put("execution_id", executionId);
        message.put("status", status);
        message.put("data", data != null ? data : Map.of());
        message.put("timestamp", websocketTimestamp());
        broadcastMessage(executionId, message);
    }

    /** Matches Python {@code ConnectionManager.broadcast_node_update}. */
    public void broadcastNodeUpdate(String executionId, String nodeId, Map<String, Object> nodeState) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", "node_update");
        message.put("execution_id", executionId);
        message.put("node_id", nodeId);
        message.put("node_state", nodeState != null ? nodeState : Map.of());
        message.put("timestamp", websocketTimestamp());
        broadcastMessage(executionId, message);
    }

    /** Matches Python {@code ConnectionManager.broadcast_log}. */
    public void broadcastLog(String executionId, Map<String, Object> logEntry) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", "log");
        message.put("execution_id", executionId);
        message.put("log", logEntry != null ? logEntry : Map.of());
        message.put("timestamp", websocketTimestamp());
        broadcastMessage(executionId, message);
    }

    /** Matches Python {@code ConnectionManager.broadcast_completion}. */
    public void broadcastCompletion(String executionId, Map<String, Object> result) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", "completion");
        message.put("execution_id", executionId);
        message.put("result", result != null ? result : Map.of());
        message.put("timestamp", websocketTimestamp());
        broadcastMessage(executionId, message);
    }

    /** Matches Python {@code ConnectionManager.broadcast_error}. */
    public void broadcastError(String executionId, String error) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", "error");
        message.put("execution_id", executionId);
        message.put("error", error != null ? error : "");
        message.put("timestamp", websocketTimestamp());
        broadcastMessage(executionId, message);
    }

    /**
     * Python uses {@code str(asyncio.get_event_loop().time())} (monotonic seconds as string).
     * We use JVM uptime seconds for a similar process-relative clock.
     */
    private static String websocketTimestamp() {
        double seconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000.0;
        return Double.toString(seconds);
    }

    private void broadcastMessage(String executionId, Map<String, Object> message) {
        Map<String, WebSocketSession> sessions = executionConnections.get(executionId);
        if (sessions == null) {
            return;
        }
        String payload;
        try {
            payload = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.warn("Failed to serialize WebSocket message: {}", e.getMessage());
            return;
        }
        TextMessage msg = new TextMessage(payload);
        sessions.values().removeIf(s -> !send(s, msg));
        if (sessions.isEmpty()) {
            executionConnections.remove(executionId);
        }
    }

    private boolean send(WebSocketSession session, TextMessage message) {
        try {
            if (session.isOpen()) {
                session.sendMessage(message);
                return true;
            }
        } catch (IOException e) {
            log.debug("WebSocket send failed: {}", e.getMessage());
        }
        return false;
    }

    private String extractExecutionId(WebSocketSession session) {
        String path = ObjectUtils.orDefaultIfBlank(ObjectUtils.safeGet(session.getUri(), java.net.URI::getPath), "");
        if (path.contains("/executions/")) {
            String[] parts = path.split("/executions/");
            if (parts.length > 1) {
                return parts[1].split("/")[0];
            }
        }
        return null;
    }
}
