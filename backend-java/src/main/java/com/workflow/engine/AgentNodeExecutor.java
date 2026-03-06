package com.workflow.engine;

import com.workflow.dto.AgentConfig;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;

import org.springframework.stereotype.Component;

import java.util.Optional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    public AgentNodeExecutor(LlmApiClient llmClient) {
        this.llmClient = llmClient;
    }

    @Override
    public Optional<NodeType> getSupportedType() {
        return Optional.of(NodeType.AGENT);
    }

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        Map<String, Object> llmConfig = ctx != null ? ctx.llmConfig() : Map.of();
        if (llmConfig == null || llmConfig.isEmpty()) {
            throw new IllegalStateException("LLM config required for agent nodes");
        }
        String baseUrl = (String) llmConfig.get("base_url");
        if (baseUrl == null) baseUrl = (String) llmConfig.get("baseUrl");
        String apiKey = (String) llmConfig.getOrDefault("api_key", llmConfig.get("apiKey"));
        String model = (String) llmConfig.getOrDefault("model", llmConfig.get("defaultModel"));

        AgentConfig cfg = node.getAgentConfig();
        if (cfg != null && cfg.getModel() != null) {
            model = cfg.getModel();
        }
        if (baseUrl == null) baseUrl = "https://api.openai.com/v1";
        if (apiKey == null) apiKey = System.getenv("OPENAI_API_KEY");
        if (apiKey == null) apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null) apiKey = System.getenv("GOOGLE_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "No LLM API key configured. Set api_key in Settings or one of OPENAI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY env vars.");
        }

        String systemPrompt = cfg != null && cfg.getSystemPrompt() != null ? cfg.getSystemPrompt() : "";

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        Object userContent = InputResolver.getFirstOf(inputs, "message", "data", "output");
        if (userContent == null) userContent = inputs.values().stream().findFirst().orElse("");
        messages.add(Map.of("role", "user", "content", String.valueOf(userContent)));

        String url = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
        return llmClient.chatCompletions(url, apiKey, model, messages);
    }
}
