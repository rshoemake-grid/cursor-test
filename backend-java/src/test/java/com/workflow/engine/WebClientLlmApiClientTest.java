package com.workflow.engine;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WebClientLlmApiClientTest {

    private MockWebServer server;
    private WebClient webClient;

    @BeforeEach
    void setUp() throws Exception {
        server = new MockWebServer();
        server.start();
        webClient = WebClient.builder().build();
    }

    @AfterEach
    void tearDown() throws Exception {
        server.shutdown();
    }

    @Test
    void chatAnthropic_postsMessagesAndParsesText() throws Exception {
        server.enqueue(
                new MockResponse()
                        .setBody("{\"content\":[{\"type\":\"text\",\"text\":\"from-claude\"}]}")
                        .addHeader("Content-Type", "application/json"));

        String base = server.url("/v1").toString();
        WebClientLlmApiClient client = new WebClientLlmApiClient(webClient, null);
        String out = client.chatAnthropic(base, "secret", "claude-3", "sys", "user-msg", 256, 0.2);

        assertEquals("from-claude", out);
        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertTrue(req.getPath().endsWith("/messages"));
        assertEquals("secret", req.getHeader("x-api-key"));
        assertEquals("2023-06-01", req.getHeader("anthropic-version"));
    }

    @Test
    void chatGemini_postsGenerateContentAndParsesText() throws Exception {
        server.enqueue(
                new MockResponse()
                        .setBody("{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"from-gemini\"}]}}]}")
                        .addHeader("Content-Type", "application/json"));

        String base = server.url("/v1beta").toString();
        WebClientLlmApiClient client = new WebClientLlmApiClient(webClient, null);
        String out = client.chatGemini(base, "gkey", "gemini-pro", "sys", "hello", 512, 0.5);

        assertEquals("from-gemini", out);
        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertTrue(req.getPath().contains("/models/gemini-pro:generateContent"));
        assertTrue(req.getRequestUrl().queryParameter("key").equals("gkey"));
    }

    @Test
    void chatGemini_stripsOpenAiCompatSuffixFromBaseBeforeGenerateContent() throws Exception {
        server.enqueue(
                new MockResponse()
                        .setBody("{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"ok\"}]}}]}")
                        .addHeader("Content-Type", "application/json"));

        String base = server.url("/v1beta/openai").toString();
        WebClientLlmApiClient client = new WebClientLlmApiClient(webClient, null);
        String out = client.chatGemini(base, "gkey", "gemini-pro", "", "hi", 128, 0.3);

        assertEquals("ok", out);
        RecordedRequest req = server.takeRequest();
        assertTrue(req.getPath().startsWith("/v1beta/models/gemini-pro:generateContent"));
        assertTrue(req.getPath().contains(":generateContent"));
    }
}
