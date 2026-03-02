package com.workflow.engine;

import com.workflow.dto.Node;

import java.util.Map;

/**
 * Interface for executing a single workflow node.
 * Implementations handle start, end, agent, condition, and loop node types.
 */
public interface NodeExecutor {

    /**
     * Execute a node and return its output.
     *
     * @param node  the node to execute
     * @param inputs inputs for the node (from previous nodes or workflow variables)
     * @param state current execution state (node_states, variables, logs)
     * @return the output of the node (e.g. agent response, condition branch, loop last result)
     */
    Object execute(Node node, Map<String, Object> inputs, ExecutionState state);
}
