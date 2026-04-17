package com.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.WorkflowChatRequest;
import com.workflow.dto.WorkflowChatResponse;
import com.workflow.engine.DelegatingLlmApiClient;
import com.workflow.engine.LlmApiClient;
import com.workflow.entity.Settings;
import com.workflow.repository.SettingsRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowShareRepository;
import com.workflow.util.WorkflowMapper;
import com.workflow.workflowchat.WorkflowChatToolDispatcher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Uses real {@link SettingsService}, {@link WorkflowMapper}, and {@link WorkflowOwnershipService} with mocked
 * repositories. {@link LlmApiClient} is a concrete {@link DelegatingLlmApiClient} so tool-calling is not routed
 * through Mockito (interface default methods would throw {@link UnsupportedOperationException}).
 */
@ExtendWith(MockitoExtension.class)
class WorkflowChatServiceTest {

    @Mock
    private WorkflowRepository workflowRepository;
    @Mock
    private WorkflowShareRepository workflowShareRepository;
    @Mock
    private SettingsRepository settingsRepository;
    @Mock
    private Environment environment;
    @Mock
    private ChatChangesService chatChangesService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SettingsService settingsService;
    private WorkflowOwnershipService ownershipService;
    private WorkflowMapper workflowMapper;

    @BeforeEach
    void setUp() {
        lenient().when(environment.getProperty(anyString())).thenReturn(null);
        workflowMapper = new WorkflowMapper(objectMapper);
        settingsService = new SettingsService(settingsRepository, environment);
        ownershipService = new WorkflowOwnershipService(workflowRepository, workflowShareRepository);
    }

    private WorkflowChatService buildService(LlmApiClient llmApiClient) {
        WorkflowChatToolDispatcher toolDispatcher = new WorkflowChatToolDispatcher(chatChangesService, objectMapper);
        return new WorkflowChatService(
                workflowRepository,
                workflowMapper,
                settingsService,
                llmApiClient,
                ownershipService,
                environment,
                toolDispatcher,
                objectMapper);
    }

    private void stubLlmSettingsForUserU() {
        Map<String, Object> provider = Map.of(
                "type", "openai",
                "enabled", true,
                "apiKey", "sk-openai-workflow-chat-test-01",
                "baseUrl", "https://api.openai.com/v1",
                "model", "gpt-4o-mini");
        Settings s = new Settings();
        s.setUserId("u");
        s.setSettingsData(new HashMap<>(Map.of("providers", List.of(provider))));
        when(settingsRepository.findById("u")).thenReturn(Optional.of(s));
    }

    @Test
    void chat_usesChatAssistantModelFromSettings() {
        Map<String, Object> provider = new HashMap<>();
        provider.put("type", "openai");
        provider.put("enabled", true);
        provider.put("apiKey", "sk-openai-workflow-chat-test-01");
        provider.put("baseUrl", "https://api.openai.com/v1");
        provider.put("defaultModel", "gpt-4o-mini");
        provider.put("models", List.of("gpt-4o-mini", "gpt-4o"));
        Settings s = new Settings();
        s.setUserId("u");
        Map<String, Object> data = new HashMap<>();
        data.put("providers", List.of(provider));
        data.put("chat_assistant_model", "gpt-4o");
        s.setSettingsData(data);
        when(settingsRepository.findById("u")).thenReturn(Optional.of(s));

        AtomicReference<String> modelUsed = new AtomicReference<>();
        LlmApiClient llm = new DelegatingLlmApiClient(
                (u, k, m, msgs, tools) -> {
                    modelUsed.set(m);
                    return new LlmApiClient.ChatCompletionRound("Hi.", List.of());
                },
                (u, k, m, msgs) -> fail("unexpected chatCompletions"));
        WorkflowChatService chatService = buildService(llm);

        WorkflowChatRequest req = new WorkflowChatRequest();
        req.setMessage("hello");
        WorkflowChatResponse resp = chatService.chat(req, "u");

        assertEquals("Hi.", resp.getMessage());
        assertEquals("gpt-4o", modelUsed.get());
    }

    @Test
    void chat_fallsBackToSingleCompletion_whenToolsUnsupported() {
        stubLlmSettingsForUserU();
        LlmApiClient llm = new DelegatingLlmApiClient(
                (u, k, m, msgs, tools) -> {
                    throw new UnsupportedOperationException("no tools");
                },
                (u, k, m, msgs) -> "plain reply");
        WorkflowChatService chatService = buildService(llm);

        WorkflowChatRequest req = new WorkflowChatRequest();
        req.setMessage("hello");
        WorkflowChatResponse resp = chatService.chat(req, "u");

        assertEquals("plain reply", resp.getMessage());
        assertNull(resp.getWorkflowChanges());
    }

    @Test
    void chat_runsToolThenFinishesWithAssistantText() {
        stubLlmSettingsForUserU();
        AtomicInteger round = new AtomicInteger();
        LlmApiClient llm = new DelegatingLlmApiClient(
                (u, k, m, msgs, tools) -> {
                    if (round.getAndIncrement() == 0) {
                        return new LlmApiClient.ChatCompletionRound(
                                "",
                                List.of(new LlmApiClient.ToolCallSpec(
                                        "c1",
                                        "add_node",
                                        "{\"node_type\":\"agent\",\"name\":\"A\"}")));
                    }
                    return new LlmApiClient.ChatCompletionRound("Done.", List.of());
                },
                (u, k, m, msgs) -> fail("unexpected chatCompletions"));
        WorkflowChatService chatService = buildService(llm);

        WorkflowChatRequest req = new WorkflowChatRequest();
        req.setMessage("add node");
        WorkflowChatResponse resp = chatService.chat(req, "u");

        assertEquals("Done.", resp.getMessage());
        assertNotNull(resp.getWorkflowChanges());
        @SuppressWarnings("unchecked")
        List<Object> added = (List<Object>) resp.getWorkflowChanges().get("nodes_to_add");
        assertEquals(1, added.size());
    }

    @Test
    void chat_respectsRequestIterationLimit() {
        stubLlmSettingsForUserU();
        LlmApiClient llm = new DelegatingLlmApiClient(
                (u, k, m, msgs, tools) -> new LlmApiClient.ChatCompletionRound(
                        "",
                        List.of(new LlmApiClient.ToolCallSpec(
                                "x",
                                "get_workflow_info",
                                "{}"))),
                (u, k, m, msgs) -> fail("unexpected chatCompletions"));
        WorkflowChatService chatService = buildService(llm);

        WorkflowChatRequest req = new WorkflowChatRequest();
        req.setMessage("loop");
        req.setIterationLimit(2);
        WorkflowChatResponse resp = chatService.chat(req, "u");

        assertTrue(resp.getMessage().contains("Stopped after 2"), () -> "got: " + resp.getMessage());
    }
}
