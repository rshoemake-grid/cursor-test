package com.workflow.engine;

import com.workflow.dto.*;
import com.workflow.storage.WorkflowInputSourceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * WebSocket / streaming parity with Python {@code ExecutionBroadcaster} (when {@code stream_updates} is true).
 */
class WorkflowExecutorStreamingTest {

    private WorkflowExecutor executor;
    private RecordingBroadcaster recording;

    static final class RecordingBroadcaster implements ExecutionStreamBroadcaster {
        final List<String> events = new CopyOnWriteArrayList<>();

        @Override
        public void broadcastStatus(String executionId, String status, Map<String, Object> data) {
            events.add("status:" + executionId + ":" + status + ":" + data.get("workflow_id"));
        }

        @Override
        public void broadcastNodeUpdate(String executionId, String nodeId, Map<String, Object> nodeState) {
            events.add("node:" + executionId + ":" + nodeId + ":" + nodeState.get("status"));
        }

        @Override
        public void broadcastLog(String executionId, Map<String, Object> logEntry) {
            events.add("log:" + executionId + ":" + logEntry.get("message"));
        }

        @Override
        public void broadcastCompletion(String executionId, Map<String, Object> resultPayload) {
            events.add("completion:" + executionId + ":" + resultPayload.get("status"));
        }

        @Override
        public void broadcastError(String executionId, String error) {
            events.add("error:" + executionId + ":" + error);
        }
    }

    @BeforeEach
    void setUp() {
        recording = new RecordingBroadcaster();
        LlmApiClient mockLlmClient = (baseUrl, apiKey, model, messages) -> "mocked response";
        NodeTypeParser nodeTypeParser = new NodeTypeParser();
        ObjectMapper om = new ObjectMapper();
        WorkflowInputSourceService inputSvc = new WorkflowInputSourceService("", om);
        NodeExecutorRegistry registry = new NodeExecutorRegistry(
                List.of(
                        new AgentNodeExecutor(mockLlmClient, null, null, om),
                        new ConditionNodeExecutor(om),
                        new LoopNodeExecutor(om),
                        new ToolNodeExecutor(),
                        new StorageNodeExecutor(inputSvc)),
                nodeTypeParser);
        ThreadPoolTaskExecutor pool = new ThreadPoolTaskExecutor();
        pool.setCorePoolSize(2);
        pool.setMaxPoolSize(4);
        pool.setQueueCapacity(20);
        pool.initialize();
        executor = new WorkflowExecutor(registry, pool, recording);
    }

    @Test
    void execute_withStreaming_emitsStatusNodeUpdatesLogsAndCompletion() {
        Node start = node("start-1", NodeType.START);
        Node cond = conditionNode("cond-1", "field1", "value1");
        Node end = node("end-1", NodeType.END);
        Edge e1 = edge("start-1", "cond-1");
        Edge e2 = edgeWithHandle("cond-1", "end-1", "true");
        WorkflowResponse workflow = workflow("wf-stream", List.of(start, cond, end), List.of(e1, e2));

        Map<String, Object> state = executor.execute(
                "exec-real-id",
                workflow,
                Map.of("field1", "value1"),
                Map.of(),
                "user-1",
                true);

        assertEquals("completed", state.get("status"));
        assertTrue(recording.events.stream().anyMatch(e -> e.startsWith("status:exec-real-id:running:")));
        assertTrue(recording.events.stream().anyMatch(e -> e.contains("node:exec-real-id:cond-1:running")));
        assertTrue(recording.events.stream().anyMatch(e -> e.contains("node:exec-real-id:cond-1:completed")));
        assertTrue(recording.events.stream().anyMatch(e -> e.startsWith("log:exec-real-id:")));
        assertTrue(recording.events.stream().anyMatch(e -> e.equals("completion:exec-real-id:completed")));
    }

    @Test
    void execute_emptyWorkflowWithStreaming_broadcastsErrorNotCompletion() {
        WorkflowResponse workflow = workflow("wf-empty", List.of(), List.of());
        Map<String, Object> state = executor.execute(
                "exec-empty",
                workflow,
                Map.of(),
                Map.of(),
                "user-1",
                true);

        assertEquals("failed", state.get("status"));
        assertTrue(recording.events.stream().anyMatch(e -> e.startsWith("error:exec-empty:")));
        assertFalse(recording.events.stream().anyMatch(e -> e.startsWith("completion:")));
    }

    private static Node node(String id, NodeType type) {
        Node n = new Node();
        n.setId(id);
        n.setType(type);
        n.setName(id);
        return n;
    }

    private static Node conditionNode(String id, String field, String value) {
        Node n = node(id, NodeType.CONDITION);
        ConditionConfig cfg = new ConditionConfig();
        cfg.setField(field);
        cfg.setValue(value);
        n.setConditionConfig(cfg);
        return n;
    }

    private static Edge edge(String source, String target) {
        Edge e = new Edge();
        e.setSource(source);
        e.setTarget(target);
        return e;
    }

    private static Edge edgeWithHandle(String source, String target, String handle) {
        Edge e = edge(source, target);
        e.setSourceHandle(handle);
        return e;
    }

    private static WorkflowResponse workflow(String id, List<Node> nodes, List<Edge> edges) {
        WorkflowResponse w = new WorkflowResponse();
        w.setId(id);
        w.setNodes(nodes);
        w.setEdges(edges);
        w.setVariables(new LinkedHashMap<>());
        return w;
    }
}
