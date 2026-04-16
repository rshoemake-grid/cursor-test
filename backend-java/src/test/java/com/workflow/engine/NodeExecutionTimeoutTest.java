package com.workflow.engine;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.time.Duration;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NodeExecutionTimeoutTest {

    @Test
    void resolve_nullEnvironment_returnsEmpty() {
        assertTrue(NodeExecutionTimeout.resolve(null).isEmpty());
    }

    @Test
    void resolve_invalidFallsBackTo900Seconds() {
        MockEnvironment env = new MockEnvironment().withProperty("NODE_EXECUTION_TIMEOUT_SEC", "not-a-number");
        assertEquals(Optional.of(Duration.ofSeconds(900)), NodeExecutionTimeout.resolve(env));
    }

    @Test
    void resolve_zeroOrNegative_disables() {
        assertTrue(
                NodeExecutionTimeout.resolve(new MockEnvironment().withProperty("NODE_EXECUTION_TIMEOUT_SEC", "0"))
                        .isEmpty());
        assertTrue(
                NodeExecutionTimeout.resolve(new MockEnvironment().withProperty("NODE_EXECUTION_TIMEOUT_SEC", "-1"))
                        .isEmpty());
    }

    @Test
    void resolve_customSeconds() {
        MockEnvironment env = new MockEnvironment().withProperty("NODE_EXECUTION_TIMEOUT_SEC", "30");
        assertEquals(Optional.of(Duration.ofSeconds(30)), NodeExecutionTimeout.resolve(env));
    }

    @Test
    void resolve_usesWorkflowPropertyWhenNodeEnvUnset() {
        MockEnvironment env = new MockEnvironment().withProperty("workflow.node-execution-timeout-sec", "60");
        assertEquals(Optional.of(Duration.ofSeconds(60)), NodeExecutionTimeout.resolve(env));
    }

    @Test
    void resolve_nodeEnvOverridesWorkflowProperty() {
        MockEnvironment env = new MockEnvironment()
                .withProperty("workflow.node-execution-timeout-sec", "60")
                .withProperty("NODE_EXECUTION_TIMEOUT_SEC", "120");
        assertEquals(Optional.of(Duration.ofSeconds(120)), NodeExecutionTimeout.resolve(env));
    }
}
