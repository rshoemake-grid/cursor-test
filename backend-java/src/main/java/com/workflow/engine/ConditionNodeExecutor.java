package com.workflow.engine;

import com.workflow.dto.ConditionConfig;
import com.workflow.dto.Node;
import com.workflow.util.ObjectUtils;
import com.workflow.dto.NodeType;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * Executes CONDITION nodes - evaluates field vs value and returns branch.
 */
@Component
public class ConditionNodeExecutor implements NodeExecutor {

    private static final String BRANCH_KEY = "branch";
    private static final String BRANCH_TRUE = "true";
    private static final String BRANCH_FALSE = "false";

    @Override
    public Optional<NodeType> getSupportedType() {
        return Optional.of(NodeType.CONDITION);
    }

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        ConditionConfig cfg = node.getConditionConfig();
        String field = ObjectUtils.safeGet(cfg, ConditionConfig::getField);
        String expectValue = ObjectUtils.safeGet(cfg, ConditionConfig::getValue);

        if (field == null || field.isEmpty()) {
            return Map.of(BRANCH_KEY, BRANCH_TRUE);
        }

        Object actual = inputs.get(field);
        if (actual == null) {
            actual = inputs.get("data");
        }
        String actualStr = ObjectUtils.toStringOrDefault(actual, "");
        String expectStr = ObjectUtils.orDefault(expectValue, "");
        boolean match = actualStr.equals(expectStr);
        return Map.of(BRANCH_KEY, match ? BRANCH_TRUE : BRANCH_FALSE);
    }
}
