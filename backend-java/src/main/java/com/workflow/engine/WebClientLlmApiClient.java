package com.workflow.engine;

import com.workflow.util.LlmConfigUtils;
import com.workflow.util.ObjectUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * LlmApiClient implementation using Spring WebClient for OpenAI-compatible chat completions.
 */
@Component
public class WebClientLlmApiClient implements LlmApiClient {

    private final WebClient webClient;

    public WebClientLlmApiClient(WebClient webClient) {
        this.webClient = webClient;
    }

    @Override
    public String chatCompletions(String baseUrl, String apiKey, String model,
                                   List<Map<String, Object>> messages) {
        String url = LlmConfigUtils.buildChatCompletionsUrl(baseUrl);

        Map<String, Object> body = Map.of(
                "model", ObjectUtils.orDefault(model, LlmConfigUtils.DEFAULT_MODEL),
                "messages", ObjectUtils.orEmptyList(messages)
        );

        Map<?, ?> response = webClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + ObjectUtils.orDefault(apiKey, ""))
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        Object choices = response != null ? response.get("choices") : null;
        if (choices instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Map<?, ?> choice) {
                Object msg = choice.get("message");
                if (msg instanceof Map<?, ?> message) {
                    Object content = message.get("content");
                    return ObjectUtils.toStringOrDefault(content, "");
                }
            }
        }
        throw new IllegalArgumentException("LLM response missing expected structure (choices[0].message.content)");
    }
}
