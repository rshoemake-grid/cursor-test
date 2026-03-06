package com.workflow.websocket;

import com.workflow.entity.Execution;
import com.workflow.repository.ExecutionRepository;
import com.workflow.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.socket.WebSocketHandler;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Code Review 2026 (Low #11): Tests for WebSocket auth - invalid token and wrong execution ownership.
 */
@ExtendWith(MockitoExtension.class)
class WebSocketAuthHandshakeInterceptorTest {

    @Mock
    private ExecutionRepository executionRepository;

    @Mock
    private ServerHttpResponse response;

    @Mock
    private WebSocketHandler wsHandler;

    private JwtUtil jwtUtil;
    private WebSocketAuthHandshakeInterceptor interceptor;

    @BeforeEach
    void setUp() throws Exception {
        jwtUtil = new JwtUtil();
        setField(jwtUtil, "secret", "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256");
        setField(jwtUtil, "expiration", 3600000L);
        setField(jwtUtil, "refreshExpiration", 604800000L);
        interceptor = new WebSocketAuthHandshakeInterceptor(jwtUtil, executionRepository);
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
        Execution execution = new Execution();
        execution.setId("exec-123");
        execution.setUserId("other-user-id");
        execution.setWorkflowId("wf-1");
        execution.setStatus("running");
        execution.setStartedAt(LocalDateTime.now());

        when(executionRepository.findById("exec-123")).thenReturn(Optional.of(execution));

        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setRequestURI("/ws/executions/exec-123");
        servletRequest.addParameter("token", token);
        ServletServerHttpRequest request = new ServletServerHttpRequest(servletRequest);
        Map<String, Object> attributes = new HashMap<>();

        boolean result = interceptor.beforeHandshake(request, response, wsHandler, attributes);

        assertFalse(result);
        assertTrue(attributes.isEmpty());
        verify(executionRepository).findById("exec-123");
    }

    @Test
    void beforeHandshake_executionNotFound_rejectsHandshake() {
        String token = jwtUtil.generateToken("user1", "user-1-id");
        when(executionRepository.findById("exec-123")).thenReturn(Optional.empty());

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
        Execution execution = new Execution();
        execution.setId("exec-123");
        execution.setUserId("user-1-id");
        execution.setWorkflowId("wf-1");
        execution.setStatus("running");
        execution.setStartedAt(LocalDateTime.now());

        when(executionRepository.findById("exec-123")).thenReturn(Optional.of(execution));

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
        verify(executionRepository, never()).findById(any());
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
