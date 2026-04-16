package com.workflow.metrics;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MetricsCollectorTest {

    @Test
    void getMetrics_includesLastResetAndUtcTimestampIso() {
        MetricsCollector c = new MetricsCollector();
        Map<String, Object> m = c.getMetrics();

        assertNotNull(m.get("last_reset"));
        assertNotNull(m.get("timestamp"));
        Instant.parse((String) m.get("last_reset"));
        Instant.parse((String) m.get("timestamp"));
    }

    @Test
    void reset_clearsCountersAndUpdatesLastReset() throws InterruptedException {
        MetricsCollector c = new MetricsCollector();
        String resetBefore = (String) c.getMetrics().get("last_reset");
        c.recordRequest("/api/foo", 200, 5);
        c.recordRequest("/api/foo", 500, 10);

        assertEquals(1, ((Map<?, ?>) c.getMetrics().get("endpoint_errors")).size());

        Thread.sleep(2);
        c.reset();

        Map<String, Object> after = c.getMetrics();
        assertEquals(0, after.get("requests_total"));
        assertEquals(0, after.get("errors_total"));
        assertTrue(((Map<?, ?>) after.get("endpoints")).isEmpty());
        assertTrue(((Map<?, ?>) after.get("endpoint_errors")).isEmpty());
        assertTrue(((Map<?, ?>) after.get("status_codes")).isEmpty());

        String resetAfter = (String) after.get("last_reset");
        assertNotEquals(resetBefore, resetAfter);
        assertTrue(resetAfter.compareTo(resetBefore) >= 0);
    }

    @Test
    void reset_doesNotResetProcessStartTimeSoUptimeKeepsGrowing() throws InterruptedException {
        MetricsCollector c = new MetricsCollector();
        double u1 = (Double) c.getMetrics().get("uptime_seconds");
        Thread.sleep(20);
        c.reset();
        double u2 = (Double) c.getMetrics().get("uptime_seconds");
        assertTrue(u2 > u1, "uptime should reflect original start instant, not reset()");
    }
}
