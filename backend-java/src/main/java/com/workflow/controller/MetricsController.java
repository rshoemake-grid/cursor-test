package com.workflow.controller;

import com.workflow.metrics.MetricsCollector;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Metrics controller - matches Python /metrics endpoint.
 * Returns Prometheus-compatible API usage statistics.
 */
@RestController
@Tag(name = "Metrics", description = "API usage metrics for monitoring")
public class MetricsController {

    private final MetricsCollector metricsCollector;

    public MetricsController(MetricsCollector metricsCollector) {
        this.metricsCollector = metricsCollector;
    }

    @GetMapping("/metrics")
    @Operation(summary = "API Metrics", description = "Prometheus-compatible metrics with request counts, error rates, and latency")
    @ApiResponse(responseCode = "200", description = "Metrics data")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(metricsCollector.getMetrics());
    }
}
