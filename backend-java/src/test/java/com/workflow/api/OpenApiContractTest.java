package com.workflow.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Guards Springdoc OpenAPI output so major HTTP surface stays discoverable (Python FastAPI parity checklist).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void apiDocs_exposesOpenApi3AndCorePaths() throws Exception {
        MvcResult result =
                mockMvc.perform(get("/api-docs").accept(MediaType.APPLICATION_JSON))
                        .andExpect(status().isOk())
                        .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertNotNull(root.get("openapi"), "Expected OpenAPI document");
        assertTrue(
                root.get("openapi").asText().startsWith("3."),
                () -> "Expected OpenAPI 3.x, got: " + root.get("openapi"));

        JsonNode paths = root.get("paths");
        assertNotNull(paths, "Expected paths object");
        Set<String> pathKeys = new HashSet<>();
        paths.fieldNames().forEachRemaining(pathKeys::add);

        for (String required :
                new String[] {
                    "/api/workflows",
                    "/api/workflows/{id}",
                    "/api/workflows/{workflowId}/execute",
                    "/api/executions",
                    "/api/executions/{executionId}",
                    "/api/workflow-chat/chat",
                    "/api/settings/llm",
                    "/api/auth/login",
                    "/health",
                    "/metrics"
                }) {
            assertTrue(pathKeys.contains(required), () -> "Missing path: " + required + "; have sample: " + pathKeys.stream().sorted().limit(15).toList());
        }

        assertFalse(pathKeys.isEmpty());
    }
}
