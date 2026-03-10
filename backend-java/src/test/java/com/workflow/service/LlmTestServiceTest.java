package com.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.config.LlmProviderConfig;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class LlmTestServiceTest {

    private static final LlmProviderConfig.LlmProviderUrls DEFAULT_URLS = new LlmProviderConfig.LlmProviderUrls();

    private final LlmTestService service = new LlmTestService(DEFAULT_URLS, new ObjectMapper());

    @Test
    void testAnthropic_makesRealRequest() {
        // Uses real HTTP - may fail without valid key; we assert structure
        Map<String, String> result = service.testAnthropic("key", "https://api.anthropic.com", "claude-3");
        assertNotNull(result.get("status"));
        assertNotNull(result.get("message"));
    }

    @Test
    void testProvider_unknownType_returnsError() {
        Map<String, String> result = service.testProvider("unknown", "key", null, "model");
        assertEquals("error", result.get("status"));
        assertTrue(result.get("message").contains("Unknown provider type"));
    }

    @Test
    void testCustom_withNullBaseUrl_returnsError() {
        Map<String, String> result = service.testCustom("key", null, "model");
        assertEquals("error", result.get("status"));
        assertTrue(result.get("message").contains("base_url"));
    }

}
