package com.workflow.engine;

import com.google.adk.agents.RunConfig;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Documents google-adk 0.7 {@link RunConfig#builder()} defaults relevant to {@link AdkAgentRunner}: a
 * non-persistent {@link com.google.adk.runner.InMemoryRunner} one-shot call must pass
 * {@code setAutoCreateSession(true)} or {@code runAsync(userId, sessionId, message)} throws
 * {@code Session not found: ...}.
 */
class AdkRunConfigSessionDefaultsTest {

    @Test
    void runConfig_builderDefaults_autoCreateSessionFalse() {
        assertFalse(RunConfig.builder().build().autoCreateSession());
    }

    @Test
    void runConfig_withAutoCreateSessionTrue() {
        assertTrue(RunConfig.builder().setAutoCreateSession(true).build().autoCreateSession());
    }
}
