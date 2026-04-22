package com.workflow.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LlmVertexGeminiSupportTest {

    @Test
    void geminiModelRequiresVertexGenerateContent_flashLite_true() {
        assertTrue(LlmVertexGeminiSupport.geminiModelRequiresVertexGenerateContent("gemini-2.5-flash-lite"));
        assertTrue(LlmVertexGeminiSupport.geminiModelRequiresVertexGenerateContent("google/gemini-2.5-flash-lite"));
        assertTrue(LlmVertexGeminiSupport.geminiModelRequiresVertexGenerateContent("gemini-3.1-flash-lite-preview"));
    }

    @Test
    void geminiModelRequiresVertexGenerateContent_flashImage_true() {
        assertTrue(LlmVertexGeminiSupport.geminiModelRequiresVertexGenerateContent("gemini-2.5-flash-image"));
    }

    @Test
    void geminiModelRequiresVertexGenerateContent_standardFlash_false() {
        assertFalse(LlmVertexGeminiSupport.geminiModelRequiresVertexGenerateContent("gemini-2.5-flash"));
        assertFalse(LlmVertexGeminiSupport.geminiModelRequiresVertexGenerateContent("google/gemini-2.5-flash"));
    }

    @Test
    void resolveLocationForModel_gemini3FlashLitePreview_usesGlobal() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("GCP_PROJECT", "p1")
                .withProperty("VERTEX_LOCATION", "us-central1");
        assertTrue(LlmVertexGeminiSupport.vertexGenerateContentUrl(env, "gemini-3.1-flash-lite-preview")
                .contains("/locations/global/"));
    }
}
