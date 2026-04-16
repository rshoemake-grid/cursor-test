package com.workflow.controller;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for HealthController with lightweight JdbcTemplate stubs (no Mockito on final framework types).
 */
class HealthControllerTest {

    @Test
    void health_ReturnsOkWhenDatabaseHealthy() {
        JdbcTemplate jdbc = new JdbcTemplate() {
            @Override
            public <T> T queryForObject(String sql, Class<T> requiredType) {
                return requiredType.cast(1);
            }
        };
        HealthController controller = new HealthController(jdbc);
        ResponseEntity<Map<String, Object>> response = controller.health();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("healthy", body.get("status"));
        assertEquals("workflow-builder-backend", body.get("service"));
        assertEquals("1.0.0", body.get("version"));
        @SuppressWarnings("unchecked")
        Map<String, Object> checks = (Map<String, Object>) body.get("checks");
        @SuppressWarnings("unchecked")
        Map<String, Object> db = (Map<String, Object>) checks.get("database");
        assertEquals("healthy", db.get("status"));
        String ts = (String) body.get("timestamp");
        assertNotNull(ts);
        assertTrue(ts.contains("T"), "timestamp should be ISO-8601");
        assertTrue(ts.endsWith("Z") || ts.contains("+"), "timestamp should be UTC-marked ISO-8601");
        Instant.parse(ts);
    }

    @Test
    void health_Returns503WhenDatabaseFails() {
        JdbcTemplate jdbc = new JdbcTemplate() {
            @Override
            public <T> T queryForObject(String sql, Class<T> requiredType) {
                throw new DataAccessException("boom") {
                };
            }
        };
        HealthController controller = new HealthController(jdbc);
        ResponseEntity<Map<String, Object>> response = controller.health();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("unhealthy", body.get("status"));
    }
}
