package com.workflow.engine;

import com.workflow.constants.WorkflowConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.dto.ConditionConfig;
import com.workflow.dto.Node;
import com.workflow.util.NodeConfigUtils;
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

    private final ObjectMapper objectMapper;

    public ConditionNodeExecutor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<NodeType> getSupportedType() {
        return Optional.of(NodeType.CONDITION);
    }

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        ConditionConfig cfg = NodeConfigUtils.resolveConditionConfig(node, objectMapper);
        if (cfg == null) {
            throw new IllegalStateException("Node " + node.getId() + " requires condition_config");
        }
        String field = ObjectUtils.safeGet(cfg, ConditionConfig::getField);
        if (field == null || field.isBlank()) {
            throw new IllegalStateException("Condition node " + node.getId() + " requires 'field' in condition_config");
        }

        Object fieldValue = ConditionFieldResolver.resolve(inputs, field);
        String conditionType = ObjectUtils.orDefault(cfg.getConditionType(), "equals");
        String compareValue = ObjectUtils.orDefault(cfg.getValue(), "");
        boolean result = ConditionEvaluationUtils.evaluate(conditionType, fieldValue, compareValue, cfg.getCustomExpression());
        return Map.of(
                BRANCH_KEY, result ? WorkflowConstants.BRANCH_TRUE : WorkflowConstants.BRANCH_FALSE,
                "condition_result", result,
                "field_value", fieldValue == null ? "" : fieldValue,
                "evaluated_value", compareValue
        );
    }
}
