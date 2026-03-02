package com.workflow.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for HealthController. Controller has no dependencies, so we can test it directly.
 */
class HealthControllerTest {

    @Test
    void health_ReturnsOkWithCorrectStructure() {
        HealthController controller = new HealthController();
        ResponseEntity<Map<String, Object>> response = controller.health();

        assertNotNull(response);
        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody());

        Map<String, Object> body = response.getBody();
        assertEquals("healthy", body.get("status"));
        assertEquals("workflow-builder-backend", body.get("service"));
        assertEquals("1.0.0", body.get("version"));
        assertNotNull(body.get("timestamp"));
        assertTrue(body.containsKey("checks"));

        @SuppressWarnings("unchecked")
        Map<String, Object> checks = (Map<String, Object>) body.get("checks");
        assertTrue(checks.containsKey("database"));
        @SuppressWarnings("unchecked")
        Map<String, Object> dbCheck = (Map<String, Object>) checks.get("database");
        assertEquals("healthy", dbCheck.get("status"));
        assertEquals("Database connection successful", dbCheck.get("message"));
    }
}
