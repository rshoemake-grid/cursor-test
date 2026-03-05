package com.workflow.engine;

import java.util.Map;

/**
 * Context passed to node executors - LLM config, user ID, etc.
 */
public record NodeExecutionContext(
        Map<String, Object> llmConfig,
        String userId
) {
}
