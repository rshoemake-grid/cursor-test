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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * T-1: Integration tests for ExecutionController - execute, get, list, logs.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExecutionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;
    private WorkflowCreate workflowCreate;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        Node startNode = new Node();
        startNode.setId("start-1");
        startNode.setType(NodeType.START);
        Node endNode = new Node();
        endNode.setId("end-1");
        endNode.setType(NodeType.END);
        Edge edge = new Edge();
        edge.setId("e1");
        edge.setSource("start-1");
        edge.setTarget("end-1");

        workflowCreate = new WorkflowCreate();
        workflowCreate.setName("Execution Test Workflow");
        workflowCreate.setDescription("For execution tests");
        workflowCreate.setVersion("1.0.0");
        workflowCreate.setNodes(List.of(startNode, endNode));
        workflowCreate.setEdges(List.of(edge));
        workflowCreate.setVariables(Map.of());
    }

    @Test
    @WithMockUser(username = "testuser")
    void executeWorkflow_returnsOk() throws Exception {
        String createResult = mockMvc.perform(post("/api/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andReturn().getResponse().getContentAsString();

        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        mockMvc.perform(post("/api/workflows/" + workflowId + "/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.executionId").exists())
                .andExpect(jsonPath("$.workflowId").value(workflowId))
                .andExpect(jsonPath("$.status").exists());
    }

    @Test
    @WithMockUser(username = "testuser")
    void executeWorkflow_notFound_returns404() throws Exception {
        mockMvc.perform(post("/api/workflows/nonexistent-id/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "testuser")
    void executeThenGetExecution_returnsExecution() throws Exception {
        String createResult = mockMvc.perform(post("/api/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        String executeResult = mockMvc.perform(post("/api/workflows/" + workflowId + "/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String executionId = objectMapper.readTree(executeResult).get("executionId").asText();

        mockMvc.perform(get("/api/executions/" + executionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.executionId").value(executionId))
                .andExpect(jsonPath("$.workflowId").value(workflowId));
    }

    @Test
    @WithMockUser(username = "testuser")
    void listExecutions_returnsOk() throws Exception {
        mockMvc.perform(get("/api/executions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "testuser")
    void getExecutionLogs_returnsOk() throws Exception {
        String createResult = mockMvc.perform(post("/api/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        String executeResult = mockMvc.perform(post("/api/workflows/" + workflowId + "/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String executionId = objectMapper.readTree(executeResult).get("executionId").asText();

        mockMvc.perform(get("/api/executions/" + executionId + "/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logs").isArray())
                .andExpect(jsonPath("$.total").isNumber());
    }

    @Test
    @WithMockUser(username = "testuser")
    void getExecution_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/executions/nonexistent-exec-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    void executeWorkflow_withoutAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/workflows/some-id/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listExecutions_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/executions"))
                .andExpect(status().isUnauthorized());
    }
}
