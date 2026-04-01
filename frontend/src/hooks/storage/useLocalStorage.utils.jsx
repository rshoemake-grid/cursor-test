function looksLikeJson(item) {
  const trimmed = item.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith('"');
}
function parseJsonSafely(jsonString, logger) {
  if (!jsonString) {
    return null;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    if (logger && looksLikeJson(jsonString)) {
      logger.error("Failed to parse JSON:", error);
    }
    return null;
  }
}
function stringifyForStorage(value) {
  const valueToStore = value === void 0 ? null : value;
  return JSON.stringify(valueToStore);
}
function readStorageItem(storage, key, defaultValue, logger) {
  if (!storage) {
    return defaultValue;
  }
  try {
    const item = storage.getItem(key);
    if (!item) {
      return defaultValue;
    }
    try {
      return JSON.parse(item);
    } catch {
    }
    if (looksLikeJson(item)) {
      if (logger) {
        logger.warn(`localStorage key "${key}" contains invalid JSON. Returning default value.`, item);
      }
      return defaultValue;
    }
    if (typeof defaultValue === "string" || defaultValue === null) {
      return item;
    }
    if (logger) {
      logger.warn(`localStorage key "${key}" contains plain string but expected JSON. Returning default value.`, item);
    }
    return defaultValue;
  } catch (error) {
    if (logger) {
      logger.error(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
  }
}
function writeStorageItem(storage, key, value, logger) {
  if (!storage) {
    return false;
  }
  try {
    const valueToStoreString = stringifyForStorage(value);
    storage.setItem(key, valueToStoreString);
    return true;
  } catch (error) {
    if (logger) {
      logger.error(`Error setting localStorage key "${key}":`, error);
    }
    return false;
  }
}
function deleteStorageItem(storage, key, logger) {
  if (!storage) {
    return false;
  }
  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    if (logger) {
      logger.error(`Error removing localStorage key "${key}":`, error);
    }
    return false;
  }
}
function shouldHandleStorageEvent(eventKey, targetKey, newValue) {
  return eventKey === targetKey && newValue !== null;
}
export {
  deleteStorageItem,
  looksLikeJson,
  parseJsonSafely,
  readStorageItem,
  shouldHandleStorageEvent,
  stringifyForStorage,
  writeStorageItem
};
