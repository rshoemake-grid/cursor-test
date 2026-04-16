package com.workflow.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller — matches Python /health with database connectivity check.
 */
@RestController
@Tag(name = "Health", description = "Health check endpoint")
public class HealthController {
    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private static final String SERVICE_NAME = "workflow-builder-backend";
    private static final String SERVICE_VERSION = "1.0.0";

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    @Operation(summary = "Health Check", description = "Comprehensive health check endpoint")
    @ApiResponse(responseCode = "200", description = "Service is healthy")
    public ResponseEntity<Map<String, Object>> health() {
        log.debug("GET /health - Health check requested");

        Map<String, Object> response = new HashMap<>();
        response.put("service", SERVICE_NAME);
        response.put("version", SERVICE_VERSION);
        response.put("timestamp", Instant.now().toString());

        Map<String, Object> checks = new HashMap<>();
        Map<String, Object> dbCheck = new HashMap<>();

        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            dbCheck.put("status", "healthy");
            dbCheck.put("message", "Database connection successful");
        } catch (DataAccessException e) {
            log.warn("Health check: database unhealthy: {}", e.getMessage());
            dbCheck.put("status", "unhealthy");
            dbCheck.put("message", "Database connection failed: " + e.getMessage());
            checks.put("database", dbCheck);
            response.put("checks", checks);
            response.put("status", "unhealthy");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }

        checks.put("database", dbCheck);
        response.put("checks", checks);
        response.put("status", "healthy");
        return ResponseEntity.ok(response);
    }
}
