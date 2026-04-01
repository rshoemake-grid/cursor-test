const DEFAULT_ERROR_MESSAGE = "An error occurred";
const DEFAULT_UNEXPECTED_ERROR_MESSAGE = "An unexpected error occurred";
const ERROR_CONTEXT_PREFIX = "[Error Handler]";
const STORAGE_ERROR_PREFIX = "[Storage Error Handler]";
function formatStorageErrorMessage(operation, errorMsg) {
  return `Failed to ${operation} storage: ${errorMsg}`;
}
export {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_UNEXPECTED_ERROR_MESSAGE,
  ERROR_CONTEXT_PREFIX,
  STORAGE_ERROR_PREFIX,
  formatStorageErrorMessage
};
