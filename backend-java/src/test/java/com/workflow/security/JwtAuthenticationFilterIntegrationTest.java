package com.workflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * T-7: Integration tests for JwtAuthenticationFilter - valid/invalid/missing token.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JwtAuthenticationFilterIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void protectedEndpoint_withValidToken_returnsOk() throws Exception {
        String token = jwtUtil.generateToken("testuser", "test-user-id");

        mockMvc.perform(get("/api/workflows")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpoint_withInvalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/workflows")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withMalformedAuthHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/workflows")
                        .header("Authorization", "NotBearer token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withExpiredToken_returns401() throws Exception {
        String expiredToken = jwtUtil.generateToken("testuser", "test-user-id", -1000);

        mockMvc.perform(get("/api/workflows")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/workflows"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicEndpoint_withoutAuth_returnsOk() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
    }
}
