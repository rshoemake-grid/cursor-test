package com.workflow.engine;

import com.workflow.dto.AgentConfig;
import com.workflow.dto.Node;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Executes AGENT nodes - calls LLM API with system prompt and user content.
 */
public class AgentNodeExecutor implements NodeExecutor {

    private final LlmApiClient llmClient;

    public AgentNodeExecutor(LlmApiClient llmClient) {
        this.llmClient = llmClient;
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

        String systemPrompt = cfg != null && cfg.getSystemPrompt() != null ? cfg.getSystemPrompt() : "";

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        Object userContent = inputs.get("message");
        if (userContent == null) userContent = inputs.get("data");
        if (userContent == null) userContent = inputs.get("output");
        if (userContent == null) userContent = inputs.values().stream().findFirst().orElse("");
        messages.add(Map.of("role", "user", "content", String.valueOf(userContent)));

        String url = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
        return llmClient.chatCompletions(url, apiKey, model, messages);
    }
}
