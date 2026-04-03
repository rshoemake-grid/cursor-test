import { logger as defaultLogger } from "../../utils/logger";
import { showError as defaultShowError } from "../../utils/notifications";
import { extractApiErrorMessage } from "./apiUtils";
const extractErrorMessage = extractApiErrorMessage;
function handleApiError(error, options = {}) {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = "An error occurred",
    context,
    logger = defaultLogger,
    showError = defaultShowError,
  } = options;
  const errorMessage = extractApiErrorMessage(error, defaultMessage);
  if (logError) {
    const logContext = context ? `[${context}]` : "[Error Handler]";
    logger.error(`${logContext} API Error:`, error);
    if (error?.response) {
      logger.error(`${logContext} Error details:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });
    }
  }
  if (showNotification) {
    showError(errorMessage);
  }
  return errorMessage;
}
function handleError(error, options = {}) {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = "An unexpected error occurred",
    context,
    logger = defaultLogger,
    showError = defaultShowError,
  } = options;
  const errorMessage = extractApiErrorMessage(error, defaultMessage);
  if (logError) {
    const logContext = context ? `[${context}]` : "[Error Handler]";
    logger.error(`${logContext} Error:`, error);
  }
  if (showNotification) {
    showError(errorMessage);
  }
  return errorMessage;
}
function createSafeErrorHandler(
  handler,
  fallbackMessage = "An error occurred",
) {
  return (error) => {
    try {
      handler(error);
    } catch (handlerError) {
      defaultLogger.error(
        "[Safe Error Handler] Handler threw an error:",
        handlerError,
      );
      defaultShowError(fallbackMessage);
    }
  };
}
export {
  createSafeErrorHandler,
  extractErrorMessage,
  handleApiError,
  handleError,
};
