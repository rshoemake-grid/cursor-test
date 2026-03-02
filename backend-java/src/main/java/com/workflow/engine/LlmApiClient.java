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
     * POST to base_url/chat/completions with model, messages, api_key in Authorization.
     *
     * @param baseUrl base URL (e.g. https://api.openai.com/v1)
     * @param apiKey API key for Authorization: Bearer header
     * @param model  model name
     * @param messages list of message maps with "role" and "content"
     * @return the assistant message content
     */
    String chatCompletions(String baseUrl, String apiKey, String model,
                           List<Map<String, Object>> messages);
}
