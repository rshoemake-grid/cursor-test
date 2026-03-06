package com.workflow.engine;

import com.workflow.dto.Node;

import java.util.Map;

/**
 * Interface for executing a single workflow node.
 * Implementations handle start, end, agent, condition, and loop node types.
 *
 * LSP-1: Implementations may throw {@link IllegalStateException} when prerequisites are not met.
 * For example, {@link AgentNodeExecutor} throws when LLM config is missing or API key is not configured.
 * Callers should handle these exceptions and propagate them as execution failures.
 */
public interface NodeExecutor {

    /**
     * Execute a node and return its output.
     *
     * @param node  the node to execute
     * @param inputs inputs for the node (from previous nodes or workflow variables)
     * @param state current execution state (node_states, variables, logs)
     * @param ctx   execution context (llmConfig, userId)
     * @return the output of the node (e.g. agent response, condition branch, loop last result)
     * @throws IllegalStateException if prerequisites are not met (e.g. LLM config, API key for agent nodes)
     */
    Object execute(Node node, Map<String, Object> inputs, ExecutionState state, NodeExecutionContext ctx);
}
