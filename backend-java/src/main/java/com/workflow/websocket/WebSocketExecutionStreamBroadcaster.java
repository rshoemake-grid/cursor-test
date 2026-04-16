package com.workflow.websocket;

import com.workflow.engine.ExecutionStreamBroadcaster;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Bridges execution engine to {@link ExecutionWebSocketHandler} (Python {@code ws_manager}).
 */
@Component
public class WebSocketExecutionStreamBroadcaster implements ExecutionStreamBroadcaster {

    private final ExecutionWebSocketHandler webSocketHandler;

    public WebSocketExecutionStreamBroadcaster(ExecutionWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void broadcastStatus(String executionId, String status, Map<String, Object> data) {
        webSocketHandler.broadcastStatus(executionId, status, data);
    }

    @Override
    public void broadcastNodeUpdate(String executionId, String nodeId, Map<String, Object> nodeState) {
        webSocketHandler.broadcastNodeUpdate(executionId, nodeId, nodeState);
    }

    @Override
    public void broadcastLog(String executionId, Map<String, Object> logEntry) {
        webSocketHandler.broadcastLog(executionId, logEntry);
    }

    @Override
    public void broadcastCompletion(String executionId, Map<String, Object> resultPayload) {
        webSocketHandler.broadcastCompletion(executionId, resultPayload);
    }

    @Override
    public void broadcastError(String executionId, String error) {
        webSocketHandler.broadcastError(executionId, error);
    }
}
