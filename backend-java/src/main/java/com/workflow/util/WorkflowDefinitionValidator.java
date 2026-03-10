package com.workflow.util;

import com.workflow.exception.ValidationException;

import java.util.Map;

/**
 * Validates workflow definition structure.
 * DRY-15: Centralizes validation for nodes and edges required in definitions.
 */
public final class WorkflowDefinitionValidator {

    private WorkflowDefinitionValidator() {
    }

    /**
     * Validates that the definition contains required 'nodes' and 'edges' keys.
     *
     * @param definition the workflow definition map
     * @throws ValidationException if definition is null or missing nodes/edges
     */
    public static void validate(Map<String, Object> definition) {
        if (definition == null || !definition.containsKey("nodes") || !definition.containsKey("edges")) {
            throw new ValidationException(ErrorMessages.INVALID_WORKFLOW_DEFINITION);
        }
    }
}
