package com.workflow.engine;

import com.workflow.dto.AgentConfig;
import com.workflow.dto.Node;
import com.workflow.service.SettingsService;
import com.workflow.util.ErrorMessages;
import com.workflow.util.LlmConfigUtils;
import com.workflow.util.LlmVertexGeminiSupport;
import com.workflow.util.NodeConfigUtils;
import com.workflow.util.ObjectUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.NodeType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Executes AGENT nodes - calls LLM API with system prompt and user content.
 *
 * S-L1: API key resolution order: (1) LLM config from Settings, (2) env vars OPENAI_API_KEY,
 * ANTHROPIC_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY. Env fallback supports local/dev without storing keys in DB.
 * Validate that at least one source provides an API key before making requests.
 */
@Component
public class AgentNodeExecutor implements NodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(AgentNodeExecutor.class);

    private final LlmApiClient llmClient;
    private final Environment environment;
    private final SettingsService settingsService;
    private final ObjectMapper objectMapper;

    public AgentNodeExecutor(LlmApiClient llmClient, Environment environment, SettingsService settingsService,
                             ObjectMapper objectMapper) {
        this.llmClient = llmClient;
        this.environment = environment;
        this.settingsService = settingsService;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<NodeType> getSupportedType() {
        return Optional.of(NodeType.AGENT);
    }

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state, NodeExecutionContext ctx) {
        Map<String, Object> llmConfig = ObjectUtils.orEmptyMap(ObjectUtils.safeGet(ctx, NodeExecutionContext::llmConfig));
        if (llmConfig.isEmpty()) {
            throw new IllegalStateException(ErrorMessages.LLM_CONFIG_REQUIRED_AGENT);
        }

        AgentConfig cfg = NodeConfigUtils.resolveAgentConfig(node, objectMapper);
        if (cfg == null) {
            throw new IllegalStateException(
                    "Node " + node.getId() + " requires agent_config. Please configure the agent settings in the node properties.");
        }
        String agentModel = ObjectUtils.safeGet(cfg, AgentConfig::getModel);
        String lookupModel = ObjectUtils.orDefault(agentModel, LlmConfigUtils.getModel(llmConfig));

        Map<String, Object> effectiveConfig = new HashMap<>(llmConfig);
        if (settingsService != null && ctx.userId() != null) {
            settingsService.getProviderConfigForModel(ctx.userId(), lookupModel).ifPresent(effectiveConfig::putAll);
        }

        String model = ObjectUtils.orDefault(agentModel, LlmConfigUtils.getModel(effectiveConfig));
        LlmConfigUtils.validateApiKey(effectiveConfig, environment);

        String systemPrompt = ObjectUtils.orDefault(ObjectUtils.safeGet(cfg, AgentConfig::getSystemPrompt), "");
        Object userContent = InputResolver.getFirstOf(inputs, "message", "data", "output");
        if (userContent == null) {
            userContent = inputs.values().stream().findFirst().orElse("");
        }
        String userText = String.valueOf(userContent);

        int maxTokens = Optional.ofNullable(ObjectUtils.safeGet(cfg, AgentConfig::getMaxTokens)).orElse(1024);
        double temperature = Optional.ofNullable(ObjectUtils.safeGet(cfg, AgentConfig::getTemperature)).orElse(0.7);

        String type =
                ObjectUtils.toStringOrDefault(effectiveConfig.get("type"), "openai")
                        .trim()
                        .toLowerCase(Locale.ROOT);

        return switch (type) {
            case "anthropic" -> {
                String aBase = LlmConfigUtils.getBaseUrlOrNull(effectiveConfig);
                if (aBase == null || aBase.isBlank()) {
                    aBase = "https://api.anthropic.com/v1";
                }
                String aKey = LlmConfigUtils.getApiKeyWithEnvFallback(effectiveConfig, environment);
                yield llmClient.chatAnthropic(aBase, aKey, model, systemPrompt, userText, maxTokens, temperature);
            }
            case "gemini" -> {
                if (LlmVertexGeminiSupport.geminiUsesVertexAdc(effectiveConfig, environment)) {
                    if (LlmVertexGeminiSupport.geminiModelRequiresVertexGenerateContent(model)) {
                        log.info(
                                "Agent node {}: Vertex Gemini using :generateContent for model {} (chat/completions unreliable for this model line)",
                                node.getId(),
                                model);
                        yield llmClient.chatGemini(
                                null, "", model, systemPrompt, userText, maxTokens, temperature);
                    }
                    log.info(
                            "Agent node {}: Vertex Gemini using OpenAI-compatible chat/completions for model {}",
                            node.getId(),
                            model);
                    Map<String, Object> vertexGeminiCfg = new HashMap<>(effectiveConfig);
                    vertexGeminiCfg.put("model", model);
                    LlmConfigUtils.LlmRequestContext requestCtx =
                            LlmConfigUtils.prepareRequest(vertexGeminiCfg, environment);
                    List<Map<String, Object>> messages = new ArrayList<>();
                    messages.add(LlmConfigUtils.buildMessage("system", systemPrompt));
                    messages.add(LlmConfigUtils.buildMessage("user", userText));
                    yield llmClient.chatCompletions(
                            requestCtx.url(), requestCtx.apiKey(), requestCtx.model(), messages);
                }
                String gBase = LlmConfigUtils.getBaseUrlOrNull(effectiveConfig);
                if (gBase == null || gBase.isBlank()) {
                    gBase = "https://generativelanguage.googleapis.com/v1beta";
                }
                String gKey = LlmConfigUtils.getApiKeyWithEnvFallback(effectiveConfig, environment);
                yield llmClient.chatGemini(gBase, gKey, model, systemPrompt, userText, maxTokens, temperature);
            }
            default -> {
                Map<String, Object> openaiCfg = new HashMap<>(effectiveConfig);
                openaiCfg.put("model", model);
                LlmConfigUtils.LlmRequestContext requestCtx = LlmConfigUtils.prepareRequest(openaiCfg, environment);
                List<Map<String, Object>> messages = new ArrayList<>();
                messages.add(LlmConfigUtils.buildMessage("system", systemPrompt));
                messages.add(LlmConfigUtils.buildMessage("user", userText));
                yield llmClient.chatCompletions(requestCtx.url(), requestCtx.apiKey(), requestCtx.model(), messages);
            }
        };
    }
}
