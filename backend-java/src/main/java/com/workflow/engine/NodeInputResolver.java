package com.workflow.engine;

import com.workflow.util.ObjectUtils;
import com.workflow.dto.Edge;
import com.workflow.dto.InputMapping;
import com.workflow.dto.Node;
import com.workflow.dto.NodeType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Centralizes input resolution for workflow nodes (DRY).
 * Handles input mappings and fallback from previous node output.
 */
public final class NodeInputResolver {

    private NodeInputResolver() {
    }

    /**
     * Resolve inputs for a node: mappings first, then previous node output for agent/loop/condition.
     */
    public static Map<String, Object> resolveInputs(Node node, ExecutionState state, List<Edge> edges) {
        Map<String, Object> inputs = prepareFromMappings(node, state);
        if (inputs.isEmpty() && needsPreviousOutput(node)) {
            Object prev = getPreviousNodeOutput(node, state, edges);
            if (prev != null) {
                if (prev instanceof Map) {
                    inputs = new HashMap<>((Map<String, Object>) prev);
                } else {
                    inputs = new HashMap<>(Map.of("data", prev, "output", prev));
                }
            } else {
                inputs = new HashMap<>(state.getVariables());
            }
        }
        return inputs;
    }

    public static Map<String, Object> prepareFromMappings(Node node, ExecutionState state) {
        Map<String, Object> inputs = new HashMap<>();
        List<InputMapping> mappings = node.getInputs();
        if (mappings == null) return inputs;

        for (InputMapping m : mappings) {
            if (m.getSourceNode() != null && !m.getSourceNode().isEmpty()) {
                NodeState src = state.getNodeStates().get(m.getSourceNode());
                if (src != null && src.getOutput() != null) {
                    if (src.getOutput() instanceof Map) {
                        Object val = ((Map<?, ?>) src.getOutput()).get(m.getSourceField());
                        inputs.put(m.getName(), ObjectUtils.orDefault(val, src.getOutput()));
                    } else {
                        inputs.put(m.getName(), src.getOutput());
                    }
                }
            } else if (m.getSourceField() != null && state.getVariables().containsKey(m.getSourceField())) {
                inputs.put(m.getName(), state.getVariables().get(m.getSourceField()));
            }
        }
        return inputs;
    }

    /**
     * Get output from the first upstream node (by edge source). For nodes with multiple incoming edges,
     * only the first matching upstream output is returned; other upstream outputs are ignored.
     */
    public static Object getPreviousNodeOutput(Node node, ExecutionState state, List<Edge> edges) {
        for (Edge e : edges) {
            if (node.getId().equals(e.getTarget())) {
                NodeState src = state.getNodeStates().get(e.getSource());
                if (src != null && src.getOutput() != null) {
                    return src.getOutput();
                }
                break;
            }
        }
        return null;
    }

    private static boolean needsPreviousOutput(Node node) {
        NodeType t = node.getType();
        if (t == null) return false;
        return NodeType.LOOP.equals(t) || NodeType.CONDITION.equals(t) || NodeType.AGENT.equals(t);
    }
}
