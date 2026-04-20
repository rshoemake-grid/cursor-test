package com.workflow.engine;

import com.workflow.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.engine.LlmApiClient;
import com.workflow.engine.StorageNodeExecutor;
import com.workflow.storage.WorkflowInputSourceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;

import static org.junit.jupiter.api.Assertions.*;

class WorkflowExecutorTest {

    private WorkflowExecutor executor;
    private LlmApiClient mockLlmClient;

    @BeforeEach
    void setUp() {
        mockLlmClient = (baseUrl, apiKey, model, messages) -> "mocked response";
        NodeTypeParser nodeTypeParser = new NodeTypeParser();
        WorkflowInputSourceService inputSvc = new WorkflowInputSourceService("", new ObjectMapper());
        NodeExecutorRegistry registry = new NodeExecutorRegistry(
                List.of(
                        new AgentNodeExecutor(mockLlmClient, null, null, new ObjectMapper()),
                        new ConditionNodeExecutor(new ObjectMapper()),
                        new LoopNodeExecutor(new ObjectMapper()),
                        new ToolNodeExecutor(),
                        new StorageNodeExecutor(inputSvc)),
                nodeTypeParser);
        ThreadPoolTaskExecutor pool = new ThreadPoolTaskExecutor();
        pool.setCorePoolSize(2);
        pool.setMaxPoolSize(4);
        pool.setQueueCapacity(20);
        pool.initialize();
        executor = new WorkflowExecutor(registry, pool, null);
    }

    @Test
    void execute_startEndOnly_completesSuccessfully() {
        Node start = node("start-1", NodeType.START);
        Node end = node("end-1", NodeType.END);
        Edge edge = edge("start-1", "end-1");

        WorkflowResponse workflow = workflow("wf-1", List.of(start, end), List.of(edge));
        Map<String, Object> state = executor.execute(workflow, Map.of(), Map.of(), "user-1");

        assertEquals("completed", state.get("status"));
        assertNotNull(state.get("logs"));
        assertNotNull(state.get("node_states"));
        assertEquals("end-1", state.get("current_node"));
    }

    @Test
    void execute_conditionNode_evaluatesTrueBranch() {
        Node start = node("start-1", NodeType.START);
        Node cond = conditionNode("cond-1", "field1", "value1");
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "cond-1");
        Edge e2 = edgeWithHandle("cond-1", "end-1", "true");

        WorkflowResponse workflow = workflow("wf-1",
                List.of(start, cond, end),
                List.of(e1, e2));

        Map<String, Object> inputs = Map.of("field1", "value1");
        Map<String, Object> state = executor.execute(workflow, inputs, Map.of(), "user-1");

