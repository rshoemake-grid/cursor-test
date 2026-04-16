package com.workflow.workflowchat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.engine.LlmApiClient;
import com.workflow.service.ChatChangesService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkflowChatToolDispatcherTest {

    @Mock
    private ChatChangesService chatChangesService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private WorkflowChatToolDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        dispatcher = new WorkflowChatToolDispatcher(chatChangesService, objectMapper);
    }

    @Test
    void addNode_appendsBucket() throws Exception {
        WorkflowChatToolDispatcher.ChatSession session = new WorkflowChatToolDispatcher.ChatSession();
        LlmApiClient.ToolCallSpec call = new LlmApiClient.ToolCallSpec(
                "t1",
                "add_node",
                "{\"node_type\":\"agent\",\"name\":\"My agent\"}");
        dispatcher.dispatch(call, session, null, "user-1");
        assertEquals(1, session.workflowChanges.get("nodes_to_add").size());
        @SuppressWarnings("unchecked")
        Map<String, Object> node = (Map<String, Object>) session.workflowChanges.get("nodes_to_add").get(0);
        assertEquals("My agent", node.get("name"));
        assertTrue(String.valueOf(node.get("id")).startsWith("agent-"));
    }

    @Test
    void getWorkflowInfo_returnsLiveSummaryText() throws Exception {
        WorkflowChatToolDispatcher.ChatSession session = new WorkflowChatToolDispatcher.ChatSession();
        session.liveSummary.put("text", "canvas summary");
        LlmApiClient.ToolCallSpec call = new LlmApiClient.ToolCallSpec("t2", "get_workflow_info", "{}");
        Map<String, Object> msg = dispatcher.dispatch(call, session, null, "user-1");
        assertEquals("tool", msg.get("role"));
        assertEquals("canvas summary", msg.get("content"));
    }

    @Test
    void saveWorkflow_delegatesToService() throws Exception {
        when(chatChangesService.applyChatChanges(
                        eq("wf-1"),
                        anyList(),
                        anyList(),
                        anyList(),
                        anyList(),
                        anyList(),
                        any(Optional.class),
                        anyBoolean(),
                        any(),
                        eq("user-1")))
                .thenReturn(Map.of(
                        "final_nodes", List.of(),
                        "final_edges", List.of(),
                        "nodes_count", 0,
                        "edges_count", 0));

        WorkflowChatToolDispatcher.ChatSession session = new WorkflowChatToolDispatcher.ChatSession();
        session.snapshot = new java.util.LinkedHashMap<>(Map.of("nodes", List.of(), "edges", List.of()));
        LlmApiClient.ToolCallSpec call = new LlmApiClient.ToolCallSpec(
                "t3",
                "save_workflow",
                "{\"name\":\"N\",\"description\":null}");
        Map<String, Object> msg = dispatcher.dispatch(call, session, "wf-1", "user-1");
        assertEquals("tool", msg.get("role"));
        assertTrue(msg.get("content").toString().contains("success"));
        verify(chatChangesService).applyChatChanges(
                eq("wf-1"),
                anyList(),
                anyList(),
                anyList(),
                anyList(),
                anyList(),
                any(Optional.class),
                anyBoolean(),
                any(),
                eq("user-1"));
    }

    @Test
    void unknownTool_returnsError() throws Exception {
        WorkflowChatToolDispatcher.ChatSession session = new WorkflowChatToolDispatcher.ChatSession();
        LlmApiClient.ToolCallSpec call = new LlmApiClient.ToolCallSpec("t4", "not_a_tool", "{}");
        Map<String, Object> msg = dispatcher.dispatch(call, session, null, "user-1");
        assertTrue(msg.get("content").toString().contains("Unknown function"));
    }
}
