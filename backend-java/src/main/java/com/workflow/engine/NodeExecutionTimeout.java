package com.workflow.engine;

import org.springframework.core.env.Environment;

import java.time.Duration;
import java.util.Optional;

/**
 * Per-node wall timeout (Python {@code NODE_EXECUTION_TIMEOUT_SEC} in {@code executor_v3.py}).
 */
public final class NodeExecutionTimeout {

    private NodeExecutionTimeout() {
    }

    /**
     * Resolve timeout from Spring {@link Environment} (system env + properties).
     * Same rules as Python: default 900s; invalid values → 900s; {@code <= 0} disables timeout.
     */
    public static Optional<Duration> resolve(Environment environment) {
        if (environment == null) {
            return Optional.empty();
        }
        String raw = environment.getProperty("NODE_EXECUTION_TIMEOUT_SEC");
        if (raw == null || raw.isBlank()) {
            raw = environment.getProperty("workflow.node-execution-timeout-sec", "900");
        }
        double seconds;
        try {
            seconds = Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            return Optional.of(Duration.ofSeconds(900));
        }
        if (seconds <= 0) {
            return Optional.empty();
        }
        long millis = Math.max(1L, Math.round(seconds * 1000.0));
        return Optional.of(Duration.ofMillis(millis));
    }
}
