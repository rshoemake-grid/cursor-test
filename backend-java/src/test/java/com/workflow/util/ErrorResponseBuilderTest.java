package com.workflow.util;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ErrorResponseBuilderTest {

    @Test
    void buildErrorResponse_ReturnsCorrectStructure() {
        ResponseEntity<Map<String, Object>> response = ErrorResponseBuilder.buildErrorResponse(
                "404", "Not found", HttpStatus.NOT_FOUND);

        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());

        Map<String, Object> body = response.getBody();
        assertTrue(body.containsKey("error"));

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) body.get("error");
        assertEquals("404", error.get("code"));
        assertEquals("Not found", error.get("message"));
        assertNotNull(error.get("timestamp"));
    }

    @Test
    void internalServerError_Returns500() {
        ResponseEntity<Map<String, Object>> response = ErrorResponseBuilder.internalServerError("Server error");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertErrorBody(response.getBody(), "500", "Server error");
    }

    @Test
    void notFound_Returns404() {
        ResponseEntity<Map<String, Object>> response = ErrorResponseBuilder.notFound("Resource not found");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertErrorBody(response.getBody(), "404", "Resource not found");
    }

    @Test
    void validationError_Returns422() {
        ResponseEntity<Map<String, Object>> response = ErrorResponseBuilder.validationError("Invalid input");

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, response.getStatusCode());
        assertErrorBody(response.getBody(), "422", "Invalid input");
    }

    @Test
    void badRequest_Returns400() {
        ResponseEntity<Map<String, Object>> response = ErrorResponseBuilder.badRequest("Bad request");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertErrorBody(response.getBody(), "400", "Bad request");
    }

    @Test
    void unauthorized_Returns401() {
        ResponseEntity<Map<String, Object>> response = ErrorResponseBuilder.unauthorized("Unauthorized");

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertErrorBody(response.getBody(), "401", "Unauthorized");
    }

    private void assertErrorBody(Map<String, Object> body, String expectedCode, String expectedMessage) {
        assertNotNull(body);
        assertTrue(body.containsKey("error"));

        @SuppressWarnings("unchecked")
        Map<String, Object> error = (Map<String, Object>) body.get("error");
        assertEquals(expectedCode, error.get("code"));
        assertEquals(expectedMessage, error.get("message"));
        assertNotNull(error.get("timestamp"));
    }
}
