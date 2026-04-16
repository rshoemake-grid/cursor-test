package com.workflow.engine;

import com.workflow.util.ErrorMessages;
import com.workflow.util.LlmConfigUtils;
import com.workflow.util.ObjectUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
        ChatCompletionRound round = postChat(baseUrl, apiKey, model, messages, null);
        if (!round.toolCalls().isEmpty()) {
            throw new IllegalArgumentException("LLM returned tool calls but tool mode was not requested");
        }
        return ObjectUtils.toStringOrDefault(round.content(), "");
    }

    @Override
    public ChatCompletionRound chatCompletionsWithTools(
            String baseUrl,
            String apiKey,
            String model,
            List<Map<String, Object>> messages,
            List<Map<String, Object>> tools) {
        return postChat(baseUrl, apiKey, model, messages, tools);
    }

    @Override
    public String chatAnthropic(
            String baseUrl,
            String apiKey,
            String model,
            String systemPrompt,
            String userText,
            int maxTokens,
            double temperature) {
        String url = anthropicMessagesUrl(baseUrl);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", ObjectUtils.orDefault(model, LlmConfigUtils.DEFAULT_MODEL));
        body.put("max_tokens", Math.max(1, maxTokens));
        body.put("temperature", temperature);
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            body.put("system", systemPrompt);
        }
        body.put(
                "messages",
                List.of(
                        Map.of(
                                "role",
                                "user",
                                "content",
                                ObjectUtils.orDefault(userText, ""))));

        Map<?, ?> response = webClient
                .post()
                .uri(url)
                .header("x-api-key", ObjectUtils.orDefault(apiKey, ""))
                .header("anthropic-version", "2023-06-01")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return ObjectUtils.toStringOrDefault(parseAnthropicText(response), "");
    }

    @Override
    public String chatGemini(
            String baseUrl,
            String apiKey,
            String model,
            String systemPrompt,
            String userText,
            int maxOutputTokens,
            double temperature) {
        String url = geminiGenerateContentUrl(baseUrl, model, apiKey);
        Map<String, Object> body = new LinkedHashMap<>();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
        }
        body.put(
                "contents",
                List.of(
                        Map.of(
                                "role",
                                "user",
                                "parts",
                                List.of(Map.of("text", ObjectUtils.orDefault(userText, ""))))));
        Map<String, Object> gen = new LinkedHashMap<>();
        gen.put("temperature", temperature);
        gen.put("maxOutputTokens", Math.max(1, maxOutputTokens));
        body.put("generationConfig", gen);

        Map<?, ?> response = webClient
                .post()
                .uri(url)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return ObjectUtils.toStringOrDefault(parseGeminiText(response), "");
    }

    private ChatCompletionRound postChat(
            String baseUrl,
            String apiKey,
            String model,
            List<Map<String, Object>> messages,
            List<Map<String, Object>> tools) {
        String url = LlmConfigUtils.buildChatCompletionsUrl(baseUrl);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", ObjectUtils.orDefault(model, LlmConfigUtils.DEFAULT_MODEL));
        body.put("messages", ObjectUtils.orEmptyList(messages));
        body.put("temperature", 0.7);
        if (tools != null && !tools.isEmpty()) {
            body.put("tools", tools);
            body.put("tool_choice", "auto");
        }

        Map<?, ?> response = webClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + ObjectUtils.orDefault(apiKey, ""))
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return parseChatResponse(response);
    }

    private static String anthropicMessagesUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "https://api.anthropic.com/v1/messages";
        }
        String b = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        if (b.endsWith("/messages")) {
            return b;
        }
        return b + "/messages";
    }

    private static String geminiGenerateContentUrl(String baseUrl, String model, String apiKey) {
        String b = baseUrl == null ? "" : baseUrl.trim();
        while (b.endsWith("/")) {
            b = b.substring(0, b.length() - 1);
        }
        // Settings may use the OpenAI-compatible base (.../v1beta/openai); :generateContent lives under v1beta only.
        if (b.endsWith("/openai")) {
            b = b.substring(0, b.length() - "/openai".length());
            while (b.endsWith("/")) {
                b = b.substring(0, b.length() - 1);
            }
        }
        if (b.isBlank()) {
            b = "https://generativelanguage.googleapis.com/v1beta";
        }
        String path =
                "/models/"
                        + UriUtils.encodePathSegment(
                                ObjectUtils.orDefault(model, LlmConfigUtils.DEFAULT_MODEL), StandardCharsets.UTF_8)
                        + ":generateContent";
        return UriComponentsBuilder.fromUriString(b + path)
                .queryParam("key", apiKey)
                .build()
                .toUriString();
    }

    private static String parseAnthropicText(Map<?, ?> response) {
        if (response == null) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object content = response.get("content");
        if (!(content instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object first = list.get(0);
        if (first instanceof Map<?, ?> block) {
            Object text = block.get("text");
            if (text != null) {
                return text.toString();
            }
        }
        throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
    }

    private static String parseGeminiText(Map<?, ?> response) {
        if (response == null) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object c = response.get("candidates");
        if (!(c instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object cand = list.get(0);
        if (!(cand instanceof Map<?, ?> cm)) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object content = cm.get("content");
        if (!(content instanceof Map<?, ?> contentMap)) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object parts = contentMap.get("parts");
        if (!(parts instanceof List<?> plist) || plist.isEmpty()) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object p0 = plist.get(0);
        if (!(p0 instanceof Map<?, ?> pm)) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object text = pm.get("text");
        return text != null ? text.toString() : "";
    }

    private static ChatCompletionRound parseChatResponse(Map<?, ?> response) {
        if (response == null) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object choices = response.get("choices");
        if (!(choices instanceof List<?> list) || list.isEmpty()) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object first = list.get(0);
        if (!(first instanceof Map<?, ?> choice)) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        Object msg = choice.get("message");
        if (!(msg instanceof Map<?, ?> message)) {
            throw new IllegalArgumentException(ErrorMessages.LLM_RESPONSE_INVALID_STRUCTURE);
        }
        String content = normalizeMessageContent(message.get("content"));
        List<ToolCallSpec> toolCalls = parseToolCalls(message);
        return new ChatCompletionRound(content, toolCalls);
    }

    private static String normalizeMessageContent(Object content) {
        if (content == null) {
            return null;
        }
        if (content instanceof String s) {
            return s;
        }
        if (content instanceof List<?> list) {
            StringBuilder sb = new StringBuilder();
            for (Object part : list) {
                if (part instanceof Map<?, ?> pm) {
                    Object t = pm.get("text");
                    if (t != null) {
                        sb.append(t);
                    }
                }
            }
            return sb.toString();
        }
        return String.valueOf(content);
    }

    private static List<ToolCallSpec> parseToolCalls(Map<?, ?> message) {
        Object tc = message.get("tool_calls");
        if (!(tc instanceof List<?> list)) {
            return List.of();
        }
        List<ToolCallSpec> out = new ArrayList<>();
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> m)) {
                continue;
            }
            String id = ObjectUtils.toStringOrDefault(m.get("id"), "");
            Object fnObj = m.get("function");
            if (!(fnObj instanceof Map<?, ?> fn)) {
                continue;
            }
            String name = ObjectUtils.toStringOrDefault(fn.get("name"), "");
            String args = ObjectUtils.toStringOrDefault(fn.get("arguments"), "{}");
            out.add(new ToolCallSpec(id, name, args));
        }
        return out;
    }
}
