package com.workflow.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    @Test
    void prepareRequest_gemini_3_preview_usesGlobalVertexEndpoint() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("GOOGLE_CLOUD_PROJECT", "p-test")
                .withProperty("VERTEX_LOCATION", "us-central1");
        Map<String, Object> cfg = Map.of(
                "type", "gemini",
                "model", "gemini-3.1-pro-preview",
                "baseUrl", "https://generativelanguage.googleapis.com/v1beta");
        LlmConfigUtils.LlmRequestContext ctx = LlmConfigUtils.prepareRequest(cfg, env);
        assertTrue(ctx.url().startsWith("https://aiplatform.googleapis.com/v1/projects/p-test/locations/global/"));
        assertTrue(ctx.url().endsWith("/endpoints/openapi/chat/completions"));
        assertEquals("google/gemini-3.1-pro-preview", ctx.model());
    }

    @Test
    void validateAdkGeminiAuth_geminiApiKeyInEnv_ok() {
        MockEnvironment env = new MockEnvironment().withProperty("GEMINI_API_KEY", "gk-test");
        assertDoesNotThrow(() -> LlmConfigUtils.validateAdkGeminiAuth(Map.of("type", "openai"), env));
    }

    @Test
    void validateAdkGeminiAuth_adcJsonPathAndProject_ok() throws Exception {
        Path json = Files.createTempFile("sa", ".json");
        Files.writeString(json, "{\"type\":\"service_account\",\"project_id\":\"from-json\"}");
        MockEnvironment env =
                new MockEnvironment()
                        .withProperty("GOOGLE_APPLICATION_CREDENTIALS", json.toString())
                        .withProperty("GOOGLE_CLOUD_PROJECT", "env-proj");
        assertDoesNotThrow(() -> LlmConfigUtils.validateAdkGeminiAuth(Map.of(), env));
    }

    @Test
    void validateApiKey_geminiType_adcJsonPathAndProject_ok_sameAsWorkflowChat() throws Exception {
        Path json = Files.createTempFile("sa-chat", ".json");
        Files.writeString(json, "{\"type\":\"service_account\",\"project_id\":\"from-json\"}");
        MockEnvironment env =
                new MockEnvironment()
                        .withProperty("GOOGLE_APPLICATION_CREDENTIALS", json.toString())
                        .withProperty("GOOGLE_CLOUD_PROJECT", "env-proj");
        Map<String, Object> cfg = Map.of("type", "gemini", "api_key", "", "model", "gemini-2.0-flash");
        assertDoesNotThrow(() -> LlmConfigUtils.validateApiKey(cfg, env));
    }

    @Test
    void validateAdkGeminiAuth_noCredentials_throws() {
        MockEnvironment env = new MockEnvironment();
        IllegalStateException ex =
                assertThrows(
                        IllegalStateException.class,
                        () -> LlmConfigUtils.validateAdkGeminiAuth(Map.of("type", "gemini"), env));
        assertEquals(ErrorMessages.NO_LLM_API_KEY, ex.getMessage());
    }
}
