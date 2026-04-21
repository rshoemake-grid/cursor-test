package com.workflow.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.fail;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Ensures Springdoc exposes every HTTP path template that FastAPI publishes (Python source of truth).
 * Parameter names differ (camelCase vs snake_case); we normalize Java paths to Python conventions.
 *
 * Regenerate the snapshot: {@code python backend/scripts/export_openapi_paths.py} from repo root.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiParityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void springdocPathsCoverPythonOpenApiPaths() throws Exception {
        List<String> pythonPaths;
        try (InputStream in = new ClassPathResource("parity/python-openapi-paths.json").getInputStream()) {
            CollectionType listType =
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class);
            pythonPaths = objectMapper.readValue(in, listType);
        }

        MvcResult result =
                mockMvc.perform(get("/api-docs").accept(MediaType.APPLICATION_JSON))
                        .andExpect(status().isOk())
                        .andReturn();

        JsonNode paths = objectMapper.readTree(result.getResponse().getContentAsString()).get("paths");
        Set<String> javaNormalized = new HashSet<>();
        paths.fieldNames().forEachRemaining(
                p -> javaNormalized.add(normalizeJavaOpenApiPathToPython(p)));

        List<String> missing = pythonPaths.stream()
                .filter(py -> !javaNormalized.contains(py))
                .collect(Collectors.toList());

        if (!missing.isEmpty()) {
            fail("Java OpenAPI missing these Python (FastAPI) path templates after normalization: "
                    + missing
                    + ". Java normalized sample: "
                    + javaNormalized.stream().sorted().limit(25).collect(Collectors.toList()));
        }
    }

    /**
     * Map Spring MVC path templates (camelCase params) to FastAPI-style snake_case templates.
     */
    static String normalizeJavaOpenApiPathToPython(String path) {
        String s = path;
        s = s.replace("{workflowId}", "{workflow_id}");
        s = s.replace("{executionId}", "{execution_id}");
        s = s.replace("{templateId}", "{template_id}");
        s = s.replace("{shareId}", "{share_id}");
        s = s.replace("{versionId}", "{version_id}");
        s = s.replace("{userId}", "{user_id}");
        s = s.replace("{nodeId}", "{node_id}");
        if (s.startsWith("/api/workflows/")) {
            s = s.replace("{id}", "{workflow_id}");
        }
        return s;
    }
}
