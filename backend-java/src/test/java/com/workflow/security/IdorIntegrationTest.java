package com.workflow.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.workflow.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * T-8: IDOR scenarios - unprivileged users cannot access others' workflows/executions.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IdorIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    private String registerAndLogin(String username, String email, String password) throws Exception {
        UserCreate userCreate = new UserCreate();
        userCreate.setUsername(username);
        userCreate.setEmail(email);
        userCreate.setPassword(password);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreate)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        String loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(loginResult).get("access_token").asText();
    }

    @Test
    void idor_workflowAndExecution_otherUserCannotAccess() throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        String tokenOwner = registerAndLogin("idor-owner-" + unique, "owner-" + unique + "@test.com", "password");
        String tokenOther = registerAndLogin("idor-other-" + unique, "other-" + unique + "@test.com", "password");

        WorkflowCreate workflowCreate = createMinimalWorkflow();

        String createResult = mockMvc.perform(post("/api/workflows")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String workflowId = objectMapper.readTree(createResult).get("id").asText();

        mockMvc.perform(get("/api/workflows/" + workflowId)
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());

        workflowCreate.setName("Hacked Name");
        mockMvc.perform(put("/api/workflows/" + workflowId)
                        .header("Authorization", "Bearer " + tokenOther)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workflowCreate)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/workflows/" + workflowId)
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());

        String createResult2 = mockMvc.perform(post("/api/workflows")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createMinimalWorkflow())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String workflowId2 = objectMapper.readTree(createResult2).get("id").asText();

        String executeResult = mockMvc.perform(post("/api/workflows/" + workflowId2 + "/execute")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String executionId = objectMapper.readTree(executeResult).get("executionId").asText();

        mockMvc.perform(get("/api/executions/" + executionId)
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/executions/" + executionId + "/logs")
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/import-export/export/" + workflowId2)
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());

        // Code Review 2026: Debug endpoints - other user cannot access owner's debug data
        mockMvc.perform(get("/api/debug/workflow/" + workflowId2 + "/validate")
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/debug/workflow/" + workflowId2 + "/executions/history")
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/debug/workflow/" + workflowId2 + "/stats")
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/debug/execution/" + executionId + "/timeline")
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/debug/execution/" + executionId + "/export")
                        .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());
    }

    private WorkflowCreate createMinimalWorkflow() {
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

        WorkflowCreate wc = new WorkflowCreate();
        wc.setName("Owner Workflow");
        wc.setDescription("Test");
        wc.setVersion("1.0.0");
        wc.setNodes(List.of(startNode, endNode));
        wc.setEdges(List.of(edge));
        wc.setVariables(Map.of());
        return wc;
    }
}
