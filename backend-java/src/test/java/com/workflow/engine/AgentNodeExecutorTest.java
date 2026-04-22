package com.workflow.engine;

import com.workflow.dto.ADKAgentConfig;
import com.workflow.dto.AgentConfig;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import com.workflow.entity.Settings;
import com.workflow.repository.SettingsRepository;
import com.workflow.service.SettingsService;
import com.workflow.util.ErrorMessages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgentNodeExecutorTest {

    @Mock
    private SettingsRepository settingsRepository;

    private SettingsService settingsService;

    @BeforeEach
    void setUp() {
        settingsService = new SettingsService(settingsRepository, new MockEnvironment());
    }

    @Test
    void execute_routesAnthropicWhenProviderResolved() {
        MockEnvironment env = new MockEnvironment().withProperty("ANTHROPIC_API_KEY", "fallback-ant");
        CapturingLlmClient client = new CapturingLlmClient();
        AgentNodeExecutor exec =
                new AgentNodeExecutor(
                        client,
                        env,
                        settingsService,
                        new com.fasterxml.jackson.databind.ObjectMapper(),
                        new AdkAgentRunner(env));

        Map<String, Object> anthropic = new HashMap<>();
        anthropic.put("type", "anthropic");
        anthropic.put("enabled", true);
        anthropic.put("apiKey", "sk-ant-integration-test-key-0001");
        anthropic.put("baseUrl", "https://api.anthropic.com/v1");
        anthropic.put("models", List.of("claude-3"));
        when(settingsRepository.findById("u1"))
                .thenReturn(Optional.of(settingsRow("u1", Map.of("providers", List.of(anthropic)))));

        Node node = agentNode("claude-3", "Be helpful", "hi");
        Map<String, Object> ctxLlm = new HashMap<>();
        ctxLlm.put("type", "openai");
        ctxLlm.put("api_key", "ignored");
        ctxLlm.put("base_url", "https://api.openai.com/v1");
        ctxLlm.put("model", "gpt-4o-mini");

        NodeExecutionContext ctx = new NodeExecutionContext(ctxLlm, "u1", List.of(), Map.of());

        Object out = exec.execute(node, Map.of("message", "user text"), new ExecutionState(), ctx);

        assertEquals("anthropic-out", out);
        assertEquals("https://api.anthropic.com/v1", client.anthropicBase);
        assertEquals("sk-ant-integration-test-key-0001", client.anthropicKey);
        assertEquals("claude-3", client.anthropicModel);
        assertEquals("Be helpful", client.anthropicSystem);
        assertEquals("user text", client.anthropicUser);
    }

    @Test
    void execute_routesGeminiWhenProviderResolved() {
        MockEnvironment env = new MockEnvironment().withProperty("GEMINI_API_KEY", "fallback-g");
        CapturingLlmClient client = new CapturingLlmClient();
        AgentNodeExecutor exec =
                new AgentNodeExecutor(
                        client,
                        env,
                        settingsService,
                        new com.fasterxml.jackson.databind.ObjectMapper(),
                        new AdkAgentRunner(env));

        Map<String, Object> gemini = new HashMap<>();
        gemini.put("type", "gemini");
        gemini.put("enabled", true);
        gemini.put("apiKey", "gemini-api-integration-test-0001");
        gemini.put("baseUrl", "https://generativelanguage.googleapis.com/v1beta");
        gemini.put("models", List.of("gemini-pro"));
        when(settingsRepository.findById("u1"))
                .thenReturn(Optional.of(settingsRow("u1", Map.of("providers", List.of(gemini)))));

        Node node = agentNode("gemini-pro", "sys", "n1");
        Map<String, Object> ctxLlm = new HashMap<>();
        ctxLlm.put("type", "openai");
        ctxLlm.put("api_key", "sk-openai");
        ctxLlm.put("base_url", "https://api.openai.com/v1");
        ctxLlm.put("model", "gpt-4o-mini");

        NodeExecutionContext ctx = new NodeExecutionContext(ctxLlm, "u1", List.of(), Map.of());

        Object out = exec.execute(node, Map.of("message", "gem user"), new ExecutionState(), ctx);

        assertEquals("gemini-out", out);
        assertEquals("https://generativelanguage.googleapis.com/v1beta", client.geminiBase);
        assertEquals("gemini-api-integration-test-0001", client.geminiKey);
        assertEquals("gemini-pro", client.geminiModel);
    }

    @Test
    void execute_skipsSettingsLookupWhenUserIdNull() {
        MockEnvironment env = new MockEnvironment();
        CapturingLlmClient client = new CapturingLlmClient();
        AgentNodeExecutor exec =
                new AgentNodeExecutor(
                        client,
                        env,
                        settingsService,
                        new com.fasterxml.jackson.databind.ObjectMapper(),
                        new AdkAgentRunner(env));

        Node node = agentNode("gpt-4o-mini", "", "x");
        Map<String, Object> ctxLlm = Map.of(
                "type", "openai",
                "api_key", "sk-openai-agent-test-key-00001",
                "base_url", "https://api.openai.com/v1",
                "model", "gpt-4o-mini");
        NodeExecutionContext ctx = new NodeExecutionContext(ctxLlm, null, List.of(), Map.of());

        exec.execute(node, Map.of("message", "m"), new ExecutionState(), ctx);

        verify(settingsRepository, never()).findById(any());
    }

    @Test
    void execute_routesToAdkRunnerWhenWorkflowTypeWithAdkName() {
        MockEnvironment env = new MockEnvironment().withProperty("GEMINI_API_KEY", "gemini-test-key");
        AdkRunner adkRunner = mock(AdkRunner.class);
        when(adkRunner.run(
                        any(Node.class),
                        any(AgentConfig.class),
                        any(),
                        any(NodeExecutionContext.class),
                        any()))
                .thenReturn("adk-inferred");

        AgentNodeExecutor exec =
                new AgentNodeExecutor(
                        new CapturingLlmClient(),
                        env,
                        null,
                        new com.fasterxml.jackson.databind.ObjectMapper(),
                        adkRunner);

        Node node = adkWorkflowInferenceNode("infer-1");
        Map<String, Object> ctxLlm = new HashMap<>();
        ctxLlm.put("type", "gemini");
        ctxLlm.put("api_key", "gemini-test-key");
        ctxLlm.put("base_url", "https://generativelanguage.googleapis.com/v1beta");
        ctxLlm.put("model", "gemini-2.0-flash");
        NodeExecutionContext ctx = new NodeExecutionContext(ctxLlm, null, List.of(), Map.of());

        Object out = exec.execute(node, Map.of("message", "hi"), new ExecutionState(), ctx);

        assertEquals("adk-inferred", out);
        verify(adkRunner).run(eq(node), any(AgentConfig.class), eq("hi"), eq(ctx), any());
    }

    @Test
    void execute_routesToAdkRunnerWhenAgentTypeAdk() {
        MockEnvironment env = new MockEnvironment().withProperty("GEMINI_API_KEY", "gemini-test-key");
        AdkRunner adkRunner = mock(AdkRunner.class);
        when(adkRunner.run(
                        any(Node.class),
                        any(AgentConfig.class),
                        any(),
                        any(NodeExecutionContext.class),
                        any()))
                .thenReturn("adk-response");

        AgentNodeExecutor exec =
                new AgentNodeExecutor(
                        new CapturingLlmClient(),
                        env,
                        null,
                        new com.fasterxml.jackson.databind.ObjectMapper(),
                        adkRunner);

        Node node = adkAgentNode("adk-node-1");
        Map<String, Object> ctxLlm = new HashMap<>();
        ctxLlm.put("type", "gemini");
        ctxLlm.put("api_key", "gemini-test-key");
        ctxLlm.put("base_url", "https://generativelanguage.googleapis.com/v1beta");
        ctxLlm.put("model", "gemini-2.0-flash");
        NodeExecutionContext ctx = new NodeExecutionContext(ctxLlm, null, List.of(), Map.of());

        Map<String, Object> in = new LinkedHashMap<>();
        in.put("message", "hi");
        in.put("extra", "x");
        Object out = exec.execute(node, in, new ExecutionState(), ctx);

        assertEquals("adk-response", out);
        verify(adkRunner)
                .run(eq(node), any(AgentConfig.class), eq("message: hi\nextra: x"), eq(ctx), any());
    }

    @Test
    void execute_throwsWhenLlmConfigEmpty() {
        AgentNodeExecutor exec =
                new AgentNodeExecutor(
                        new CapturingLlmClient(),
                        new MockEnvironment(),
                        null,
                        new com.fasterxml.jackson.databind.ObjectMapper(),
                        new AdkAgentRunner(new MockEnvironment()));
        Node node = agentNode("m", "", "x");
        NodeExecutionContext ctx = new NodeExecutionContext(Map.of(), "u", List.of(), Map.of());
        IllegalStateException ex =
                assertThrows(
                        IllegalStateException.class,
                        () -> exec.execute(node, Map.of(), new ExecutionState(), ctx));
        assertEquals(ErrorMessages.LLM_CONFIG_REQUIRED_AGENT, ex.getMessage());
    }

    @Test
    void execute_geminiVertexAdc_usesOpenAiCompatibleCompletions() {
        MockEnvironment env = new MockEnvironment().withProperty("GOOGLE_CLOUD_PROJECT", "vertex-proj");
        CapturingLlmClient client = new CapturingLlmClient();
        SettingsService svcWithVertex = new SettingsService(settingsRepository, env);
        AgentNodeExecutor exec =
                new AgentNodeExecutor(
                        client, env, svcWithVertex, new com.fasterxml.jackson.databind.ObjectMapper(), new AdkAgentRunner(env));

        Map<String, Object> gemini = new HashMap<>();
        gemini.put("type", "gemini");
        gemini.put("enabled", true);
        gemini.put("models", List.of("gemini-pro"));
        when(settingsRepository.findById("u1"))
                .thenReturn(Optional.of(settingsRow("u1", Map.of("providers", List.of(gemini)))));

        Node node = agentNode("gemini-pro", "sys", "n1");
        Map<String, Object> ctxLlm = new HashMap<>();
        ctxLlm.put("type", "openai");
        ctxLlm.put("api_key", "sk-openai-ctx-placeholder-0001");
        ctxLlm.put("base_url", "https://api.openai.com/v1");
        ctxLlm.put("model", "gpt-4o-mini");

        NodeExecutionContext ctx = new NodeExecutionContext(ctxLlm, "u1", List.of(), Map.of());

        Object out = exec.execute(node, Map.of("message", "hello vertex"), new ExecutionState(), ctx);

        assertEquals("openai-out", out);
        assertTrue(client.completionsUrl.contains("vertex-proj"));
        assertTrue(client.completionsUrl.contains("endpoints/openapi"));
        assertTrue(client.completionsUrl.contains("chat/completions"));
        assertEquals("google/gemini-pro", client.completionsModel);
        assertNull(client.completionsKey);
        assertNull(client.geminiBase);
    }

    @Test
    void execute_geminiVertexAdc_flashLite_usesGenerateContent() {
        MockEnvironment env = new MockEnvironment().withProperty("GOOGLE_CLOUD_PROJECT", "vertex-proj");
        CapturingLlmClient client = new CapturingLlmClient();
        SettingsService svcWithVertex = new SettingsService(settingsRepository, env);
        AgentNodeExecutor exec =
                new AgentNodeExecutor(
                        client, env, svcWithVertex, new com.fasterxml.jackson.databind.ObjectMapper(), new AdkAgentRunner(env));

        Map<String, Object> gemini = new HashMap<>();
        gemini.put("type", "gemini");
        gemini.put("enabled", true);
        gemini.put("models", List.of("gemini-2.5-flash-lite"));
        when(settingsRepository.findById("u1"))
                .thenReturn(Optional.of(settingsRow("u1", Map.of("providers", List.of(gemini)))));

        Node node = agentNode("gemini-2.5-flash-lite", "echo", "n1");
        Map<String, Object> ctxLlm = new HashMap<>();
        ctxLlm.put("type", "openai");
        ctxLlm.put("api_key", "sk-openai-ctx-placeholder-0001");
        ctxLlm.put("base_url", "https://api.openai.com/v1");
        ctxLlm.put("model", "gpt-4o-mini");

        NodeExecutionContext ctx = new NodeExecutionContext(ctxLlm, "u1", List.of(), Map.of());

        Object out = exec.execute(node, Map.of("message", "hello lite"), new ExecutionState(), ctx);

        assertEquals("gemini-out", out);
        assertNull(client.completionsUrl);
        assertEquals("gemini-2.5-flash-lite", client.geminiModel);
        assertEquals("echo", client.geminiSystem);
        assertEquals("hello lite", client.geminiUser);
    }

    private static Settings settingsRow(String userId, Map<String, Object> data) {
        Settings s = new Settings();
        s.setUserId(userId);
        s.setSettingsData(new HashMap<>(data));
        return s;
    }

    private static Node agentNode(String model, String system, String id) {
        Node n = new Node();
        n.setId(id);
        n.setType(NodeType.AGENT);
        AgentConfig cfg = new AgentConfig();
        cfg.setModel(model);
        cfg.setSystemPrompt(system);
        cfg.setMaxTokens(512);
        cfg.setTemperature(0.5);
        n.setAgentConfig(cfg);
        return n;
    }

    private static Node adkAgentNode(String id) {
        Node n = agentNode("gemini-2.0-flash", "fallback system", id);
        n.getAgentConfig().setAgentType("adk");
        ADKAgentConfig adk = new ADKAgentConfig();
        adk.setName("adk-test");
        adk.setInstruction("do the thing");
        n.getAgentConfig().setAdkConfig(adk);
        return n;
    }

    /** Python parity: agent_type may stay {@code workflow} when adk_config.name is set. */
    private static Node adkWorkflowInferenceNode(String id) {
        Node n = agentNode("gemini-2.0-flash", "fallback system", id);
        n.getAgentConfig().setAgentType("workflow");
        ADKAgentConfig adk = new ADKAgentConfig();
        adk.setName("inferred-adk");
        adk.setInstruction("run bundle");
        n.getAgentConfig().setAdkConfig(adk);
        return n;
    }

    private static final class CapturingLlmClient implements LlmApiClient {
        String anthropicBase;
        String anthropicKey;
        String anthropicModel;
        String anthropicSystem;
        String anthropicUser;
        String geminiBase;
        String geminiKey;
        String geminiModel;
        String geminiSystem;
        String geminiUser;
        String completionsUrl;
        String completionsKey;
        String completionsModel;

        @Override
        public String chatCompletions(
                String url, String apiKey, String model, List<Map<String, Object>> messages) {
            this.completionsUrl = url;
            this.completionsKey = apiKey;
            this.completionsModel = model;
            return "openai-out";
        }

        @Override
        public String chatAnthropic(
                String baseUrl,
                String apiKey,
                String model,
                String systemPrompt,
                String userText,
                int maxTokens,
                double temperature) {
            this.anthropicBase = baseUrl;
            this.anthropicKey = apiKey;
            this.anthropicModel = model;
            this.anthropicSystem = systemPrompt;
            this.anthropicUser = userText;
            return "anthropic-out";
        }

        @Override
        public String chatGemini(
                String baseUrl,
                String apiKey,
                String model,
                String systemPrompt,
                String userText,
                int maxOutputTokens,
                double temperature) {
            this.geminiBase = baseUrl;
            this.geminiKey = apiKey;
            this.geminiModel = model;
            this.geminiSystem = systemPrompt;
            this.geminiUser = userText;
            return "gemini-out";
        }
    }
}
