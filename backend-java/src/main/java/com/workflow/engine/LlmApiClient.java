package com.workflow.engine;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Client for calling OpenAI-compatible chat completions API.
 * Allows testing with mocks without HTTP.
 */
public interface LlmApiClient {

    record ToolCallSpec(String id, String name, String argumentsJson) {
    }

    record ChatCompletionRound(String content, List<ToolCallSpec> toolCalls) {
        public ChatCompletionRound {
            toolCalls = toolCalls == null ? List.of() : List.copyOf(toolCalls);
        }

        public Map<String, Object> toAssistantMessageMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("role", "assistant");
            m.put("content", content != null && !content.isBlank() ? content : null);
            if (!toolCalls.isEmpty()) {
                List<Map<String, Object>> tc = new ArrayList<>();
                for (ToolCallSpec t : toolCalls) {
                    Map<String, Object> fn = new LinkedHashMap<>();
                    fn.put("name", t.name());
                    fn.put("arguments", t.argumentsJson() != null ? t.argumentsJson() : "{}");
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", t.id());
                    item.put("type", "function");
                    item.put("function", fn);
                    tc.add(item);
                }
                m.put("tool_calls", tc);
            }
            return m;
        }
    }

    /**
     * POST to chat completions endpoint with model, messages, api_key in Authorization.
     */
    String chatCompletions(String url, String apiKey, String model,
                           List<Map<String, Object>> messages);

    /**
     * One chat completion round with tools (OpenAI-compatible). Default throws — override in HTTP client.
     */
    default ChatCompletionRound chatCompletionsWithTools(
            String url,
            String apiKey,
            String model,
            List<Map<String, Object>> messages,
            List<Map<String, Object>> tools) {
        throw new UnsupportedOperationException("Tool calling is not supported by this LLM client");
    }

    /**
     * Anthropic Messages API (non-streaming). Default throws — implemented by {@link WebClientLlmApiClient}.
     */
    default String chatAnthropic(
            String baseUrl,
            String apiKey,
            String model,
            String systemPrompt,
            String userText,
            int maxTokens,
            double temperature) {
        throw new UnsupportedOperationException("Anthropic is not supported by this LLM client");
    }

    /**
     * Google Gemini {@code :generateContent}. Default throws — implemented by {@link WebClientLlmApiClient}.
     */
    default String chatGemini(
            String baseUrl,
            String apiKey,
            String model,
            String systemPrompt,
            String userText,
            int maxOutputTokens,
            double temperature) {
        throw new UnsupportedOperationException("Gemini is not supported by this LLM client");
    }
}
