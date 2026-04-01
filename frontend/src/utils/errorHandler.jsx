import { logger } from "./logger";
import { showError } from "./notifications";
import { safeGetProperty } from "./safeAccess";
import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_UNEXPECTED_ERROR_MESSAGE,
  ERROR_CONTEXT_PREFIX,
  STORAGE_ERROR_PREFIX,
  formatStorageErrorMessage
} from "../constants/errorMessages";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
function isApiError(error) {
  return error !== null && error !== void 0 && typeof error === "object" && error.response !== null && error.response !== void 0 && typeof error.response === "object";
}
function handleApiError(error, options = {}) {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = DEFAULT_ERROR_MESSAGE,
    context
  } = options;
  const errorMessage = extractApiErrorMessage(error, defaultMessage);
  if (logError === true) {
    const logContext = context !== null && context !== void 0 && context !== "" ? `[${context}]` : ERROR_CONTEXT_PREFIX;
    logger.error(`${logContext} API Error:`, error);
    if (isApiError(error) === true) {
      const response = error.response;
      logger.error(`${logContext} Error details:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        // Use safeGetProperty to kill OptionalChaining mutations
        url: safeGetProperty(error.config, "url", void 0)
      });
    }
  }
  if (showNotification === true) {
    showError(errorMessage);
  }
  return errorMessage;
}
function handleStorageError(error, operation, key, options = {}) {
  const {
    showNotification = false,
    // Storage errors usually don't need user notification
    logError = true,
    context
  } = options;
  if (logError === true) {
    const logContext = context !== null && context !== void 0 && context !== "" ? `[${context}]` : STORAGE_ERROR_PREFIX;
    logger.error(`${logContext} Storage ${operation} error for key "${key}":`, error);
  }
  if (showNotification === true) {
    const errorMsg = extractApiErrorMessage(error, "Unknown error");
    showError(formatStorageErrorMessage(operation, errorMsg));
  }
}
function handleError(error, options = {}) {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = DEFAULT_UNEXPECTED_ERROR_MESSAGE,
    context
  } = options;
  const errorMessage = extractApiErrorMessage(error, defaultMessage);
  if (logError === true) {
    const logContext = context !== null && context !== void 0 && context !== "" ? `[${context}]` : ERROR_CONTEXT_PREFIX;
    logger.error(`${logContext} Error:`, error);
  }
  if (showNotification === true) {
    showError(errorMessage);
  }
  return errorMessage;
}
export {
  handleApiError,
  handleError,
  handleStorageError
};
