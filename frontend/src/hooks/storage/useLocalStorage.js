import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import { defaultAdapters } from '../../types/adapters';
import { readStorageItem, writeStorageItem, deleteStorageItem, parseJsonSafely, shouldHandleStorageEvent } from './useLocalStorage.utils';
import { nullishCoalesce } from '../utils/nullishCoalescing';
/**
 * Custom hook for localStorage with consistent error handling
 * Follows Dependency Inversion Principle by abstracting storage access
 */ export function useLocalStorage(key, initialValue, options) {
    const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter());
    const injectedLogger = nullishCoalesce(options?.logger, logger);
    // State to store our value
    const [storedValue, setStoredValue] = useState(()=>{
        return readStorageItem(storage, key, initialValue, injectedLogger);
    });
    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue = useCallback((value)=>{
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage (handles errors internally)
        writeStorageItem(storage, key, valueToStore, injectedLogger);
    }, [
        key,
        storedValue,
        storage,
        injectedLogger
    ]);
    // Remove value from localStorage
    const removeValue = useCallback(()=>{
        setStoredValue(initialValue);
        // Remove from storage (handles errors internally)
        deleteStorageItem(storage, key, injectedLogger);
    }, [
        key,
        initialValue,
        storage,
        injectedLogger
    ]);
    // Listen for changes to this key in other tabs/windows
    useEffect(()=>{
        if (!storage) {
            return;
        }
        const handleStorageChange = (e)=>{
            if (shouldHandleStorageEvent(e.key, key, e.newValue)) {
                const parsed = parseJsonSafely(e.newValue, injectedLogger);
                if (parsed !== null) {
                    setStoredValue(parsed);
                }
            }
        };
        storage.addEventListener('storage', handleStorageChange);
        return ()=>storage.removeEventListener('storage', handleStorageChange);
    }, [
        key,
        storage,
        injectedLogger
    ]);
    return [
        storedValue,
        setValue,
        removeValue
    ];
}
/**
 * Simple localStorage getter with error handling
 * Handles both JSON strings and plain strings (for backward compatibility)
 */ export function getLocalStorageItem(key, defaultValue, options) {
    const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter());
    const injectedLogger = nullishCoalesce(options?.logger, logger);
    return readStorageItem(storage, key, defaultValue, injectedLogger);
}
/**
 * Simple localStorage setter with error handling
 */ export function setLocalStorageItem(key, value, options) {
    const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter());
    const injectedLogger = nullishCoalesce(options?.logger, logger);
    return writeStorageItem(storage, key, value, injectedLogger);
}
/**
 * Simple localStorage remover with error handling
 */ export function removeLocalStorageItem(key, options) {
    const storage = nullishCoalesce(options?.storage, defaultAdapters.createLocalStorageAdapter());
    const injectedLogger = nullishCoalesce(options?.logger, logger);
    return deleteStorageItem(storage, key, injectedLogger);
}
