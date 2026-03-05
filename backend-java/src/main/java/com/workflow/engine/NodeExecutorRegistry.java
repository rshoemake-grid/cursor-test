package com.workflow.engine;

import com.workflow.dto.Node;
import com.workflow.dto.NodeType;

import java.util.EnumMap;
import java.util.Map;

/**
 * Registry for node executors - OCP compliant.
 * New node types can be added by registering an executor without modifying callers.
 */
public class NodeExecutorRegistry {

    private final Map<NodeType, NodeExecutor> executors = new EnumMap<>(NodeType.class);

    public NodeExecutorRegistry(LlmApiClient llmClient) {
        executors.put(NodeType.AGENT, new AgentNodeExecutor(llmClient));
        executors.put(NodeType.CONDITION, new ConditionNodeExecutor());
        executors.put(NodeType.LOOP, new LoopNodeExecutor());
        executors.put(NodeType.TOOL, new ToolNodeExecutor());
    }

    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        NodeType type = node.getType();
        if (type == null) {
            type = parseNodeType(node);
        }
        NodeExecutor executor = executors.get(type);
        if (executor != null) {
            return executor.execute(node, inputs, state, ctx);
        }
        return inputs;
    }

    private static NodeType parseNodeType(Node node) {
        if (node.getData() instanceof Map) {
            Object t = ((Map<?, ?>) node.getData()).get("type");
            if (t != null) {
                return NodeType.valueOf(String.valueOf(t).toUpperCase().replace("-", "_"));
            }
        }
        return NodeType.TOOL;
    }
}
