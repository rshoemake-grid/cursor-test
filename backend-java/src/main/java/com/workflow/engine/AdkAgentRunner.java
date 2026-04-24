package com.workflow.engine;

import com.google.adk.agents.LlmAgent;
import com.google.adk.events.Event;
import com.google.adk.models.BaseLlm;
import com.google.adk.models.Gemini;
import com.google.adk.models.VertexCredentials;
import com.google.adk.runner.InMemoryRunner;
import com.google.adk.tools.GoogleSearchTool;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.Part;
import com.workflow.dto.ADKAgentConfig;
import com.workflow.dto.AgentConfig;
import com.workflow.dto.Node;
import com.workflow.util.LlmConfigUtils;
import com.workflow.util.LlmVertexGeminiSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Runs Google ADK {@link LlmAgent} via {@link InMemoryRunner#runAsync} — parity with Python
 * {@code ADKAgent.execute} using {@code InMemoryRunner.run_debug}.
 *
 * <p>Gemini auth: prefers Vertex + Application Default Credentials when {@code GOOGLE_APPLICATION_CREDENTIALS}
 * points at a JSON file and a project id is available (env or {@code project_id} in the file); otherwise uses a Gemini
 * API key from LLM config or {@code GEMINI_API_KEY} / {@code GOOGLE_API_KEY}.
 */
@Component
public class AdkAgentRunner implements AdkRunner {

    private static final Logger log = LoggerFactory.getLogger(AdkAgentRunner.class);
    private static final Pattern NON_APP_NAME = Pattern.compile("[^a-zA-Z0-9_-]+");
    private static final String CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    private final Environment environment;

    public AdkAgentRunner(Environment environment) {
        this.environment = environment;
    }

    static String sanitizeAppName(String name) {
        String raw = (name == null || name.isBlank()) ? "workflow_adk" : name.trim();
        String s = NON_APP_NAME.matcher(raw).replaceAll("_");
        if (s.isBlank()) {
            s = "workflow_adk";
        }
        s = s.replaceAll("^_+|_+$", "");
        if (s.isBlank()) {
            s = "workflow_adk";
        }
        return s.length() > 60 ? s.substring(0, 60) : s;
    }

    @Override
    public String run(
            Node node,
            AgentConfig cfg,
            String userText,
            NodeExecutionContext ctx,
            Map<String, Object> effectiveLlmConfig) {
        ADKAgentConfig adk = cfg.getAdkConfig();
        if (adk == null) {
            throw new IllegalStateException(
                    "Node " + node.getId() + " is configured for ADK execution but adk_config is missing.");
        }
        String agentName =
                Optional.ofNullable(adk.getName())
                        .filter(s -> !s.isBlank())
                        .orElse(Optional.ofNullable(node.getName()).filter(s -> !s.isBlank()).orElse("agent_" + node.getId()));
        String description =
                Optional.ofNullable(adk.getDescription())
                        .filter(s -> !s.isBlank())
                        .orElse(Optional.ofNullable(node.getDescription()).orElse(""));
        String instruction =
                Optional.ofNullable(adk.getInstruction())
                        .filter(s -> !s.isBlank())
                        .orElse(
                                Optional.ofNullable(cfg.getSystemPrompt())
                                        .filter(s -> !s.isBlank())
                                        .orElse("You are a helpful assistant."));
        String model =
                Optional.ofNullable(cfg.getModel()).filter(s -> !s.isBlank()).orElse("gemini-2.0-flash");
        String modelForLlm = LlmVertexGeminiSupport.vertexGenerateContentModelId(model);

        BaseLlm geminiLlm = buildGeminiModel(modelForLlm, effectiveLlmConfig);
        LlmAgent.Builder builder =
                LlmAgent.builder()
                        .name(agentName)
                        .description(description)
                        .instruction(instruction)
                        .model(geminiLlm);

        List<Object> tools = resolveAdkTools(adk.getAdkTools());
        if (!tools.isEmpty()) {
            builder.tools(tools);
        }

        LlmAgent llmAgent = builder.build();
        String appName = sanitizeAppName(agentName);
        InMemoryRunner runner = new InMemoryRunner(llmAgent, appName);
        String userId =
                Optional.ofNullable(ctx.userId()).filter(s -> !s.isBlank()).orElse("workflow_user");
        String sessionId =
                "wf_"
                        + node.getId()
                        + "_"
                        + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        Content message = Content.builder().role("user").parts(Part.fromText(userText)).build();

        try {
            List<Event> events = runner.runAsync(userId, sessionId, message).toList().blockingGet();
            String text = AdkEventTextExtractor.extractAssistantText(events);
            if (text.isEmpty()) {
                log.warn(
                        "ADK run returned no model text for node {}; check API keys, model id, and logs",
                        node.getId());
            }
            return text;
        } finally {
            runner.close().blockingAwait();
        }
    }

    /**
     * Matches {@link LlmConfigUtils#prepareRequest(Map, Environment)} / workflow chat: Vertex when
     * {@link LlmVertexGeminiSupport#geminiUsesVertexAdc}, else Gemini API key from config + env, else Vertex when
     * ADC service-account JSON yields a project (same edge case as {@link LlmConfigUtils#validateApiKey}).
     */
    private BaseLlm buildGeminiModel(String modelName, Map<String, Object> effectiveLlmConfig) {
        if (LlmVertexGeminiSupport.geminiUsesVertexAdc(effectiveLlmConfig, environment)) {
            log.info("ADK Gemini: using Vertex AI (same criteria as workflow chat).");
            return buildVertexGemini(modelName);
        }

        String apiKey =
                LlmVertexGeminiSupport.isGeminiType(effectiveLlmConfig)
                        ? LlmConfigUtils.getApiKeyWithEnvFallback(effectiveLlmConfig, environment)
                        : LlmConfigUtils.geminiApiKeyOnly(effectiveLlmConfig, environment);
        if (apiKey != null && !apiKey.isBlank()) {
            log.info("ADK Gemini: using Gemini API key (AI Studio).");
            // google-genai merges GOOGLE_CLOUD_PROJECT / location from the environment even when only an
            // API key is supplied, then fails with "Gemini API do not support project/location." Build an
            // explicit Client with vertexAI=false (Developer API), matching mutual exclusivity in Client.
            Client genaiClient =
                    Client.builder()
                            .apiKey(apiKey.trim())
                            .vertexAI(false)
                            .httpOptions(HttpOptions.builder().build())
                            .build();
            return Gemini.builder().modelName(modelName).apiClient(genaiClient).build();
        }

        if (LlmVertexGeminiSupport.geminiAuthViaAdcServiceAccountJson(environment)) {
            log.info("ADK Gemini: using Vertex AI via GOOGLE_APPLICATION_CREDENTIALS + project id.");
            return buildVertexGemini(modelName);
        }

        throw new IllegalStateException(
                "No Gemini credentials for ADK: set GEMINI_API_KEY or GOOGLE_API_KEY, or configure "
                        + "GOOGLE_APPLICATION_CREDENTIALS with a service-account JSON and GOOGLE_CLOUD_PROJECT "
                        + "(or project_id in the JSON).");
    }

    private Gemini buildVertexGemini(String modelName) {
        try {
            GoogleCredentials credentials =
                    GoogleCredentials.getApplicationDefault()
                            .createScoped(Collections.singletonList(CLOUD_PLATFORM_SCOPE));
            String project =
                    Optional.ofNullable(LlmVertexGeminiSupport.resolveProjectIdForVertex(environment))
                            .orElseThrow(
                                    () ->
                                            new IllegalStateException(
                                                    "Vertex project id missing: set GOOGLE_CLOUD_PROJECT or project_id in ADC JSON."));
            String location = LlmVertexGeminiSupport.resolveLocationForModel(environment, modelName);
            VertexCredentials vc =
                    VertexCredentials.builder()
                            .setProject(project)
                            .setLocation(location)
                            .setCredentials(credentials)
                            .build();
            return Gemini.builder().modelName(modelName).vertexCredentials(vc).build();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load Application Default Credentials for Vertex (ADK).", e);
        }
    }

    private static List<Object> resolveAdkTools(List<String> toolNames) {
        if (toolNames == null || toolNames.isEmpty()) {
            return List.of();
        }
        List<Object> out = new ArrayList<>();
        for (String raw : toolNames) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String n = raw.trim();
            switch (n) {
                case "google_search" -> out.add(GoogleSearchTool.INSTANCE);
                case "load_web_page" ->
                        log.warn(
                                "ADK tool 'load_web_page' is not bundled in Java google-adk 0.7.x; skipping for node tools");
                case "enterprise_web_search" ->
                        log.warn(
                                "ADK tool 'enterprise_web_search' is not mapped in Java runner; skipping");
                default -> log.warn("Unknown ADK tool '{}'; skipping", n);
            }
        }
        return out;
    }
}
