package com.workflow.workflowchat;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class WorkflowChatToolsTest {

    @Test
    void definitions_loadsSevenTools() {
        List<Map<String, Object>> tools = WorkflowChatTools.definitions();
        assertEquals(7, tools.size());
        assertTrue(tools.stream().anyMatch(t -> "function".equals(t.get("type"))));
    }
}
