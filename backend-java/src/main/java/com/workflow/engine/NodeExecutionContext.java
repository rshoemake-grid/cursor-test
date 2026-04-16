package com.workflow.engine;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Context passed to node executors — LLM config, user ID, graph wiring for storage/input resolution.
 */
public record NodeExecutionContext(
        Map<String, Object> llmConfig,
        String userId,
        List<Edge> edges,
        Map<String, Node> nodesById
) {
    public NodeExecutionContext {
        llmConfig = llmConfig == null ? Map.of() : llmConfig;
        edges = edges == null ? List.of() : List.copyOf(edges);
        nodesById = nodesById == null ? Map.of() : Collections.unmodifiableMap(Map.copyOf(nodesById));
    }
}
