package com.workflow.util;

import com.workflow.exception.ForbiddenException;

/**
 * DRY: Shared ownership check helpers. Throws ForbiddenException when condition fails.
 * Used by WorkflowOwnershipService and TemplateOwnershipService.
 */
public final class OwnershipUtils {

    private OwnershipUtils() {
    }

    /**
     * Throw ForbiddenException if condition is false.
     *
     * @param condition must be true to pass
     * @param message   error message when condition is false
     * @throws ForbiddenException when condition is false
     */
    public static void require(boolean condition, String message) {
        if (!condition) {
            throw new ForbiddenException(message);
        }
    }
}
