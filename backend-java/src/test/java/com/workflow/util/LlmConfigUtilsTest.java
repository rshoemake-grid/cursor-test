package com.workflow.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LlmConfigUtilsTest {

    @Test
    void buildMessage_returnsMutableMap_forWorkflowChatContextRefresh() {
        Map<String, Object> m = LlmConfigUtils.buildMessage("system", "Current workflow context:\nx");
        assertDoesNotThrow(() -> m.put("content", "updated"));
        assertEquals("updated", m.get("content"));
    }

    @Test
    void getApiKeyWithEnvFallback_anthropicType_usesAnthropicEnv() {
        MockEnvironment env = new MockEnvironment().withProperty("ANTHROPIC_API_KEY", "ant-secret");
        assertEquals(
                "ant-secret",
                LlmConfigUtils.getApiKeyWithEnvFallback(Map.of("type", "anthropic"), env));
    }

    @Test
    void getApiKeyWithEnvFallback_geminiType_prefersGeminiThenGoogle() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("GOOGLE_API_KEY", "google")
                .withProperty("GEMINI_API_KEY", "gem");
        assertEquals(
                "gem",
                LlmConfigUtils.getApiKeyWithEnvFallback(Map.of("type", "gemini"), env));
    }

    @Test
    void getApiKeyWithEnvFallback_openaiType_doesNotUseAnthropicKey() {
        MockEnvironment env = new MockEnvironment().withProperty("ANTHROPIC_API_KEY", "only-ant");
        assertNull(LlmConfigUtils.getApiKeyWithEnvFallback(Map.of("type", "openai"), env));
    }

    @Test
    void prepareRequest_gemini_legacyV1BetaBase_mapsToOpenAiCompatibleChatBase() {
        MockEnvironment env = new MockEnvironment();
        Map<String, Object> cfg = Map.of(
                "type", "gemini",
                "apiKey", "k",
                "baseUrl", "https://generativelanguage.googleapis.com/v1beta");
        LlmConfigUtils.LlmRequestContext ctx = LlmConfigUtils.prepareRequest(cfg, env);
        assertTrue(ctx.url().contains("/v1beta/openai/chat/completions"));
    }

    @Test
    void prepareRequest_gemini_openAiCompatBase_unchanged() {
        MockEnvironment env = new MockEnvironment();
        Map<String, Object> cfg = Map.of(
                "type", "gemini",
                "apiKey", "k",
                "baseUrl", "https://generativelanguage.googleapis.com/v1beta/openai");
        LlmConfigUtils.LlmRequestContext ctx = LlmConfigUtils.prepareRequest(cfg, env);
        assertEquals(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", ctx.url());
    }

    @Test
    void prepareRequest_gemini_noApiKey_usesVertexOpenAiBaseWhenProjectSet() {
        MockEnvironment env = new MockEnvironment().withProperty("GOOGLE_CLOUD_PROJECT", "p-test");
        Map<String, Object> cfg =
                Map.of("type", "gemini", "model", "gemini-2.5-flash", "baseUrl", "https://generativelanguage.googleapis.com/v1beta");
        LlmConfigUtils.LlmRequestContext ctx = LlmConfigUtils.prepareRequest(cfg, env);
        assertTrue(ctx.url().contains("aiplatform.googleapis.com"));
        assertTrue(ctx.url().endsWith("/endpoints/openapi/chat/completions"));
        assertNull(ctx.apiKey());
        assertEquals("google/gemini-2.5-flash", ctx.model());
    }
}
