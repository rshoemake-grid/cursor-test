/**
 * Error Handling Utilities for Hooks
 * Common error handling patterns for hooks
 */ import { logger as defaultLogger } from '../../utils/logger';
import { showError as defaultShowError } from '../../utils/notifications';
import { extractApiErrorMessage } from './apiUtils';
/** Re-export for backward compatibility. Use extractApiErrorMessage from apiUtils. */ export const extractErrorMessage = extractApiErrorMessage;
/**
 * Handle API errors with consistent logging and notifications
 * 
 * @param error Error object
 * @param options Error handling options
 * @returns Extracted error message
 */ export function handleApiError(error, options = {}) {
    const { showNotification = true, logError = true, defaultMessage = 'An error occurred', context, logger = defaultLogger, showError = defaultShowError } = options;
    const errorMessage = extractApiErrorMessage(error, defaultMessage);
    // Log error with context if provided
    if (logError) {
        const logContext = context ? `[${context}]` : '[Error Handler]';
        logger.error(`${logContext} API Error:`, error);
        // Log additional error details if available
        if (error?.response) {
            logger.error(`${logContext} Error details:`, {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                url: error.config?.url
            });
        }
    }
    // Show notification if requested
    if (showNotification) {
        showError(errorMessage);
    }
    return errorMessage;
}
/**
 * Handle generic errors with consistent formatting
 * 
 * @param error Error object or string
 * @param options Error handling options
 * @returns Extracted error message
 */ export function handleError(error, options = {}) {
    const { showNotification = true, logError = true, defaultMessage = 'An unexpected error occurred', context, logger = defaultLogger, showError = defaultShowError } = options;
    const errorMessage = extractApiErrorMessage(error, defaultMessage);
    if (logError) {
        const logContext = context ? `[${context}]` : '[Error Handler]';
        logger.error(`${logContext} Error:`, error);
    }
    if (showNotification) {
        showError(errorMessage);
    }
    return errorMessage;
}
/**
 * Create a safe error handler that won't throw
 * Useful for error handlers in hooks that must not throw synchronously
 * 
 * @param handler Error handler function
 * @param fallbackMessage Fallback message if handler fails
 * @returns Safe error handler function
 */ export function createSafeErrorHandler(handler, fallbackMessage = 'An error occurred') {
    return (error)=>{
        try {
            handler(error);
        } catch (handlerError) {
            // If the handler itself throws, log it but don't rethrow
            defaultLogger.error('[Safe Error Handler] Handler threw an error:', handlerError);
            defaultShowError(fallbackMessage);
        }
    };
}
