package com.workflow.engine;

import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

/**
 * Registry for node executors - OCP compliant.
 * New node types can be added by registering an executor without modifying callers.
 * DIP-2: Executors injected via constructor instead of direct instantiation.
 * OCP-3: NodeType parsing delegated to NodeTypeParser.
 */
@Component
public class NodeExecutorRegistry {

    private final Map<NodeType, NodeExecutor> executors = new EnumMap<>(NodeType.class);
    private final NodeTypeParser nodeTypeParser;

    public NodeExecutorRegistry(AgentNodeExecutor agentExecutor,
                               ConditionNodeExecutor conditionExecutor,
                               LoopNodeExecutor loopExecutor,
                               ToolNodeExecutor toolExecutor,
                               NodeTypeParser nodeTypeParser) {
        executors.put(NodeType.AGENT, agentExecutor);
        executors.put(NodeType.CONDITION, conditionExecutor);
        executors.put(NodeType.LOOP, loopExecutor);
        executors.put(NodeType.TOOL, toolExecutor);
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
