package com.workflow.metrics;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
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
    private volatile Instant lastReset = Instant.now();

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

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("requests_total", (int) reqTotal);
        snapshot.put("errors_total", (int) errTotal);
        snapshot.put("success_rate", successRate);
        snapshot.put("average_latency_ms", Math.round(avgLatency * 100.0) / 100.0);
        snapshot.put("uptime_seconds", Math.round(uptimeSeconds * 100.0) / 100.0);
        snapshot.put("requests_per_second", Math.round(rps * 100.0) / 100.0);
        snapshot.put("endpoints", endpoints);
        snapshot.put("endpoint_errors", epErrors);
        snapshot.put("status_codes", statusCodeMap);
        snapshot.put("last_reset", lastReset.toString());
        snapshot.put("timestamp", Instant.now().toString());
        return snapshot;
    }

    /**
     * Clears counters (matches Python {@code MetricsCollector.reset}); does not change process start time used for uptime.
     */
    public void reset() {
        requestCount.set(0);
        errorCount.set(0);
        totalLatencyMs.set(0);
        endpointCounts.clear();
        endpointErrors.clear();
        statusCodes.clear();
        lastReset = Instant.now();
    }
}
