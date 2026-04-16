package com.workflow.engine;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

class DelegatingLlmApiClientTest {

    @Test
    void delegatesToLambdas() {
        AtomicBoolean tools = new AtomicBoolean();
        AtomicBoolean plain = new AtomicBoolean();
        LlmApiClient client = new DelegatingLlmApiClient(
                (u, k, m, msgs, defs) -> {
                    tools.set(true);
                    return new LlmApiClient.ChatCompletionRound("x", List.of());
                },
                (u, k, m, msgs) -> {
                    plain.set(true);
                    return "y";
                });
        assertEquals(
                "y",
                client.chatCompletions("http://x", "k", "m", List.of()));
        assertTrue(plain.get());
        client.chatCompletionsWithTools("http://x", "k", "m", List.of(), List.of());
        assertTrue(tools.get());
    }
}
