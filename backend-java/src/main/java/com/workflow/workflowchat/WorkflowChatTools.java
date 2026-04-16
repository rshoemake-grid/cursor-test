package com.workflow.workflowchat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * OpenAI tool definitions for workflow chat (loaded from {@code workflow-chat-tools.json}).
 */
public final class WorkflowChatTools {

    private static final List<Map<String, Object>> TOOLS = load();

    private WorkflowChatTools() {
    }

    public static List<Map<String, Object>> definitions() {
        return TOOLS;
    }

    private static List<Map<String, Object>> load() {
        ObjectMapper om = new ObjectMapper();
        try (InputStream in = WorkflowChatTools.class.getResourceAsStream("/workflow-chat-tools.json")) {
            if (in == null) {
                throw new IllegalStateException("Missing classpath resource workflow-chat-tools.json");
            }
            return om.readValue(in, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Could not load workflow-chat-tools.json", e);
        }
    }
}
