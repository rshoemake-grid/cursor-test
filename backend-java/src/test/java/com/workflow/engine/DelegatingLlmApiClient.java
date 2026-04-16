package com.workflow.engine;

import java.util.List;
import java.util.Map;

/**
 * Test double that implements {@link LlmApiClient} explicitly so Mockito does not invoke the interface
 * default {@code chatCompletionsWithTools} (which throws {@link UnsupportedOperationException}).
 */
public final class DelegatingLlmApiClient implements LlmApiClient {

    @FunctionalInterface
    public interface ChatWithTools {
        ChatCompletionRound call(
                String url,
                String apiKey,
                String model,
                List<Map<String, Object>> messages,
                List<Map<String, Object>> tools);
    }

    private final ChatWithTools withTools;
    private final ChatWithoutTools withoutTools;

    @FunctionalInterface
    public interface ChatWithoutTools {
        String call(String url, String apiKey, String model, List<Map<String, Object>> messages);
    }

    public DelegatingLlmApiClient(ChatWithTools withTools, ChatWithoutTools withoutTools) {
        this.withTools = withTools;
        this.withoutTools = withoutTools;
    }

    @Override
    public String chatCompletions(String url, String apiKey, String model, List<Map<String, Object>> messages) {
        return withoutTools.call(url, apiKey, model, messages);
    }

    @Override
    public ChatCompletionRound chatCompletionsWithTools(
            String url,
            String apiKey,
            String model,
            List<Map<String, Object>> messages,
            List<Map<String, Object>> tools) {
        return withTools.call(url, apiKey, model, messages, tools);
    }
}
