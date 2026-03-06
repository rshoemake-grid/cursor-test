package com.workflow.service;

import com.workflow.dto.WorkflowChatRequest;
import com.workflow.dto.WorkflowChatResponse;
import com.workflow.entity.Workflow;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.JsonStateUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

/**
 * Workflow Chat Service - matches Python workflow_chat_routes
 * Uses LLM with tool-calling to create/edit workflows (simplified - single response without tool loop)
 */
@Service
public class WorkflowChatService {
    private static final Logger log = LoggerFactory.getLogger(WorkflowChatService.class);

    private final WorkflowRepository workflowRepository;
    private final SettingsService settingsService;
    private final WebClient.Builder webClientBuilder;

    public WorkflowChatService(WorkflowRepository workflowRepository, SettingsService settingsService,
                              WebClient.Builder webClientBuilder) {
        this.workflowRepository = workflowRepository;
        this.settingsService = settingsService;
        this.webClientBuilder = webClientBuilder;
    }

    @Transactional(readOnly = true)
    public WorkflowChatResponse chat(WorkflowChatRequest request, String userId) {
        Optional<Map<String, Object>> llmConfig = settingsService.getActiveLlmConfig(userId);
        if (llmConfig.isEmpty()) {
            throw new IllegalArgumentException(
                    "No LLM provider configured. Please configure an LLM provider in Settings.");
        }

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

        String model = (String) llmConfig.get().getOrDefault("model", "gpt-4o-mini");
        String baseUrl = (String) llmConfig.get().getOrDefault("base_url", "https://api.openai.com/v1");
        String apiKey = (String) llmConfig.get().get("api_key");

        try {
            String responseContent = webClientBuilder.build()
                    .post()
                    .uri(baseUrl + (baseUrl.endsWith("/") ? "" : "/") + "chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "model", model,
                            "messages", messages,
                            "temperature", 0.7
                    ))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .map(r -> {
                        var choices = (List<?>) r.get("choices");
                        if (choices != null && !choices.isEmpty()) {
                            var msg = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
                            if (msg != null) {
                                return (String) msg.get("content");
                            }
                        }
                        return "I couldn't generate a response.";
                    })
                    .block();

            return new WorkflowChatResponse(
                    responseContent != null ? responseContent : "I've processed your request.",
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
