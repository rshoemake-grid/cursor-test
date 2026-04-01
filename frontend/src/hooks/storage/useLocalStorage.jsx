import { useState, useEffect, useCallback } from "react";
import { logger } from "../../utils/logger";
import { defaultAdapters } from "../../types/adapters";
import {
  readStorageItem,
  writeStorageItem,
  deleteStorageItem,
  parseJsonSafely,
  shouldHandleStorageEvent
} from "./useLocalStorage.utils";
import { nullishCoalesce } from "../utils/nullishCoalescing";
function useLocalStorage(key, initialValue, options) {
  const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter());
  const injectedLogger = nullishCoalesce(options?.logger, logger);
  const [storedValue, setStoredValue] = useState(() => {
    return readStorageItem(storage, key, initialValue, injectedLogger);
  });
  const setValue = useCallback(
    (value) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      writeStorageItem(storage, key, valueToStore, injectedLogger);
    },
    [key, storedValue, storage, injectedLogger]
  );
  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    deleteStorageItem(storage, key, injectedLogger);
  }, [key, initialValue, storage, injectedLogger]);
  useEffect(() => {
    if (!storage) {
      return;
    }
    const handleStorageChange = (e) => {
      if (shouldHandleStorageEvent(e.key, key, e.newValue)) {
        const parsed = parseJsonSafely(e.newValue, injectedLogger);
        if (parsed !== null) {
          setStoredValue(parsed);
        }
      }
    };
    storage.addEventListener("storage", handleStorageChange);
    return () => storage.removeEventListener("storage", handleStorageChange);
  }, [key, storage, injectedLogger]);
  return [storedValue, setValue, removeValue];
}
function getLocalStorageItem(key, defaultValue, options) {
  const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter());
  const injectedLogger = nullishCoalesce(options?.logger, logger);
  return readStorageItem(storage, key, defaultValue, injectedLogger);
}
function setLocalStorageItem(key, value, options) {
  const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter());
  const injectedLogger = nullishCoalesce(options?.logger, logger);
  return writeStorageItem(storage, key, value, injectedLogger);
}
function removeLocalStorageItem(key, options) {
  const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter());
  const injectedLogger = nullishCoalesce(options?.logger, logger);
  return deleteStorageItem(storage, key, injectedLogger);
}
export {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
  useLocalStorage
};
