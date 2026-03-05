package com.workflow.engine;

import com.workflow.dto.Node;

import java.util.Map;

/**
 * Executes TOOL nodes - pass-through of inputs.
 */
public class ToolNodeExecutor implements NodeExecutor {

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        return inputs;
    }
}