        assertEquals("completed", state.get("status"));
        @SuppressWarnings("unchecked")
        Map<String, Object> condState = (Map<String, Object>) ((Map<?, ?>) state.get("node_states")).get("cond-1");
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) condState.get("output");
        assertEquals("true", out.get("branch"));
    }

    @Test
    void execute_conditionNode_evaluatesFalseBranch() {
        Node start = node("start-1", NodeType.START);
        Node cond = conditionNode("cond-1", "field1", "other");
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "cond-1");
        Edge e2 = edgeWithHandle("cond-1", "end-1", "false");

        WorkflowResponse workflow = workflow("wf-1",
                List.of(start, cond, end),
                List.of(e1, e2));

        Map<String, Object> inputs = Map.of("field1", "nomatch");
        Map<String, Object> state = executor.execute(workflow, inputs, Map.of(), "user-1");

        assertEquals("completed", state.get("status"));
        @SuppressWarnings("unchecked")
        Map<String, Object> condState = (Map<String, Object>) ((Map<?, ?>) state.get("node_states")).get("cond-1");
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) condState.get("output");
        assertEquals("false", out.get("branch"));
    }

    @Test
    void execute_loopNode_iteratesAndReturnsLastResult() {
        Node start = node("start-1", NodeType.START);
        Node loop = node("loop-1", NodeType.LOOP);
        loop.setLoopConfig(new LoopConfig("for_each", null, null, 0));
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "loop-1");
        Edge e2 = edge("loop-1", "end-1");

        WorkflowResponse workflow = workflow("wf-1",
                List.of(start, loop, end),
                List.of(e1, e2));

        Map<String, Object> inputs = Map.of("items", List.of("a", "b", "c"));
        Map<String, Object> state = executor.execute(workflow, inputs, Map.of(), "user-1");

        assertEquals("completed", state.get("status"));
        @SuppressWarnings("unchecked")
        Map<String, Object> loopState = (Map<String, Object>) ((Map<?, ?>) state.get("node_states")).get("loop-1");
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) loopState.get("output");
        assertEquals("for_each", out.get("loop_type"));
        assertEquals(3, out.get("total_iterations"));
        assertEquals(List.of("a", "b", "c"), out.get("items"));
    }

    @Test
    void execute_agentNode_callsLlmAndReturnsResponse() {
        Node start = node("start-1", NodeType.START);
        Node agent = agentNode("agent-1", "gpt-4o-mini", "You are helpful.");
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "agent-1");
        Edge e2 = edge("agent-1", "end-1");

        WorkflowResponse workflow = workflow("wf-1",
                List.of(start, agent, end),
                List.of(e1, e2));

        Map<String, Object> llmConfig = Map.of(
                "base_url", "https://api.openai.com/v1",
                "api_key", "sk-test",
                "model", "gpt-4o-mini"
        );
        Map<String, Object> inputs = Map.of("message", "Hello");
        Map<String, Object> state = executor.execute(workflow, inputs, llmConfig, "user-1");

        assertEquals("completed", state.get("status"));
        @SuppressWarnings("unchecked")
        Map<String, Object> agentState = (Map<String, Object>) ((Map<?, ?>) state.get("node_states")).get("agent-1");
        assertEquals("mocked response", agentState.get("output"));
    }

    @Test
    void execute_parallelIndependentTools_bothRunBeforeEnd() {
        Node start = node("start-1", NodeType.START);
        Node t1 = node("tool-1", NodeType.TOOL);
        Node t2 = node("tool-2", NodeType.TOOL);
        Node end = node("end-1", NodeType.END);

        WorkflowResponse workflow = workflow("wf-parallel",
                List.of(start, t1, t2, end),
                List.of(
                        edge("start-1", "tool-1"),
                        edge("start-1", "tool-2"),
                        edge("tool-1", "end-1"),
                        edge("tool-2", "end-1")));

        Map<String, Object> state = executor.execute(workflow, Map.of("in", "x"), Map.of(), "user-1");

        assertEquals("completed", state.get("status"));
        @SuppressWarnings("unchecked")
        Map<String, Object> ns = (Map<String, Object>) state.get("node_states");
        assertTrue(ns.containsKey("tool-1"));
        assertTrue(ns.containsKey("tool-2"));
    }

    @Test
    void execute_conditionUsesEdgeConditionField() {
        Node start = node("start-1", NodeType.START);
        Node cond = conditionNode("cond-1", "k", "1");
        Node ok = node("ok-1", NodeType.TOOL);
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "cond-1");
        Edge eTrue = edge("cond-1", "ok-1");
        eTrue.setCondition("true");
        Edge eEnd = edge("ok-1", "end-1");

        WorkflowResponse workflow = workflow("wf-cond-edge",
                List.of(start, cond, ok, end),
                List.of(e1, eTrue, eEnd));

        Map<String, Object> state = executor.execute(workflow, Map.of("k", "1"), Map.of(), "user-1");
        assertEquals("completed", state.get("status"));
    }

    @Test
    void execute_emptyWorkflow_failsWithError() {
        WorkflowResponse workflow = workflow("wf-1", List.of(), List.of());
        Map<String, Object> state = executor.execute(workflow, Map.of(), Map.of(), "user-1");

        assertEquals("failed", state.get("status"));
        assertNotNull(state.get("error"));
    }

    @Test
    void execute_conditionNode_nullOrMissingInput_evaluatesFalse() {
        Node start = node("start-1", NodeType.START);
        Node cond = conditionNode("cond-1", "missingField", "expected");
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "cond-1");
        Edge e2 = edgeWithHandle("cond-1", "end-1", "false");

        WorkflowResponse workflow = workflow("wf-1",
                List.of(start, cond, end),
                List.of(e1, e2));

        Map<String, Object> inputs = Map.of();
        Map<String, Object> state = executor.execute(workflow, inputs, Map.of(), "user-1");

        assertEquals("completed", state.get("status"));
        @SuppressWarnings("unchecked")
        Map<String, Object> condState = (Map<String, Object>) ((Map<?, ?>) state.get("node_states")).get("cond-1");
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) condState.get("output");
        assertEquals("false", out.get("branch"));
    }

    @Test
    void execute_loopNode_emptyItems_returnsNull() {
        Node start = node("start-1", NodeType.START);
        Node loop = node("loop-1", NodeType.LOOP);
        loop.setLoopConfig(new LoopConfig("for_each", null, null, 0));
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "loop-1");
        Edge e2 = edge("loop-1", "end-1");

        WorkflowResponse workflow = workflow("wf-1",
                List.of(start, loop, end),
                List.of(e1, e2));

        Map<String, Object> inputs = Map.of("items", List.of());
        Map<String, Object> state = executor.execute(workflow, inputs, Map.of(), "user-1");

        assertEquals("completed", state.get("status"));
        @SuppressWarnings("unchecked")
        Map<String, Object> loopState = (Map<String, Object>) ((Map<?, ?>) state.get("node_states")).get("loop-1");
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) loopState.get("output");
        assertEquals(0, out.get("total_iterations"));
        assertEquals(List.of(), out.get("items"));
    }

    @Test
    void execute_loopNode_singleItem_returnsThatItem() {
        Node start = node("start-1", NodeType.START);
        Node loop = node("loop-1", NodeType.LOOP);
        loop.setLoopConfig(new LoopConfig("for_each", null, null, 0));
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "loop-1");
        Edge e2 = edge("loop-1", "end-1");

        WorkflowResponse workflow = workflow("wf-1",
                List.of(start, loop, end),
                List.of(e1, e2));

        Map<String, Object> inputs = Map.of("items", List.of("only"));
        Map<String, Object> state = executor.execute(workflow, inputs, Map.of(), "user-1");

        assertEquals("completed", state.get("status"));
        @SuppressWarnings("unchecked")
        Map<String, Object> loopState = (Map<String, Object>) ((Map<?, ?>) state.get("node_states")).get("loop-1");
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) loopState.get("output");
        assertEquals(1, out.get("total_iterations"));
        assertEquals(List.of("only"), out.get("items"));
    }

    @Test
    void execute_agentNode_throws_failsWorkflow() {
        LlmApiClient failingClient = (baseUrl, apiKey, model, messages) -> {
            throw new RuntimeException("LLM API error");
        };
        NodeTypeParser nodeTypeParser = new NodeTypeParser();
        NodeExecutorRegistry registry = new NodeExecutorRegistry(
                List.of(
                        new AgentNodeExecutor(failingClient, null, null, new ObjectMapper()),
                        new ConditionNodeExecutor(new ObjectMapper()),
                        new LoopNodeExecutor(new ObjectMapper()),
                        new ToolNodeExecutor()),
                nodeTypeParser);
        ThreadPoolTaskExecutor pool = new ThreadPoolTaskExecutor();
        pool.setCorePoolSize(2);
        pool.setMaxPoolSize(4);
        pool.setQueueCapacity(20);
        pool.initialize();
        WorkflowExecutor failingExecutor = new WorkflowExecutor(registry, pool, null);

        Node start = node("start-1", NodeType.START);
        Node agent = agentNode("agent-1", "gpt-4o-mini", "You are helpful.");
        Node end = node("end-1", NodeType.END);

        Edge e1 = edge("start-1", "agent-1");
        Edge e2 = edge("agent-1", "end-1");

        WorkflowResponse workflow = workflow("wf-1",
                List.of(start, agent, end),
                List.of(e1, e2));

        Map<String, Object> state = failingExecutor.execute(workflow, Map.of(), Map.of("api_key", "sk-test"), "user-1");

        assertEquals("failed", state.get("status"));
        assertNotNull(state.get("error"));
        assertEquals("LLM API error", state.get("error"));
    }

    @Test
    void execute_agentNode_wallTimeout_failsWithTimeoutMessage() {
        CountDownLatch block = new CountDownLatch(1);
        LlmApiClient slow = (baseUrl, apiKey, model, messages) -> {
            try {
                block.await();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
            return "x";
        };
        NodeTypeParser nodeTypeParser = new NodeTypeParser();
        WorkflowInputSourceService inputSvc = new WorkflowInputSourceService("", new ObjectMapper());
        NodeExecutorRegistry registry = new NodeExecutorRegistry(
                List.of(
                        new AgentNodeExecutor(slow, null, null, new ObjectMapper()),
                        new ConditionNodeExecutor(new ObjectMapper()),
                        new LoopNodeExecutor(new ObjectMapper()),
                        new ToolNodeExecutor(),
                        new StorageNodeExecutor(inputSvc)),
                nodeTypeParser);
        ThreadPoolTaskExecutor pool = new ThreadPoolTaskExecutor();
        pool.setCorePoolSize(2);
        pool.setMaxPoolSize(4);
        pool.setQueueCapacity(20);
        pool.initialize();
        MockEnvironment env = new MockEnvironment().withProperty("NODE_EXECUTION_TIMEOUT_SEC", "1");
        WorkflowExecutor timedExecutor = new WorkflowExecutor(registry, pool, null, env);

        Node start = node("start-1", NodeType.START);
        Node agent = agentNode("agent-1", "gpt-4o-mini", "You are helpful.");
        Node end = node("end-1", NodeType.END);
        WorkflowResponse workflow = workflow(
                "wf-1",
                List.of(start, agent, end),
                List.of(edge("start-1", "agent-1"), edge("agent-1", "end-1")));

        Map<String, Object> state = timedExecutor.execute(workflow, Map.of(), Map.of("api_key", "sk"), "user-1");

        block.countDown();
        assertEquals("failed", state.get("status"));
        assertTrue(String.valueOf(state.get("error")).contains("NODE_EXECUTION_TIMEOUT"));
    }

    private static Node node(String id, NodeType type) {
        Node n = new Node();
        n.setId(id);
        n.setType(type);
        return n;
    }

    private static Node conditionNode(String id, String field, String value) {
        Node n = new Node();
        n.setId(id);
        n.setType(NodeType.CONDITION);
        ConditionConfig cfg = new ConditionConfig();
        cfg.setField(field);
        cfg.setValue(value);
        n.setConditionConfig(cfg);
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
        e.setId("e-" + source + "-" + target);
        e.setSource(source);
        e.setTarget(target);
        return e;
    }

    private static Edge edgeWithHandle(String source, String target, String sourceHandle) {
        Edge e = edge(source, target);
        e.setSourceHandle(sourceHandle);
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
