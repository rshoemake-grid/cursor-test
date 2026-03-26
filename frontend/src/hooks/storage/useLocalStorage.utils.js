/**
 * LocalStorage Utility Functions
 * Extracted from useLocalStorage.ts to improve testability and reduce complexity
 */ /**
 * Parse JSON with error handling
 * Returns parsed value or null if parsing fails
 */ export function parseJsonSafely(jsonString, logger) {
    if (!jsonString) {
        return null;
    }
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        if (logger) {
            logger.error('Failed to parse JSON:', error);
        }
        return null;
    }
}
/**
 * Check if string looks like JSON (starts with { or [)
 */ export function looksLikeJson(item) {
    const trimmed = item.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
}
/**
 * Convert value to storage-safe string
 * Handles undefined by converting to null
 */ export function stringifyForStorage(value) {
    // JSON.stringify(undefined) returns undefined, which causes issues
    // Convert undefined to null for storage
    const valueToStore = value === undefined ? null : value;
    return JSON.stringify(valueToStore);
}
/**
 * Read item from storage with error handling
 */ export function readStorageItem(storage, key, defaultValue, logger) {
    if (!storage) {
        return defaultValue;
    }
    try {
        const item = storage.getItem(key);
        if (!item) {
            return defaultValue;
        }
        // Try to parse as JSON first
        const parsed = parseJsonSafely(item, logger);
        if (parsed !== null) {
            return parsed;
        }
        // If JSON.parse fails, it might be a plain string stored directly
        // Check if it looks like it was meant to be JSON
        if (looksLikeJson(item)) {
            // Invalid JSON that was meant to be JSON - return default
            if (logger) {
                logger.warn(`localStorage key "${key}" contains invalid JSON. Returning default value.`, item);
            }
            return defaultValue;
        }
        // Plain string that was stored directly (for backward compatibility)
        // Only return as-is if default is also a string type
        if (typeof defaultValue === 'string' || defaultValue === null) {
            return item;
        }
        // For non-string types, return default
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
/**
 * Write item to storage with error handling
 */ export function writeStorageItem(storage, key, value, logger) {
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
/**
 * Remove item from storage with error handling
 */ export function deleteStorageItem(storage, key, logger) {
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
/**
 * Check if storage event should be handled
 */ export function shouldHandleStorageEvent(eventKey, targetKey, newValue) {
    return eventKey === targetKey && newValue !== null;
}
