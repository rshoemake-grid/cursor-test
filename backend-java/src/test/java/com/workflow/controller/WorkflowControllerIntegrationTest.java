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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WorkflowControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;
    private WorkflowCreate workflowCreate;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        workflowCreate = new WorkflowCreate();
        workflowCreate.setName("Test Workflow");
        workflowCreate.setDescription("Test Description");
        workflowCreate.setVersion("1.0.0");
        workflowCreate.setNodes(Arrays.asList(new Node()));
        workflowCreate.setEdges(Arrays.asList(new Edge()));
        workflowCreate.setVariables(java.util.Map.of("key", "value"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void createWorkflow_ReturnsOk() throws Exception {
        mockMvc.perform(post("/api/v1/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Workflow"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    @WithMockUser(username = "testuser")
    void listWorkflows_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/v1/workflows"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "testuser")
    void createThenGetWorkflow_ReturnsWorkflow() throws Exception {
        String createResult = mockMvc.perform(post("/api/v1/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andReturn().getResponse().getContentAsString();

        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        mockMvc.perform(get("/api/v1/workflows/" + workflowId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(workflowId))
                .andExpect(jsonPath("$.name").value("Test Workflow"));
    }

    @Test
    @WithMockUser(username = "testuser")
    void createUpdateDeleteWorkflow_FullCycle() throws Exception {
        String createResult = mockMvc.perform(post("/api/v1/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        workflowCreate.setName("Updated Workflow");
        mockMvc.perform(put("/api/v1/workflows/" + workflowId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Workflow"));

        mockMvc.perform(delete("/api/v1/workflows/" + workflowId))
                .andExpect(status().isNoContent());
    }
}
