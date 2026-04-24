package com.workflow.engine;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.genai.Client;
import com.google.genai.types.HttpOptions;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * google-genai requires {@code vertexAI(true)} when the client is configured with
 * project/location/credentials and no API key; otherwise it throws
 * {@code Gemini API do not support project/location.} (see {@code com.google.genai.Client}).
 */
class GenaiGeminiVertexClientBuildTest {

    @Test
    void vertexClient_withExplicitVertexAiTrue_buildsWithProjectLocationAndCredentials() {
        GoogleCredentials creds =
                GoogleCredentials.create(
                        new AccessToken("fake-token-for-client-build-only", new Date(System.currentTimeMillis() + 3600000)));
        Client c =
                Client.builder()
                        .credentials(creds)
                        .project("fake-gcp-project-for-build")
                        .location("us-central1")
                        .vertexAI(true)
                        .httpOptions(HttpOptions.builder().build())
                        .build();
        assertTrue(c.vertexAI());
    }
}
