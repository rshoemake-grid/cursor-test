package com.workflow.metrics;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Thread-safe metrics collector - matches Python metrics_collector.
 * Records request counts, latency, errors for Prometheus-compatible monitoring.
 */
@Component
public class MetricsCollector {

    private final AtomicInteger requestCount = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);
    private final AtomicLong totalLatencyMs = new AtomicLong(0);
    private final Map<String, AtomicInteger> endpointCounts = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> endpointErrors = new ConcurrentHashMap<>();
    private final Map<Integer, AtomicInteger> statusCodes = new ConcurrentHashMap<>();
    private final Instant startTime = Instant.now();

    public void recordRequest(String endpoint, int statusCode, long latencyMs) {
        requestCount.incrementAndGet();
        totalLatencyMs.addAndGet(latencyMs);
        endpointCounts.computeIfAbsent(endpoint, k -> new AtomicInteger(0)).incrementAndGet();
        statusCodes.computeIfAbsent(statusCode, k -> new AtomicInteger(0)).incrementAndGet();

        if (statusCode >= 400) {
            errorCount.incrementAndGet();
            endpointErrors.computeIfAbsent(endpoint, k -> new AtomicInteger(0)).incrementAndGet();
        }
    }

    public Map<String, Object> getMetrics() {
        long reqTotal = requestCount.get();
        long errTotal = errorCount.get();
        long totalLat = totalLatencyMs.get();
        double uptimeSeconds = java.time.Duration.between(startTime, Instant.now()).toMillis() / 1000.0;

        Map<String, Integer> endpoints = new ConcurrentHashMap<>();
        endpointCounts.forEach((k, v) -> endpoints.put(k, v.get()));

        Map<String, Integer> epErrors = new ConcurrentHashMap<>();
        endpointErrors.forEach((k, v) -> epErrors.put(k, v.get()));

        Map<String, Integer> statusCodeMap = new ConcurrentHashMap<>();
        statusCodes.forEach((k, v) -> statusCodeMap.put(k.toString(), v.get()));

        double avgLatency = reqTotal > 0 ? (double) totalLat / reqTotal : 0.0;
        double successRate = reqTotal > 0 ? (reqTotal - errTotal) / (double) reqTotal * 100 : 100.0;
        double rps = uptimeSeconds > 0 ? reqTotal / uptimeSeconds : 0.0;

        return Map.of(
            "requests_total", (int) reqTotal,
            "errors_total", (int) errTotal,
            "success_rate", Math.round(successRate * 100.0) / 100.0,
            "average_latency_ms", Math.round(avgLatency * 100.0) / 100.0,
            "uptime_seconds", Math.round(uptimeSeconds * 100.0) / 100.0,
            "requests_per_second", Math.round(rps * 100.0) / 100.0,
            "endpoints", endpoints,
            "endpoint_errors", epErrors,
            "status_codes", statusCodeMap,
            "timestamp", Instant.now().toString()
        );
    }
}
