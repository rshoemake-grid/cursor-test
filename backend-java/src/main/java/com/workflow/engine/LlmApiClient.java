package com.workflow.engine;

import java.util.List;
import java.util.Map;

/**
 * Client for calling OpenAI-compatible chat completions API.
 * Allows testing with mocks without HTTP.
 */
@FunctionalInterface
public interface LlmApiClient {

    /**
     * POST to chat completions endpoint with model, messages, api_key in Authorization.
     *
     * @param url     full chat completions URL (e.g. https://api.openai.com/v1/chat/completions) or base URL
     * @param apiKey  API key for Authorization: Bearer header
     * @param model   model name
     * @param messages list of message maps with "role" and "content"
     * @return the assistant message content
     */
    String chatCompletions(String url, String apiKey, String model,
                           List<Map<String, Object>> messages);
}
