package com.workflow.service;

import com.workflow.dto.WorkflowChatRequest;
import com.workflow.dto.WorkflowChatResponse;
import com.workflow.engine.LlmApiClient;
import com.workflow.entity.Workflow;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ObjectUtils;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.WorkflowMapper;
import com.workflow.util.LlmConfigUtils;
import org.springframework.core.env.Environment;
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
    private static final String SYSTEM_PROMPT_PREFIX = "You are an AI assistant that helps users create and modify workflow graphs. " +
            "Respond with helpful suggestions. If the user wants to make changes, describe what you would do. " +
            "Current workflow context:\n";

    private final WorkflowRepository workflowRepository;
    private final WorkflowMapper workflowMapper;
    private final SettingsService settingsService;
    private final LlmApiClient llmApiClient;
    private final WorkflowOwnershipService ownershipService;
    private final Environment environment;

    public WorkflowChatService(WorkflowRepository workflowRepository, WorkflowMapper workflowMapper,
                              SettingsService settingsService, LlmApiClient llmApiClient,
                              WorkflowOwnershipService ownershipService, Environment environment) {
        this.workflowRepository = workflowRepository;
        this.workflowMapper = workflowMapper;
        this.settingsService = settingsService;
        this.llmApiClient = llmApiClient;
        this.ownershipService = ownershipService;
        this.environment = environment;
    }

    @Transactional(readOnly = true)
    public WorkflowChatResponse chat(WorkflowChatRequest request, String userId) {
        Map<String, Object> llmConfig = settingsService.getActiveLlmConfig(userId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorMessages.NO_LLM_PROVIDER_CONFIGURED));

        String workflowContext = getWorkflowContext(request.getWorkflowId(), userId);
        String systemPrompt = SYSTEM_PROMPT_PREFIX + workflowContext;

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(LlmConfigUtils.buildMessage("system", systemPrompt));
        if (request.getConversationHistory() != null) {
            for (var m : request.getConversationHistory()) {
                messages.add(LlmConfigUtils.buildMessage(m.getRole(), m.getContent()));
            }
        }
        messages.add(LlmConfigUtils.buildMessage("user", request.getMessage()));

        LlmConfigUtils.LlmRequestContext ctx = LlmConfigUtils.prepareRequest(llmConfig, environment);

        try {
            String responseContent = llmApiClient.chatCompletions(ctx.url(), ctx.apiKey(), ctx.model(), messages);
            return new WorkflowChatResponse(
                    ObjectUtils.orDefaultIfBlank(responseContent, "I've processed your request."),
                    null,
                    request.getWorkflowId());
        } catch (Exception e) {
            log.warn("Workflow chat LLM call failed: {}", e.getMessage());
            throw new IllegalArgumentException(ErrorMessages.chatError(e.getMessage()));
        }
    }

    private String getWorkflowContext(String workflowId, String userId) {
        if (workflowId == null || workflowId.isBlank()) {
            return "No workflow loaded. You can create a new workflow.";
        }
        Workflow w = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.workflowNotFound(workflowId));
        ownershipService.assertCanReadOrShare(w, userId);
        Map<String, Object> def = ObjectUtils.orEmptyMap(w.getDefinition());
        var nodes = workflowMapper.extractNodes(def);
        var edges = workflowMapper.extractEdges(def);

        StringBuilder sb = new StringBuilder();
        sb.append("Workflow: ").append(w.getName()).append("\n");
        sb.append("Nodes (").append(nodes.size()).append("):\n");
        for (var n : nodes) {
            sb.append("  - ").append(n.getId()).append(": ").append(ObjectUtils.toStringOrDefault(n.getType(), "unknown")).append("\n");
        }
        sb.append("Edges (").append(edges.size()).append("):\n");
        for (var e : edges) {
            sb.append("  - ").append(e.getSource()).append(" -> ").append(e.getTarget()).append("\n");
        }
        return sb.toString();
    }
}
