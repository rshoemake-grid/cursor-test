package com.workflow.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[0]);
        handler = new GlobalExceptionHandler(env);
    }

    private HttpServletRequest mockRequest(String path) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRequestURI()).thenReturn(path != null ? path : "/api/workflows");
        return req;
    }

    @Test
    void handleResourceNotFound_Returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Workflow not found: 123");
        HttpServletRequest request = mockRequest("/api/workflows/123");

        ResponseEntity<Map<String, Object>> response = handler.handleResourceNotFound(ex, request);

        assertEquals(404, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("Workflow not found: 123", response.getBody().get("detail"));
        assertTrue(response.getBody().containsKey("error"));

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("404", error.get("code"));
        assertEquals("Workflow not found: 123", error.get("message"));
        assertEquals("/api/workflows/123", error.get("path"));
    }

    @Test
    void handleValidation_Returns422() {
        ValidationException ex = new ValidationException("Username is required");
        HttpServletRequest request = mockRequest("/api/auth/register");

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex, request);

        assertEquals(422, response.getStatusCode().value());
        assertNotNull(response.getBody());

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("422", error.get("code"));
        assertEquals("Username is required", error.get("message"));
    }

    @Test
    void handleBadCredentials_Returns401() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");
        HttpServletRequest request = mockRequest("/api/auth/login");

        ResponseEntity<Map<String, Object>> response = handler.handleBadCredentials(ex, request);

        assertEquals(401, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("Invalid username or password", response.getBody().get("detail"));
        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("401", error.get("code"));
    }

    @Test
    void handleGenericException_Returns500() {
        Exception ex = new RuntimeException("Unexpected error");
        HttpServletRequest request = mockRequest("/api/workflows");

        ResponseEntity<Map<String, Object>> response = handler.handleGenericException(ex, request);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("500", error.get("code"));
        assertEquals("An unexpected error occurred", error.get("message"));
    }

    @Test
    void handleGenericException_NullMessage_ReturnsDefaultMessage() {
        Exception ex = new NullPointerException();
        HttpServletRequest request = mockRequest("/api/workflows");

        ResponseEntity<Map<String, Object>> response = handler.handleGenericException(ex, request);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("500", error.get("code"));
        assertEquals("An unexpected error occurred", error.get("message"));
    }

    @Test
    void handleGenericException_Production_ReturnsGenericMessage() {
        Environment prodEnv = mock(Environment.class);
        when(prodEnv.getActiveProfiles()).thenReturn(new String[]{"production"});
        GlobalExceptionHandler prodHandler = new GlobalExceptionHandler(prodEnv);

        Exception ex = new RuntimeException("Sensitive internal error");
        HttpServletRequest request = mockRequest("/api/workflows");

        ResponseEntity<Map<String, Object>> response = prodHandler.handleGenericException(ex, request);

        assertEquals(500, response.getStatusCode().value());
        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("500", error.get("code"));
        assertEquals("An unexpected error occurred", error.get("message"));
    }
}
