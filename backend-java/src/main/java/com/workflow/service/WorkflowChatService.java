package com.workflow.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.constants.WorkflowChatPrompts;
import com.workflow.dto.WorkflowChatRequest;
import com.workflow.dto.WorkflowChatResponse;
import com.workflow.engine.LlmApiClient;
import com.workflow.entity.Workflow;
import com.workflow.exception.ValidationException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.LlmConfigUtils;
import com.workflow.util.ObjectUtils;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.WorkflowChatContextFormatter;
import com.workflow.util.WorkflowMapper;
import com.workflow.workflowchat.WorkflowChatLiveSummary;
import com.workflow.workflowchat.WorkflowChatToolDispatcher;
import com.workflow.workflowchat.WorkflowChatTools;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Workflow Chat Service — tool-calling loop aligned with Python {@code backend/api/workflow_chat/service.py}.
 */
@Service
public class WorkflowChatService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowChatService.class);
    private static final int DEFAULT_CHAT_ITERATION_LIMIT = 20;
    private static final int MAX_CHAT_ITERATION_LIMIT = 100;

    private final WorkflowRepository workflowRepository;
    private final WorkflowMapper workflowMapper;
    private final SettingsService settingsService;
    private final LlmApiClient llmApiClient;
    private final WorkflowOwnershipService ownershipService;
    private final Environment environment;
    private final WorkflowChatToolDispatcher toolDispatcher;
    private final ObjectMapper objectMapper;

    public WorkflowChatService(
            WorkflowRepository workflowRepository,
            WorkflowMapper workflowMapper,
            SettingsService settingsService,
            LlmApiClient llmApiClient,
            WorkflowOwnershipService ownershipService,
            Environment environment,
            WorkflowChatToolDispatcher toolDispatcher,
            ObjectMapper objectMapper) {
        this.workflowRepository = workflowRepository;
        this.workflowMapper = workflowMapper;
        this.settingsService = settingsService;
        this.llmApiClient = llmApiClient;
        this.ownershipService = ownershipService;
        this.environment = environment;
        this.toolDispatcher = toolDispatcher;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public WorkflowChatResponse chat(WorkflowChatRequest request, String userId) {
        Map<String, Object> llmConfig = settingsService.getLlmConfigForWorkflowChat(userId)
                .orElseThrow(() -> new ValidationException(ErrorMessages.NO_LLM_PROVIDER_CONFIGURED));

        LlmConfigUtils.LlmRequestContext ctx = LlmConfigUtils.prepareRequest(llmConfig, environment);

        int iterationLimit = resolveIterationLimit(request.getIterationLimit(), userId);
        log.info("Workflow chat model={} iteration_limit={} user={}", ctx.model(), iterationLimit, userId != null ? userId : "anonymous");

        String workflowContext = buildWorkflowContextBlock(request, userId);
        WorkflowChatToolDispatcher.ChatSession session = new WorkflowChatToolDispatcher.ChatSession();
        session.snapshot = buildLiveSnapshot(request, userId);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(LlmConfigUtils.buildMessage("system", WorkflowChatPrompts.SYSTEM_PROMPT));
        messages.add(LlmConfigUtils.buildMessage("system", "Current workflow context:\n" + workflowContext));
        if (request.getConversationHistory() != null) {
            for (var m : request.getConversationHistory()) {
                messages.add(LlmConfigUtils.buildMessage(m.getRole(), m.getContent()));
            }
        }
        messages.add(LlmConfigUtils.buildMessage("user", request.getMessage()));

        session.liveSummary.put("text", workflowContext);

        String assistantMessage = null;
        int iteration = 0;
        try {
            while (iteration < iterationLimit) {
                iteration++;
                LlmApiClient.ChatCompletionRound round = llmApiClient.chatCompletionsWithTools(
                        ctx.url(), ctx.apiKey(), ctx.model(), messages, WorkflowChatTools.definitions());
                messages.add(round.toAssistantMessageMap());

                if (round.toolCalls().isEmpty()) {
                    assistantMessage = ObjectUtils.orDefaultIfBlank(
                            round.content(), "I've completed the requested changes to the workflow.");
                    break;
                }

                for (LlmApiClient.ToolCallSpec tc : round.toolCalls()) {
                    try {
                        Map<String, Object> toolMsg = toolDispatcher.dispatch(
                                tc, session, request.getWorkflowId(), userId);
                        messages.add(toolMsg);
                    } catch (Exception e) {
                        log.warn("Workflow chat tool error: {}", e.getMessage());
                        messages.add(toolErrorMessage(tc.id(), Map.of(
                                "status", "error",
                                "message", "Error executing tool: " + e.getMessage())));
                    }
                    WorkflowChatLiveSummary.refresh(
                            objectMapper, session.liveSummary, session.snapshot, session.workflowChanges);
                    refreshContextSystemMessage(messages, session.liveSummary.get("text"));
                }
            }

            if (iteration >= iterationLimit && assistantMessage == null) {
                assistantMessage = "I've processed your request and made changes to the workflow. "
                        + "(Stopped after " + iterationLimit + " iterations)";
            }
            if (assistantMessage == null) {
                assistantMessage = "I've completed the requested changes to the workflow.";
            }

            Map<String, Object> allChanges = mergeChangeBuckets(session.workflowChanges, session.savedChanges);
            Map<String, Object> workflowChangesOut = hasWorkflowChanges(allChanges) ? allChanges : null;
            return new WorkflowChatResponse(assistantMessage, workflowChangesOut, request.getWorkflowId());
        } catch (UnsupportedOperationException e) {
            log.warn("LLM client does not support tools, falling back to single completion: {}", e.getMessage());
            return fallbackSingleCompletion(ctx, messages, request);
        } catch (Exception e) {
            log.warn("Workflow chat failed: {}", e.getMessage());
            throw new ValidationException(ErrorMessages.chatError(e.getMessage()));
        }
    }

    private WorkflowChatResponse fallbackSingleCompletion(
            LlmConfigUtils.LlmRequestContext ctx,
            List<Map<String, Object>> messages,
            WorkflowChatRequest request) {
        try {
            String content = llmApiClient.chatCompletions(ctx.url(), ctx.apiKey(), ctx.model(), messages);
            return new WorkflowChatResponse(
                    ObjectUtils.orDefaultIfBlank(content, "I've processed your request."),
                    null,
                    request.getWorkflowId());
        } catch (Exception e) {
            throw new ValidationException(ErrorMessages.chatError(e.getMessage()));
        }
    }

    private int resolveIterationLimit(Integer requestLimit, String userId) {
        if (requestLimit != null) {
            return Math.max(1, Math.min(MAX_CHAT_ITERATION_LIMIT, requestLimit));
        }
        return settingsService.getChatIterationLimit(userId)
                .map(v -> Math.max(1, Math.min(MAX_CHAT_ITERATION_LIMIT, v)))
                .orElse(DEFAULT_CHAT_ITERATION_LIMIT);
    }

    private void refreshContextSystemMessage(List<Map<String, Object>> messages, String workflowText) {
        String content = "Current workflow context:\n" + workflowText;
        for (Map<String, Object> m : messages) {
            if ("system".equals(m.get("role"))) {
                Object c = m.get("content");
                if (c instanceof String s && s.startsWith("Current workflow context:")) {
                    m.put("content", content);
                    return;
                }
            }
        }
    }

    private Map<String, Object> mergeChangeBuckets(
            Map<String, List<Object>> pending,
            Map<String, List<Object>> saved) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (String key : WorkflowChatToolDispatcher.newChangeBuckets().keySet()) {
            List<Object> merged = new ArrayList<>(saved.getOrDefault(key, List.of()));
            merged.addAll(pending.getOrDefault(key, List.of()));
            out.put(key, merged);
        }
        return out;
    }

    private boolean hasWorkflowChanges(Map<String, Object> changes) {
        for (String key : List.of(
                "nodes_to_add", "nodes_to_update", "nodes_to_delete", "edges_to_add", "edges_to_delete")) {
            Object v = changes.get(key);
            if (v instanceof List<?> list && !list.isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> toolErrorMessage(String toolCallId, Map<String, Object> body) throws Exception {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("role", "tool");
        m.put("tool_call_id", toolCallId);
        m.put("content", objectMapper.writeValueAsString(body));
        return m;
    }

    private String buildWorkflowContextBlock(WorkflowChatRequest request, String userId) {
        if (request.getWorkflowId() == null || request.getWorkflowId().isBlank()) {
            return "No workflow loaded. You can create a new workflow.";
        }
        Map<String, Object> snap = buildLiveSnapshot(request, userId);
        if (snap == null) {
            return "No workflow loaded. You can create a new workflow.";
        }
        List<com.workflow.dto.Node> nodes = objectMapper.convertValue(
                snap.getOrDefault("nodes", List.of()), new TypeReference<>() {});
        List<com.workflow.dto.Edge> edges = objectMapper.convertValue(
                snap.getOrDefault("edges", List.of()), new TypeReference<>() {});
        return WorkflowChatContextFormatter.formatWorkflowForLlm(
                String.valueOf(snap.get("name")),
                ObjectUtils.toStringOrDefault(snap.get("description"), ""),
                nodes,
                edges);
    }

    private Map<String, Object> buildLiveSnapshot(WorkflowChatRequest request, String userId) {
        if (request.getWorkflowId() == null || request.getWorkflowId().isBlank()) {
            return null;
        }
        Workflow w = RepositoryUtils.findByIdOrThrow(
                workflowRepository, request.getWorkflowId(), ErrorMessages.workflowNotFound(request.getWorkflowId()));
        ownershipService.assertCanReadOrShare(w, userId);
        Map<String, Object> snap = new LinkedHashMap<>();
        snap.put("name", w.getName());
        snap.put("description", w.getDescription());
        Map<String, Object> canvas = request.getCanvasSnapshot();
        if (canvas != null && canvas.get("nodes") instanceof List && canvas.get("edges") instanceof List) {
            snap.put("nodes", new ArrayList<>(workflowMapper.definitionNodesAsMaps(
                    Map.of("nodes", canvas.get("nodes")))));
            snap.put("edges", new ArrayList<>(workflowMapper.definitionEdgesAsMaps(
                    Map.of("edges", canvas.get("edges")))));
        } else {
            Map<String, Object> def = ObjectUtils.orEmptyMap(w.getDefinition());
            snap.put("nodes", new ArrayList<>(workflowMapper.definitionNodesAsMaps(def)));
            snap.put("edges", new ArrayList<>(workflowMapper.definitionEdgesAsMaps(def)));
        }
        return snap;
    }
}
