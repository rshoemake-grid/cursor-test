package com.workflow.websocket;

import com.workflow.config.JwtTimeProperties;
import com.workflow.security.JwtUtil;
import com.workflow.service.ExecutionOwnershipChecker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.socket.WebSocketHandler;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Code Review 2026 (Low #11): Tests for WebSocket auth - invalid token and wrong execution ownership.
 */
@ExtendWith(MockitoExtension.class)
class WebSocketAuthHandshakeInterceptorTest {

    @Mock
    private ExecutionOwnershipChecker ownershipChecker;

    @Mock
    private ServerHttpResponse response;

    @Mock
    private WebSocketHandler wsHandler;

    private JwtUtil jwtUtil;
    private WebSocketAuthHandshakeInterceptor interceptor;

    @BeforeEach
    void setUp() {
        JwtTimeProperties times = new JwtTimeProperties();
        times.setAccessExpirationMinutes(60);
        times.setRefreshExpirationDays(7);
        jwtUtil = new JwtUtil("test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256", "", times);
        interceptor = new WebSocketAuthHandshakeInterceptor(jwtUtil, ownershipChecker);
    }

    @Test
    void beforeHandshake_missingToken_rejectsHandshake() {
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setRequestURI("/ws/executions/exec-123");
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        assertTrue(attributes.isEmpty());
    }

    @Test
    void beforeHandshake_invalidToken_rejectsHandshake() {
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setRequestURI("/ws/executions/exec-123");
        servletRequest.addParameter("token", "invalid-jwt-token");
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        assertTrue(attributes.isEmpty());
    }

    @Test
    void beforeHandshake_validTokenWrongExecutionOwner_rejectsHandshake() {
        String token = jwtUtil.generateToken("user1", "user-1-id");
        when(ownershipChecker.canOpenExecutionStream("exec-123", "user-1-id")).thenReturn(false);

        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setRequestURI("/ws/executions/exec-123");
        servletRequest.addParameter("token", token);
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        assertTrue(attributes.isEmpty());
        verify(ownershipChecker).canOpenExecutionStream("exec-123", "user-1-id");
    }

    @Test
    void beforeHandshake_executionNotFound_rejectsHandshake() {
        String token = jwtUtil.generateToken("user1", "user-1-id");
        when(ownershipChecker.canOpenExecutionStream("exec-123", "user-1-id")).thenReturn(false);

        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setRequestURI("/ws/executions/exec-123");
        servletRequest.addParameter("token", token);
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        assertTrue(attributes.isEmpty());
    }

    @Test
    void beforeHandshake_validTokenAndOwnership_allowsHandshake() {
        String token = jwtUtil.generateToken("user1", "user-1-id");
        when(ownershipChecker.canOpenExecutionStream("exec-123", "user-1-id")).thenReturn(true);

        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setRequestURI("/ws/executions/exec-123");
        servletRequest.addParameter("token", token);
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertTrue(result);
        assertEquals("user-1-id", attributes.get("userId"));
        assertEquals("exec-123", attributes.get("executionId"));
    }

    @Test
    void beforeHandshake_noExecutionIdInPath_rejectsHandshake() {
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setRequestURI("/ws/other");
        servletRequest.addParameter("token", "some-token");
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        verify(ownershipChecker, never()).canOpenExecutionStream(any(), any());
    }
}
