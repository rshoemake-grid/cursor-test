package com.workflow.engine;

import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Registry for node executors - OCP compliant.
 * New node types can be added by implementing NodeExecutor and getSupportedType() without modifying this class.
 * DIP: Depends on List&lt;NodeExecutor&gt; abstraction instead of concrete implementations.
 */
@Component
public class NodeExecutorRegistry {

    private final Map<NodeType, NodeExecutor> executors = new EnumMap<>(NodeType.class);
    private final NodeTypeParser nodeTypeParser;

    public NodeExecutorRegistry(List<NodeExecutor> executorList, NodeTypeParser nodeTypeParser) {
        for (NodeExecutor executor : executorList) {
            executor.getSupportedType().ifPresent(type -> executors.put(type, executor));
        }
        this.nodeTypeParser = nodeTypeParser;
    }

    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        NodeType type = nodeTypeParser.parseNodeType(node);
        NodeExecutor executor = executors.get(type);
        if (executor != null) {
            return executor.execute(node, inputs, state, ctx);
        }
        return inputs;
    }
}
