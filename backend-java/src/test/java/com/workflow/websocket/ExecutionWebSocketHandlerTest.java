package com.workflow.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.net.URI;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExecutionWebSocketHandlerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private WebSocketSession sessionForExecution(String executionId) throws Exception {
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("session-" + executionId);
        when(session.getUri()).thenReturn(URI.create("http://localhost/ws/executions/" + executionId));
        when(session.isOpen()).thenReturn(true);
        return session;
    }

    @Test
    void broadcastStatus_matchesPythonConnectionManagerShape() throws Exception {
        ExecutionWebSocketHandler handler = new ExecutionWebSocketHandler(objectMapper);
        WebSocketSession session = sessionForExecution("exe-1");
        handler.afterConnectionEstablished(session);

        handler.broadcastStatus("exe-1", "running", Map.of("phase", "init"));

        ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
        verify(session).sendMessage(captor.capture());
        JsonNode n = objectMapper.readTree(captor.getValue().getPayload());
        assertEquals("status", n.get("type").asText());
        assertEquals("exe-1", n.get("execution_id").asText());
        assertEquals("running", n.get("status").asText());
        assertEquals("init", n.get("data").get("phase").asText());
        assertTrue(n.hasNonNull("timestamp"));
    }

    @Test
    void broadcastStatus_nullData_becomesEmptyObject() throws Exception {
        ExecutionWebSocketHandler handler = new ExecutionWebSocketHandler(objectMapper);
        WebSocketSession session = sessionForExecution("exe-2");
        handler.afterConnectionEstablished(session);

        handler.broadcastStatus("exe-2", "pending", null);

        ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
        verify(session).sendMessage(captor.capture());
        JsonNode n = objectMapper.readTree(captor.getValue().getPayload());
        assertTrue(n.get("data").isObject());
        assertTrue(n.get("data").isEmpty());
    }

    @Test
    void broadcastNodeUpdate_matchesPythonShape() throws Exception {
        ExecutionWebSocketHandler handler = new ExecutionWebSocketHandler(objectMapper);
        WebSocketSession session = sessionForExecution("e3");
        handler.afterConnectionEstablished(session);

        handler.broadcastNodeUpdate("e3", "node-a", Map.of("state", "done"));

        ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
        verify(session).sendMessage(captor.capture());
        JsonNode n = objectMapper.readTree(captor.getValue().getPayload());
        assertEquals("node_update", n.get("type").asText());
        assertEquals("e3", n.get("execution_id").asText());
        assertEquals("node-a", n.get("node_id").asText());
        assertEquals("done", n.get("node_state").get("state").asText());
    }

    @Test
    void broadcastLog_completion_error_matchPythonTopLevelKeys() throws Exception {
        ExecutionWebSocketHandler handler = new ExecutionWebSocketHandler(objectMapper);
        WebSocketSession session = sessionForExecution("e4");
        handler.afterConnectionEstablished(session);

        handler.broadcastLog("e4", Map.of("line", "hello"));
        handler.broadcastCompletion("e4", Map.of("ok", true));
        handler.broadcastError("e4", "failed");

        ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
        verify(session, times(3)).sendMessage(captor.capture());
        var payloads = captor.getAllValues();

        JsonNode log = objectMapper.readTree(payloads.get(0).getPayload());
        assertEquals("log", log.get("type").asText());
        assertEquals("hello", log.get("log").get("line").asText());

        JsonNode done = objectMapper.readTree(payloads.get(1).getPayload());
        assertEquals("completion", done.get("type").asText());
        assertTrue(done.get("result").get("ok").asBoolean());

        JsonNode err = objectMapper.readTree(payloads.get(2).getPayload());
        assertEquals("error", err.get("type").asText());
        assertEquals("failed", err.get("error").asText());
    }
}
