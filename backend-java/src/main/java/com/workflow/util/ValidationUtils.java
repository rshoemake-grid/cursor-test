package com.workflow.util;

import com.workflow.exception.ValidationException;
import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * DRY-16: Shared validation helpers to avoid duplicated null/empty checks.
 */
public final class ValidationUtils {

    private ValidationUtils() {
    }

    /**
     * Trims login input (username or email typed in the username field). Password is never trimmed.
     */
    public static String normalizeLoginIdentifier(String raw) {
        return raw == null ? "" : raw.trim();
    }

    /**
     * Normalizes email for storage and lookup (trim + lowercase ASCII per RFC 5321 local-part conventions for case-insensitive domains).
     */
    public static String normalizeEmail(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toLowerCase(Locale.ROOT);
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
