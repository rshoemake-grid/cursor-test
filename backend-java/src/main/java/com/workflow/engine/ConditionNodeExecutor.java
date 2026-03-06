package com.workflow.engine;

import com.workflow.dto.ConditionConfig;
import com.workflow.dto.Node;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Executes CONDITION nodes - evaluates field vs value and returns branch.
 */
@Component
public class ConditionNodeExecutor implements NodeExecutor {

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        ConditionConfig cfg = node.getConditionConfig();
        String field = cfg != null ? cfg.getField() : null;
        String expectValue = cfg != null ? cfg.getValue() : null;

        if (field == null || field.isEmpty()) {
            return Map.of("branch", "true");
        }

        Object actual = inputs.get(field);
        if (actual == null) {
            actual = inputs.get("data");
        }
        String actualStr = actual != null ? String.valueOf(actual) : "";
        String expectStr = expectValue != null ? expectValue : "";
        boolean match = actualStr.equals(expectStr);
        return Map.of("branch", match ? "true" : "false");
    }
}
