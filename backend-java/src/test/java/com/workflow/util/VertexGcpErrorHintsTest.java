package com.workflow.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertTrue;

class VertexGcpErrorHintsTest {

    @Test
    void augmentMessage_consumerInvalid_appendsRemediation() {
        MockEnvironment env = new MockEnvironment().withProperty("GOOGLE_CLOUD_PROJECT", "app-proj");
        String raw =
                "Rpc failed: CONSUMER_INVALID 'consumer': 'projects/bad-id-123'";
        String out = VertexGcpErrorHints.augmentMessage(raw, env);
        assertTrue(out.contains("CONSUMER_INVALID"));
        assertTrue(out.contains("app-proj"));
        assertTrue(out.contains("aiplatform.googleapis.com"));
    }

    @Test
    void augmentMessage_vertex403_appendsHint() {
        MockEnvironment env =
                new MockEnvironment()
                        .withProperty("GOOGLE_CLOUD_PROJECT", "p1")
                        .withProperty("VERTEX_LOCATION", "us-central1");
        String raw = "403 PERMISSION_DENIED on aiplatform.googleapis.com";
        String out = VertexGcpErrorHints.augmentMessage(raw, env);
        assertTrue(out.contains("403"));
        assertTrue(out.contains("Vertex AI API"));
    }

    @Test
    void augmentMessage_unrelated_unchanged() {
        String raw = "Some other error";
        assertTrue(VertexGcpErrorHints.augmentMessage(raw, new MockEnvironment()).equals(raw));
    }
}
