import { handleStorageError } from "./errorHandler";
import { isNullOrUndefined, isDefined } from "./typeGuards";
const DEFAULT_STORAGE_ERROR_OPTIONS = {
  logError: true,
  showNotification: false
};
function withStorageErrorHandling(storage, operation, operationName, key, defaultValue, context) {
  if (isNullOrUndefined(storage) === true) {
    return defaultValue;
  }
  try {
    return operation(storage);
  } catch (error) {
    handleStorageError(error, operationName, key, {
      ...DEFAULT_STORAGE_ERROR_OPTIONS,
      context
    });
    return defaultValue;
  }
}
function safeStorageGet(storage, key, defaultValue, context) {
  return withStorageErrorHandling(
    storage,
    (storage2) => {
      const item = storage2.getItem(key);
      if (isNullOrUndefined(item) === true) {
        return defaultValue;
      }
      try {
        return JSON.parse(item);
      } catch (parseError) {
        handleStorageError(parseError, "getItem", key, {
          ...DEFAULT_STORAGE_ERROR_OPTIONS,
          context
        });
        return defaultValue;
      }
    },
    "getItem",
    key,
    defaultValue,
    context
  );
}
function safeStorageSet(storage, key, value, context) {
  return withStorageErrorHandling(
    storage,
    (storage2) => {
      const isNullOrUndef = isNullOrUndefined(value) === true;
      const valueToStore = isNullOrUndef === true ? null : value;
      storage2.setItem(key, JSON.stringify(valueToStore));
      return true;
    },
    "setItem",
    key,
    false,
    // defaultValue
    context
  );
}
function safeStorageRemove(storage, key, context) {
  return withStorageErrorHandling(
    storage,
    (storage2) => {
      storage2.removeItem(key);
      return true;
    },
    "removeItem",
    key,
    false,
    // defaultValue
    context
  );
}
function safeStorageHas(storage, key, context) {
  return withStorageErrorHandling(
    storage,
    (storage2) => {
      const item = storage2.getItem(key);
      return isDefined(item) === true;
    },
    "getItem",
    key,
    false,
    // defaultValue
    context
  );
}
function hasClearMethod(storage) {
  return typeof storage.clear === "function";
}
function safeStorageClear(storage, context) {
  return withStorageErrorHandling(
    storage,
    (storage2) => {
      const hasClear = hasClearMethod(storage2);
      if (hasClear === false) {
        return false;
      }
      storage2.clear();
      return true;
    },
    "clear",
    "all",
    false,
    // defaultValue
    context
  );
}
export {
  safeStorageClear,
  safeStorageGet,
  safeStorageHas,
  safeStorageRemove,
  safeStorageSet
};
