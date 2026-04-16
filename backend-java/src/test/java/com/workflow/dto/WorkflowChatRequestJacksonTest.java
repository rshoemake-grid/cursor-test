package com.workflow.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Frontend and Python API use snake_case; Java fields must map explicitly.
 */
class WorkflowChatRequestJacksonTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void deserializesSnakeCasePayloadFromFrontend() throws Exception {
        String json = """
                {
                  "workflow_id": "wf-1",
                  "message": "Add a node",
                  "conversation_history": [{"role": "user", "content": "hi"}],
                  "iteration_limit": 10,
                  "canvas_snapshot": {"nodes": [], "edges": []}
                }
                """;
        WorkflowChatRequest req = mapper.readValue(json, WorkflowChatRequest.class);
        assertEquals("wf-1", req.getWorkflowId());
        assertEquals("Add a node", req.getMessage());
        assertNotNull(req.getConversationHistory());
        assertEquals(1, req.getConversationHistory().size());
        assertEquals("user", req.getConversationHistory().get(0).getRole());
        assertEquals("hi", req.getConversationHistory().get(0).getContent());
        assertEquals(10, req.getIterationLimit());
        assertNotNull(req.getCanvasSnapshot());
        assertEquals(0, ((List<?>) req.getCanvasSnapshot().get("nodes")).size());
        assertEquals(0, ((List<?>) req.getCanvasSnapshot().get("edges")).size());
    }
}
