package com.workflow.engine;

import com.google.genai.Client;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * google-genai rejects API key + implicit project/location from the environment unless Vertex mode is
 * explicitly disabled ({@code vertexAI(false)}).
 */
class GenaiGeminiDeveloperClientTest {

    @Test
    void apiKeyClient_withVertexAiFalse_isNotVertexMode() {
        Client c =
                Client.builder()
                        .apiKey("fake-api-key-for-build-only-0123456789")
                        .vertexAI(false)
                        .build();
        assertFalse(c.vertexAI());
    }
}
