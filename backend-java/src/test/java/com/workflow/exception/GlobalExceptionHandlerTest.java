package com.workflow.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private HttpServletRequest mockRequest(String path) {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRequestURI()).thenReturn(path != null ? path : "/api/v1/workflows");
        return req;
    }

    @Test
    void handleResourceNotFound_Returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Workflow not found: 123");
        HttpServletRequest request = mockRequest("/api/v1/workflows/123");

        ResponseEntity<Map<String, Object>> response = handler.handleResourceNotFound(ex, request);

        assertEquals(404, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("error"));

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("404", error.get("code"));
        assertEquals("Workflow not found: 123", error.get("message"));
        assertEquals("/api/v1/workflows/123", error.get("path"));
    }

    @Test
    void handleValidation_Returns422() {
        ValidationException ex = new ValidationException("Username is required");
        HttpServletRequest request = mockRequest("/api/v1/auth/register");

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex, request);

        assertEquals(422, response.getStatusCode().value());
        assertNotNull(response.getBody());

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("422", error.get("code"));
        assertEquals("Username is required", error.get("message"));
    }

    @Test
    void handleGenericException_Returns500() {
        Exception ex = new RuntimeException("Unexpected error");
        HttpServletRequest request = mockRequest("/api/v1/workflows");

        ResponseEntity<Map<String, Object>> response = handler.handleGenericException(ex, request);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("500", error.get("code"));
        assertEquals("Unexpected error", error.get("message"));
    }

    @Test
    void handleGenericException_NullMessage_ReturnsDefaultMessage() {
        Exception ex = new NullPointerException();
        HttpServletRequest request = mockRequest("/api/v1/workflows");

        ResponseEntity<Map<String, Object>> response = handler.handleGenericException(ex, request);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) response.getBody().get("error");
        assertEquals("500", error.get("code"));
        assertEquals("An unexpected error occurred", error.get("message"));
    }
}
