package com.workflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.workflow.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * T-4: Integration tests for ImportExportController - export (ownership) and import (malformed input).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ImportExportControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;
    private WorkflowCreate workflowCreate;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        workflowCreate = new WorkflowCreate();
        workflowCreate.setName("Export Test Workflow");
        workflowCreate.setDescription("For export test");
        workflowCreate.setVersion("1.0.0");
        workflowCreate.setNodes(List.of(new Node()));
        workflowCreate.setEdges(List.of(new Edge()));
        workflowCreate.setVariables(Map.of());
    }

    @Test
    @WithMockUser(username = "testuser")
    void exportWorkflow_owner_returnsOk() throws Exception {
        String createResult = mockMvc.perform(post("/api/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andReturn().getResponse().getContentAsString();

        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        mockMvc.perform(get("/api/import-export/export/" + workflowId))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("workflow-Export_Test_Workflow.json")))
                .andExpect(jsonPath("$.workflow.id").value(workflowId))
                .andExpect(jsonPath("$.workflow.name").value("Export Test Workflow"))
                .andExpect(jsonPath("$.version").value("1.0"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void exportWorkflow_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/import-export/export/nonexistent-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "testuser")
    void importWorkflow_validDefinition_returnsCreated() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Imported Workflow",
                "description", "Imported from test",
                "definition", Map.of(
                        "nodes", List.of(Map.of("id", "n1", "type", "start")),
                        "edges", List.of(Map.of("id", "e1", "source", "n1", "target", "n2"))
                )
        );

        mockMvc.perform(post("/api/import-export/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Imported Workflow"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    @WithMockUser(username = "testuser")
    void importWorkflow_malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/import-export/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ invalid json }"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "testuser")
    void importWorkflow_missingDefinition_returns400() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Bad Import",
                "description", "No definition"
        );

        mockMvc.perform(post("/api/import-export/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "testuser")
    void importWorkflow_definitionMissingNodes_returns400() throws Exception {
        Map<String, Object> body = Map.of(
                "name", "Bad Import",
                "definition", Map.of("edges", List.of())
        );

        mockMvc.perform(post("/api/import-export/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "testuser")
    void importFile_validJson_returnsCreated() throws Exception {
        String json = """
                {"workflow":{"name":"From File","description":"Imported","nodes":[],"edges":[]},"version":"1.0"}
                """;
        MockMultipartFile file = new MockMultipartFile("file", "workflow.json",
                "application/json", json.getBytes());

        mockMvc.perform(multipart("/api/import-export/import/file").file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("From File"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void importFile_invalidWorkflowMissingNodesEdges_returns400() throws Exception {
        // No "workflow" key - definition = root; root has no nodes/edges
        String json = "{\"name\":\"Bad\",\"description\":\"No structure\"}";
        MockMultipartFile file = new MockMultipartFile("file", "bad.json",
                "application/json", json.getBytes());

        mockMvc.perform(multipart("/api/import-export/import/file").file(file))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "testuser")
    void importFile_malformedJson_returns400() throws Exception {
        String json = "{ invalid json }";
        MockMultipartFile file = new MockMultipartFile("file", "bad.json",
                "application/json", json.getBytes());

        mockMvc.perform(multipart("/api/import-export/import/file").file(file))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "testuser")
    void importWorkflow_oversizedDefinition_returns400() throws Exception {
        Map<String, Object> definition = new java.util.HashMap<>();
        for (int i = 0; i < 51; i++) {
            definition.put("key" + i, "value" + i);
        }
        definition.put("nodes", List.of(Map.of("id", "n1", "type", "start")));
        definition.put("edges", List.of());

        Map<String, Object> body = Map.of(
                "name", "Oversized Import",
                "description", "Too many keys",
                "definition", definition
        );

        mockMvc.perform(post("/api/import-export/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().is4xxClientError());
    }
}
