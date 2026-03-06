package com.workflow.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * T-6: Integration tests for SecurityConfig - route authorization matrix.
 * Verifies public vs protected routes behave correctly.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void health_permitAll_returnsOkWithoutAuth() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
    }

    @Test
    void authLogin_permitAll_acceptsRequestWithoutAuth() throws Exception {
        var result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"u\",\"password\":\"p\"}"))
                .andReturn();
        // permitAll: request reaches controller; 403 would mean blocked by security
        assertNotEquals(403, result.getResponse().getStatus(), "Login should not be forbidden (permitAll)");
    }

    @Test
    void authRegister_permitAll_acceptsRequestWithoutAuth() throws Exception {
        var result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"u\",\"email\":\"e@e.com\",\"password\":\"p\"}"))
                .andReturn();
        assertNotEquals(403, result.getResponse().getStatus(), "Register should not be forbidden (permitAll)");
    }

    @Test
    void marketplaceDiscover_permitAll_returnsOkWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/marketplace/discover"))
                .andExpect(status().isOk());
    }

    @Test
    void marketplaceAgentsGet_permitAll_returnsOkWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/marketplace/agents"))
                .andExpect(status().isOk());
    }

    @Test
    void templates_permitAll_returnsOkWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/templates"))
                .andExpect(status().isOk());
    }

    @Test
    void workflows_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/workflows"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void workflows_withMockUser_returnsOk() throws Exception {
        mockMvc.perform(get("/api/workflows"))
                .andExpect(status().isOk());
    }

    @Test
    void executions_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/executions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void executeWorkflow_withoutAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/workflows/some-id/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debug_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/debug/workflow/some-id/validate"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void debug_withAuth_returnsOkOr404() throws Exception {
        mockMvc.perform(get("/api/debug/workflow/nonexistent/validate"))
                .andExpect(status().isNotFound());
    }

    @Test
    void importExport_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/import-export/export/some-id"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void apiDocs_permitAll_returnsOkWithoutAuth() throws Exception {
        mockMvc.perform(get("/api-docs"))
                .andExpect(status().isOk());
    }
}
