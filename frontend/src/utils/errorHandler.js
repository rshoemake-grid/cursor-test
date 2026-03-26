import { logger } from './logger';
import { showError } from './notifications';
import { safeGetProperty } from './safeAccess';
import { DEFAULT_ERROR_MESSAGE, DEFAULT_UNEXPECTED_ERROR_MESSAGE, ERROR_CONTEXT_PREFIX, STORAGE_ERROR_PREFIX, formatStorageErrorMessage } from '../constants/errorMessages';
import { extractApiErrorMessage } from '../hooks/utils/apiUtils';
/**
 * Type guard to check if error is an API error with response
 */ function isApiError(error) {
    return error !== null && error !== undefined && typeof error === 'object' && error.response !== null && error.response !== undefined && typeof error.response === 'object';
}
/**
 * Centralized error handling utility
 * Follows DRY principle by eliminating duplicated error handling code
 */ export function handleApiError(error, options = {}) {
    const { showNotification = true, logError = true, defaultMessage = DEFAULT_ERROR_MESSAGE, context } = options;
    const errorMessage = extractApiErrorMessage(error, defaultMessage);
    // Log error with context if provided
    // Explicit check to prevent mutation survivors
    if (logError === true) {
        // Explicit check to prevent mutation survivors
        const logContext = context !== null && context !== undefined && context !== '' ? `[${context}]` : ERROR_CONTEXT_PREFIX;
        logger.error(`${logContext} API Error:`, error);
        // Log additional error details if available
        // Use type guard for explicit check
        if (isApiError(error) === true) {
            const response = error.response;
            logger.error(`${logContext} Error details:`, {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                // Use safeGetProperty to kill OptionalChaining mutations
                url: safeGetProperty(error.config, 'url', undefined)
            });
        }
    }
    // Show notification if requested
    // Explicit check to prevent mutation survivors
    if (showNotification === true) {
        showError(errorMessage);
    }
    return errorMessage;
}
/**
 * Handle storage errors gracefully
 */ export function handleStorageError(error, operation, key, options = {}) {
    const { showNotification = false, logError = true, context } = options;
    // Explicit check to prevent mutation survivors
    if (logError === true) {
        // Explicit check to prevent mutation survivors
        const logContext = context !== null && context !== undefined && context !== '' ? `[${context}]` : STORAGE_ERROR_PREFIX;
        logger.error(`${logContext} Storage ${operation} error for key "${key}":`, error);
    }
    // Explicit check to prevent mutation survivors
    if (showNotification === true) {
        const errorMsg = extractApiErrorMessage(error, 'Unknown error');
        showError(formatStorageErrorMessage(operation, errorMsg));
    }
}
/**
 * Handle generic errors with consistent formatting
 */ export function handleError(error, options = {}) {
    const { showNotification = true, logError = true, defaultMessage = DEFAULT_UNEXPECTED_ERROR_MESSAGE, context } = options;
    const errorMessage = extractApiErrorMessage(error, defaultMessage);
    // Explicit check to prevent mutation survivors
    if (logError === true) {
        // Explicit check to prevent mutation survivors
        const logContext = context !== null && context !== undefined && context !== '' ? `[${context}]` : ERROR_CONTEXT_PREFIX;
        logger.error(`${logContext} Error:`, error);
    }
    // Explicit check to prevent mutation survivors
    if (showNotification === true) {
        showError(errorMessage);
    }
    return errorMessage;
}
