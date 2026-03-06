package com.workflow.engine;

import com.workflow.dto.Node;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Executes TOOL nodes - pass-through of inputs.
 */
@Component
public class ToolNodeExecutor implements NodeExecutor {

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        return inputs;
    }
}
