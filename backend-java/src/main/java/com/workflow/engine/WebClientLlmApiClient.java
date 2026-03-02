package com.workflow.engine;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

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
        String url = baseUrl.contains("/chat/completions") ? baseUrl
                : (baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions");

        Map<String, Object> body = Map.of(
                "model", model != null ? model : "gpt-4o-mini",
                "messages", messages != null ? messages : List.of()
        );

        return webClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + (apiKey != null ? apiKey : ""))
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    Object choices = response.get("choices");
                    if (choices instanceof List && !((List<?>) choices).isEmpty()) {
                        Object first = ((List<?>) choices).get(0);
                        if (first instanceof Map) {
                            Object msg = ((Map<?, ?>) first).get("message");
                            if (msg instanceof Map) {
                                Object content = ((Map<?, ?>) msg).get("content");
                                return content != null ? content.toString() : "";
                            }
                        }
                    }
                    return "";
                })
                .block();
    }
}
