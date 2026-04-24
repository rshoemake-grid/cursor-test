package com.workflow.engine;

import com.workflow.dto.Node;
import com.workflow.dto.NodeType;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Executes TOOL nodes - pass-through of inputs.
 */
@Component
public class ToolNodeExecutor implements NodeExecutor {

    @Override
    public Optional<NodeType> getSupportedType() {
        return Optional.empty();
    }

    @Override
    public List<NodeType> getSupportedTypes() {
        return List.of(
                NodeType.TOOL,
                NodeType.DATABASE,
                NodeType.FIREBASE,
                NodeType.BIGQUERY);
    }

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        return inputs;
    }
}
