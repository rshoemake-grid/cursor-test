package com.workflow.websocket;

import com.workflow.entity.Execution;
import com.workflow.repository.ExecutionRepository;
import com.workflow.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;
import java.util.Objects;

/**
 * S-H3: Validates JWT token from query param and execution ownership before WebSocket handshake.
 * Clients must connect with ?token=xxx. Rejects handshake if token missing/invalid or user doesn't own execution.
 */
@Component
public class WebSocketAuthHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthHandshakeInterceptor.class);
    private static final String TOKEN_PARAM = "token";

    private final JwtUtil jwtUtil;
    private final ExecutionRepository executionRepository;

    public WebSocketAuthHandshakeInterceptor(JwtUtil jwtUtil, ExecutionRepository executionRepository) {
        this.jwtUtil = jwtUtil;
        this.executionRepository = executionRepository;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                  WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }
        String path = request.getURI().getPath();
        String executionId = extractExecutionId(path);
        if (executionId == null) {
            log.warn("WebSocket handshake rejected: no execution ID in path {}", path);
            return false;
        }

        String token = servletRequest.getServletRequest().getParameter(TOKEN_PARAM);
        if (token == null || token.isBlank()) {
            log.warn("WebSocket handshake rejected: missing token for execution {}", executionId);
            return false;
        }

        String userId = jwtUtil.extractUserId(token);
        if (userId == null) {
            log.warn("WebSocket handshake rejected: invalid or expired token for execution {}", executionId);
            return false;
        }

        Execution execution = executionRepository.findById(executionId).orElse(null);
        if (execution == null || !Objects.equals(userId, execution.getUserId())) {
            log.warn("WebSocket handshake rejected: execution {} not found or not owned by user {}", executionId, userId);
            return false;
        }

        attributes.put("userId", userId);
        attributes.put("executionId", executionId);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                              WebSocketHandler wsHandler, Exception ex) {
        // No-op
    }

    private String extractExecutionId(String path) {
        if (path == null || !path.contains("/executions/")) return null;
        String[] parts = path.split("/executions/");
        if (parts.length < 2) return null;
        return parts[1].split("/")[0];
    }
}
