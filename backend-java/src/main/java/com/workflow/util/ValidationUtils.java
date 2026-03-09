package com.workflow.util;

import com.workflow.exception.ValidationException;
import com.workflow.util.ErrorMessages;
import org.springframework.util.StringUtils;

/**
 * DRY-16: Shared validation helpers to avoid duplicated null/empty checks.
 */
public final class ValidationUtils {

    private ValidationUtils() {
    }

    /**
     * Throws ValidationException if the string is null, empty, or whitespace-only.
     *
     * @param value     the string to validate
     * @param fieldName used in the error message
     */
    public static void requireNonEmpty(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new ValidationException(ErrorMessages.fieldRequired(fieldName));
        }
    }

    /**
     * Throws ValidationException if the object is null.
     *
     * @param obj       the object to validate
     * @param fieldName used in the error message
     */
    public static void requireNonNull(Object obj, String fieldName) {
        if (obj == null) {
            throw new ValidationException(ErrorMessages.fieldRequired(fieldName));
        }
    }
}
