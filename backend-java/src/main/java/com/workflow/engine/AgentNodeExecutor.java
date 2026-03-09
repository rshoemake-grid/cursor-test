package com.workflow.engine;

import com.workflow.dto.AgentConfig;
import com.workflow.dto.Node;
import com.workflow.util.ObjectUtils;
import com.workflow.dto.NodeType;
import com.workflow.util.LlmConfigUtils;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Executes AGENT nodes - calls LLM API with system prompt and user content.
 *
 * S-L1: API key resolution order: (1) LLM config from Settings, (2) env vars OPENAI_API_KEY,
 * GEMINI_API_KEY, GOOGLE_API_KEY. Env fallback supports local/dev without storing keys in DB.
 * Validate that at least one source provides an API key before making requests.
 */
@Component
public class AgentNodeExecutor implements NodeExecutor {

    private final LlmApiClient llmClient;
    private final Environment environment;

    public AgentNodeExecutor(LlmApiClient llmClient, Environment environment) {
        this.llmClient = llmClient;
        this.environment = environment;
    }

    @Override
    public Optional<NodeType> getSupportedType() {
        return Optional.of(NodeType.AGENT);
    }

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        Map<String, Object> llmConfig = ObjectUtils.orEmptyMap(ObjectUtils.safeGet(ctx, NodeExecutionContext::llmConfig));
        if (llmConfig.isEmpty()) {
            throw new IllegalStateException("LLM config required for agent nodes");
        }
        AgentConfig cfg = node.getAgentConfig();
        String model = ObjectUtils.orDefault(ObjectUtils.safeGet(cfg, AgentConfig::getModel), LlmConfigUtils.getModel(llmConfig));
        LlmConfigUtils.validateApiKey(llmConfig, environment);
        String apiKey = LlmConfigUtils.getApiKeyWithEnvFallback(llmConfig, environment);

        String systemPrompt = ObjectUtils.orDefault(ObjectUtils.safeGet(cfg, AgentConfig::getSystemPrompt), "");
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(LlmConfigUtils.buildMessage("system", systemPrompt));
        Object userContent = InputResolver.getFirstOf(inputs, "message", "data", "output");
        if (userContent == null) userContent = inputs.values().stream().findFirst().orElse("");
        messages.add(LlmConfigUtils.buildMessage("user", String.valueOf(userContent)));

        String url = LlmConfigUtils.buildChatCompletionsUrl(LlmConfigUtils.getBaseUrl(llmConfig));
        return llmClient.chatCompletions(url, apiKey, model, messages);
    }
}
