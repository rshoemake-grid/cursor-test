package com.workflow.service;

import com.workflow.dto.WorkflowChatRequest;
import com.workflow.dto.WorkflowChatResponse;
import com.workflow.engine.LlmApiClient;
import com.workflow.entity.Workflow;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.JsonStateUtils;
import com.workflow.util.LlmConfigUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Workflow Chat Service - matches Python workflow_chat_routes
 * Uses LlmApiClient (DRY: same as AgentNodeExecutor) for chat completions.
 */
@Service
public class WorkflowChatService {
    private static final Logger log = LoggerFactory.getLogger(WorkflowChatService.class);

    private final WorkflowRepository workflowRepository;
    private final SettingsService settingsService;
    private final LlmApiClient llmApiClient;

    public WorkflowChatService(WorkflowRepository workflowRepository, SettingsService settingsService,
                              LlmApiClient llmApiClient) {
        this.workflowRepository = workflowRepository;
        this.settingsService = settingsService;
        this.llmApiClient = llmApiClient;
    }

    @Transactional(readOnly = true)
    public WorkflowChatResponse chat(WorkflowChatRequest request, String userId) {
        Map<String, Object> llmConfig = settingsService.getActiveLlmConfig(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No LLM provider configured. Please configure an LLM provider in Settings."));

        String workflowContext = getWorkflowContext(request.getWorkflowId());
        String systemPrompt = "You are an AI assistant that helps users create and modify workflow graphs. " +
                "Respond with helpful suggestions. If the user wants to make changes, describe what you would do. " +
                "Current workflow context:\n" + workflowContext;

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (request.getConversationHistory() != null) {
            for (var m : request.getConversationHistory()) {
                messages.add(Map.of("role", m.getRole(), "content", m.getContent()));
            }
        }
        messages.add(Map.of("role", "user", "content", request.getMessage()));

        String baseUrl = LlmConfigUtils.getBaseUrl(llmConfig);
        String apiKey = LlmConfigUtils.getApiKey(llmConfig);
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("No LLM API key configured in Settings.");
        }
        String model = LlmConfigUtils.getModel(llmConfig);
        String url = LlmConfigUtils.buildChatCompletionsUrl(baseUrl);

        try {
            String responseContent = llmApiClient.chatCompletions(url, apiKey, model, messages);
            return new WorkflowChatResponse(
                    responseContent != null && !responseContent.isBlank() ? responseContent : "I've processed your request.",
                    null,
                    request.getWorkflowId());
        } catch (Exception e) {
            log.warn("Workflow chat LLM call failed: {}", e.getMessage());
            throw new IllegalArgumentException("Chat error: " + e.getMessage());
        }
    }

    private String getWorkflowContext(String workflowId) {
        if (workflowId == null || workflowId.isBlank()) {
            return "No workflow loaded. You can create a new workflow.";
        }
        Workflow w = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        Map<String, Object> def = w.getDefinition();
        List<Map<String, Object>> nodes = JsonStateUtils.getListOfMaps(def, "nodes");
        List<Map<String, Object>> edges = JsonStateUtils.getListOfMaps(def, "edges");

        StringBuilder sb = new StringBuilder();
        sb.append("Workflow: ").append(w.getName()).append("\n");
        sb.append("Nodes (").append(nodes.size()).append("):\n");
        for (var n : nodes) {
            sb.append("  - ").append(n.get("id")).append(": ").append(n.get("type")).append("\n");
        }
        sb.append("Edges (").append(edges.size()).append("):\n");
        for (var e : edges) {
            sb.append("  - ").append(e.get("source")).append(" -> ").append(e.get("target")).append("\n");
        }
        return sb.toString();
    }
}
