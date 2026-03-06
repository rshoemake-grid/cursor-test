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

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * T-3: Integration tests for DebugController - validate, executionHistory, timeline, stats, export.
 * Verifies auth/authorization behavior (S-C3: debug endpoints require auth).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DebugControllerIntegrationTest {

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
        workflowCreate.setName("Debug Test Workflow");
        workflowCreate.setDescription("For debug tests");
        workflowCreate.setVersion("1.0.0");
        workflowCreate.setNodes(List.of(startNode, endNode));
        workflowCreate.setEdges(List.of(edge));
        workflowCreate.setVariables(Map.of());
    }

    @Test
    void validate_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/debug/workflow/some-id/validate"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void validate_validWorkflow_returnsOk() throws Exception {
        String createResult = mockMvc.perform(post("/api/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        mockMvc.perform(get("/api/debug/workflow/" + workflowId + "/validate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workflow_id").value(workflowId))
                .andExpect(jsonPath("$.valid").exists())
                .andExpect(jsonPath("$.issues").isArray())
                .andExpect(jsonPath("$.warnings").isArray())
                .andExpect(jsonPath("$.node_count").value(2))
                .andExpect(jsonPath("$.edge_count").value(1));
    }

    @Test
    @WithMockUser(username = "testuser")
    void validate_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/debug/workflow/nonexistent-id/validate"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "testuser")
    void executionHistory_returnsOk() throws Exception {
        String createResult = mockMvc.perform(post("/api/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        mockMvc.perform(post("/api/workflows/" + workflowId + "/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/debug/workflow/" + workflowId + "/executions/history")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "testuser")
    void timeline_returnsOk() throws Exception {
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

        mockMvc.perform(get("/api/debug/execution/" + executionId + "/timeline"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.execution_id").value(executionId))
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.timeline").isArray());
    }

    @Test
    @WithMockUser(username = "testuser")
    void timeline_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/debug/execution/nonexistent-exec-id/timeline"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "testuser")
    void nodeDetails_nodeNotInExecution_returns404() throws Exception {
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

        mockMvc.perform(get("/api/debug/execution/" + executionId + "/node/nonexistent-node"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "testuser")
    void workflowStats_returnsOk() throws Exception {
        String createResult = mockMvc.perform(post("/api/workflows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        mockMvc.perform(get("/api/debug/workflow/" + workflowId + "/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workflow_id").value(workflowId))
                .andExpect(jsonPath("$.total_executions").isNumber())
                .andExpect(jsonPath("$.success_count").isNumber())
                .andExpect(jsonPath("$.failure_count").isNumber());
    }

    @Test
    @WithMockUser(username = "testuser")
    void exportExecution_returnsOk() throws Exception {
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

        mockMvc.perform(post("/api/debug/execution/" + executionId + "/export"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.export_version").value("1.0"))
                .andExpect(jsonPath("$.execution.id").value(executionId))
                .andExpect(jsonPath("$.execution.workflow_id").value(workflowId))
                .andExpect(jsonPath("$.workflow").exists());
    }

    @Test
    void exportExecution_withoutAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/debug/execution/some-exec-id/export"))
                .andExpect(status().isUnauthorized());
    }
}
