package com.workflow.engine;

import java.util.Map;

/**
 * Real-time execution updates (Python {@code ExecutionBroadcaster} + {@code ConnectionManager}).
 */
public interface ExecutionStreamBroadcaster {

    void broadcastStatus(String executionId, String status, Map<String, Object> data);

    void broadcastNodeUpdate(String executionId, String nodeId, Map<String, Object> nodeState);

    void broadcastLog(String executionId, Map<String, Object> logEntry);

    void broadcastCompletion(String executionId, Map<String, Object> resultPayload);

    void broadcastError(String executionId, String error);
}
