package com.workflow.engine;

import com.workflow.dto.*;
import com.workflow.storage.WorkflowInputSourceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Heartbeat snapshot source: {@link WorkflowExecutor#peekRunningStateSnapshot(String)} while a run is active.
 */
class WorkflowExecutorPersistPeekTest {

    @Test
    void peekRunningStateSnapshot_visibleWhileAgentBlocked() throws Exception {
        CountDownLatch agentEntered = new CountDownLatch(1);
        CountDownLatch releaseAgent = new CountDownLatch(1);

        LlmApiClient blockingClient = (baseUrl, apiKey, model, messages) -> {
            agentEntered.countDown();
            try {
                releaseAgent.await();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
            return "done";
        };

        NodeTypeParser nodeTypeParser = new NodeTypeParser();
        WorkflowInputSourceService inputSvc = new WorkflowInputSourceService("", new ObjectMapper());
        NodeExecutorRegistry registry = new NodeExecutorRegistry(
                List.of(
                        new AgentNodeExecutor(blockingClient, null, null),
                        new ConditionNodeExecutor(),
                        new LoopNodeExecutor(),
                        new ToolNodeExecutor(),
                        new StorageNodeExecutor(inputSvc)),
                nodeTypeParser);
        ThreadPoolTaskExecutor pool = new ThreadPoolTaskExecutor();
        pool.setCorePoolSize(2);
        pool.setMaxPoolSize(4);
        pool.setQueueCapacity(20);
        pool.initialize();

        WorkflowExecutor executor = new WorkflowExecutor(registry, pool, null);

        Node start = node("start-1", NodeType.START);
        Node agent = agentNode("agent-1", "gpt-4o-mini", "sys");
        Node end = node("end-1", NodeType.END);
        WorkflowResponse workflow = workflow("wf-peek",
                List.of(start, agent, end),
                List.of(edge("start-1", "agent-1"), edge("agent-1", "end-1")));

        Map<String, Object> llmConfig = Map.of(
                "base_url", "https://api.openai.com/v1",
                "api_key", "sk-test",
                "model", "gpt-4o-mini"
        );

        String execId = "exec-peek-1";
        CompletableFuture<Map<String, Object>> done = CompletableFuture.supplyAsync(() ->
                executor.execute(execId, workflow, Map.of("message", "hi"), llmConfig, "user-1", false));

        assertTrue(agentEntered.await(10, TimeUnit.SECONDS));

        Map<String, Object> snap = executor.peekRunningStateSnapshot(execId);
        assertNotNull(snap);
        assertEquals("running", snap.get("status"));

        releaseAgent.countDown();
        Map<String, Object> finalState = done.get(30, TimeUnit.SECONDS);
        assertEquals("completed", finalState.get("status"));
        assertNull(executor.peekRunningStateSnapshot(execId));
    }

    private static Node node(String id, NodeType type) {
        Node n = new Node();
        n.setId(id);
        n.setType(type);
        return n;
    }

    private static Node agentNode(String id, String model, String systemPrompt) {
        Node n = new Node();
        n.setId(id);
        n.setType(NodeType.AGENT);
        AgentConfig cfg = new AgentConfig();
        cfg.setModel(model);
        cfg.setSystemPrompt(systemPrompt);
        n.setAgentConfig(cfg);
        return n;
    }

    private static Edge edge(String source, String target) {
        Edge e = new Edge();
        e.setSource(source);
        e.setTarget(target);
        return e;
    }

    private static WorkflowResponse workflow(String id, List<Node> nodes, List<Edge> edges) {
        WorkflowResponse w = new WorkflowResponse();
        w.setId(id);
        w.setNodes(nodes);
        w.setEdges(edges);
        return w;
    }
}
