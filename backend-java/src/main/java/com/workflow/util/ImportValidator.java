package com.workflow.util;

import com.workflow.constants.WorkflowConstants;
import com.workflow.exception.ValidationException;

import java.util.Map;

/**
 * SRP: Validates import request body and definition structure.
 * Extracted from ImportExportService.
 */
public final class ImportValidator {

    private ImportValidator() {
    }

    /**
     * Validate import body has required structure and size limits.
     */
    public static void validateBody(Map<String, Object> body) {
        if (body == null || body.isEmpty()) {
            throw new ValidationException(ErrorMessages.IMPORT_BODY_EMPTY);
        }
        if (!body.containsKey("definition")) {
            throw new ValidationException(ErrorMessages.IMPORT_BODY_MISSING_DEFINITION);
        }
        Object def = body.get("definition");
        if (!(def instanceof Map)) {
            throw new ValidationException(ErrorMessages.IMPORT_DEFINITION_NOT_OBJECT);
        }
        Map<String, Object> definition = JsonStateUtils.getMap(body, "definition");
        if (definition.size() > WorkflowConstants.MAX_IMPORT_DEFINITION_KEYS) {
            throw new ValidationException(ErrorMessages.IMPORT_DEFINITION_TOO_LARGE);
        }
    }
}
