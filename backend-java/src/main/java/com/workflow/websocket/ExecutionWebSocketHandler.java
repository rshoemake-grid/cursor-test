package com.workflow.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
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

    public void broadcastToExecution(String executionId, String type, Object data) {
        Map<String, WebSocketSession> sessions = executionConnections.get(executionId);
        if (sessions == null) return;
        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "type", type,
                    "execution_id", executionId,
                    "data", data != null ? data : Map.of(),
                    "timestamp", System.currentTimeMillis() / 1000.0
            ));
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
        String path = session.getUri() != null ? session.getUri().getPath() : "";
        if (path.contains("/executions/")) {
            String[] parts = path.split("/executions/");
            if (parts.length > 1) {
                return parts[1].split("/")[0];
            }
        }
        return null;
    }
}
