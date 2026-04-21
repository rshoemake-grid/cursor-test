package com.workflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.LoginRequest;
import com.workflow.dto.UserCreate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void register_ReturnsOk() throws Exception {
        UserCreate userCreate = new UserCreate();
        userCreate.setUsername("newuser" + System.currentTimeMillis());
        userCreate.setEmail("newuser" + System.currentTimeMillis() + "@example.com");
        userCreate.setPassword("password123");
        userCreate.setFullName("New User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userCreate)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value(userCreate.getUsername()))
                .andExpect(jsonPath("$.email").value(userCreate.getEmail()))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void registerThenLogin_ReturnsTokens() throws Exception {
        String username = "loginuser" + System.currentTimeMillis();
        String email = username + "@example.com";

        UserCreate registerRequest = new UserCreate();
        registerRequest.setUsername(username);
        registerRequest.setEmail(email);
        registerRequest.setPassword("password123");
        registerRequest.setFullName("Login User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").exists())
                .andExpect(jsonPath("$.refresh_token").exists())
                .andExpect(jsonPath("$.token_type").value("bearer"))
                .andExpect(jsonPath("$.user").exists());
    }

    @Test
    void registerMixedCaseEmail_loginWithLowercaseEmail_Succeeds() throws Exception {
        String username = "caseuser" + System.currentTimeMillis();
        long ts = System.currentTimeMillis();
        String emailRaw = "MixedCASE+" + ts + "@Example.COM";
        String emailNormalized = "mixedcase+" + ts + "@example.com";

        UserCreate registerRequest = new UserCreate();
        registerRequest.setUsername(username);
        registerRequest.setEmail(emailRaw);
        registerRequest.setPassword("password123");
        registerRequest.setFullName("Case User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(emailNormalized));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(emailNormalized);
        loginRequest.setPassword("password123");
        loginRequest.setRememberMe(false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").exists());
    }

    @Test
    void login_TrimsUsername_Succeeds() throws Exception {
        String username = "trimuser" + System.currentTimeMillis();
        UserCreate registerRequest = new UserCreate();
        registerRequest.setUsername(username);
        registerRequest.setEmail(username + "@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setFullName("Trim User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("  " + username + "  ");
        loginRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").exists());
    }
}
