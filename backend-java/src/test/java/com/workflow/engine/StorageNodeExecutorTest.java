package com.workflow.engine;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import com.workflow.storage.WorkflowInputSourceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class StorageNodeExecutorTest {

    @Test
    void readMode_wrapsPayload(@TempDir Path base) {
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), new com.fasterxml.jackson.databind.ObjectMapper());
        StorageNodeExecutor exec = new StorageNodeExecutor(svc);
        Node n = new Node();
        n.setId("s1");
        n.setType(NodeType.LOCAL_FILESYSTEM);
        n.setInputConfig(new java.util.LinkedHashMap<>(Map.of("mode", "read", "file_path", base.resolve("f.json").toString())));
        ExecutionState state = new ExecutionState();
        NodeExecutionContext ctx = new NodeExecutionContext(Map.of(), "u", List.of(), Map.of());

        assertThrows(IllegalStateException.class, () -> exec.execute(n, Map.of(), state, ctx));

        try {
            Files.writeString(base.resolve("f.json"), "\"ok\"");
        } catch (Exception e) {
            throw new AssertionError(e);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) exec.execute(n, Map.of(), state, ctx);
        assertEquals("ok", out.get("data"));
        assertEquals("local_filesystem", out.get("source"));
    }

    @Test
    void readMode_lines_matchesPythonExecutorShape(@TempDir Path base) throws Exception {
        Files.writeString(base.resolve("lines.txt"), "a\nb\n", StandardCharsets.UTF_8);
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), new com.fasterxml.jackson.databind.ObjectMapper());
        StorageNodeExecutor exec = new StorageNodeExecutor(svc);
        Node n = new Node();
        n.setId("sl");
        n.setType(NodeType.LOCAL_FILESYSTEM);
        n.setInputConfig(new java.util.LinkedHashMap<>(Map.of(
                "mode", "read",
                "file_path", base.resolve("lines.txt").toString(),
                "read_mode", "lines",
                "max_lines", 10)));
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) exec.execute(
                n, Map.of(), new ExecutionState(), new NodeExecutionContext(Map.of(), "u", List.of(), Map.of()));
        assertEquals("lines", out.get("read_mode"));
        assertEquals("local_filesystem", out.get("source"));
        assertNotNull(out.get("data"));
        assertEquals(out.get("data"), out.get("items"));
        assertEquals(2, out.get("total_lines"));
    }

    @Test
    void writeMode_withInputs_writes(@TempDir Path base) {
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), new com.fasterxml.jackson.databind.ObjectMapper());
        StorageNodeExecutor exec = new StorageNodeExecutor(svc);
        Node n = new Node();
        n.setId("s2");
        n.setType(NodeType.LOCAL_FILESYSTEM);
        n.setInputConfig(new java.util.LinkedHashMap<>(Map.of("mode", "write", "file_path", base.resolve("out.json").toString())));

        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) exec.execute(
                n,
                Map.of("data", Map.of("x", 1)),
                new ExecutionState(),
                new NodeExecutionContext(Map.of(), "u", List.of(), Map.of()));
        assertEquals("success", result.get("status"));
    }

    @Test
    void writeMode_noPayload_throws() {
        WorkflowInputSourceService svc = new WorkflowInputSourceService("", new com.fasterxml.jackson.databind.ObjectMapper());
        StorageNodeExecutor exec = new StorageNodeExecutor(svc);
        Node n = new Node();
        n.setId("s3");
        n.setType(NodeType.LOCAL_FILESYSTEM);
        n.setInputConfig(new java.util.LinkedHashMap<>(Map.of("mode", "write", "file_path", "/tmp/x")));
        assertThrows(
                IllegalArgumentException.class,
                () -> exec.execute(n, Map.of(), new ExecutionState(), new NodeExecutionContext(Map.of(), "u", List.of(), Map.of())));
    }

    @Test
    void readMode_incomingEdgeFromAgent_triggersWritePath(@TempDir Path base) throws Exception {
        WorkflowInputSourceService svc = new WorkflowInputSourceService(base.toString(), new com.fasterxml.jackson.databind.ObjectMapper());
        StorageNodeExecutor exec = new StorageNodeExecutor(svc);
        Node agent = new Node();
        agent.setId("a1");
        agent.setType(NodeType.AGENT);
        Node store = new Node();
        store.setId("s4");
        store.setType(NodeType.LOCAL_FILESYSTEM);
        store.setInputConfig(new java.util.LinkedHashMap<>(Map.of("file_path", base.resolve("w.json").toString())));
        Edge e = new Edge();
        e.setSource("a1");
        e.setTarget("s4");
        Map<String, Node> byId = Map.of("a1", agent, "s4", store);
        NodeExecutionContext ctx = new NodeExecutionContext(Map.of(), "u", List.of(e), byId);

        ExecutionState state = new ExecutionState();
        NodeState prev = new NodeState();
        prev.setOutput(Map.of("data", "payload"));
        state.getNodeStates().put("a1", prev);

        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) exec.execute(store, Map.of(), state, ctx);
        assertEquals("success", result.get("status"));
        assertTrue(Files.readString(base.resolve("w.json")).contains("payload"));
    }
}
